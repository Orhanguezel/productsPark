# MySQL/MariaDB Migration Prompt for Claude AI

## 🎯 PROJECT OVERVIEW

I have a complete e-commerce platform built with:
- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Current Backend:** Metahub (PostgreSQL) with 25 Edge Functions (Deno)
- **Current Auth:** Metahub Auth
- **Current Storage:** Metahub Storage
- **Current Database:** PostgreSQL with 32 tables

**Goal:** Migrate from Metahub/PostgreSQL to MySQL/MariaDB with a custom Node.js backend while keeping the frontend mostly intact.

---

## 📊 CURRENT DATABASE STRUCTURE (32 TABLES)

### Core Tables:
1. **products** - Product catalog with variants, pricing, stock
2. **categories** - Hierarchical product categories
3. **orders** - Customer orders with payment tracking
4. **order_items** - Individual items in orders with delivery status
5. **cart_items** - Shopping cart for users
6. **profiles** - User profile data (linked to auth.users)
7. **user_roles** - Role-based access control (admin, user)

### E-Commerce Features:
8. **coupons** - Discount codes and promotions
9. **product_options** - Product variants (size, color, etc.)
10. **product_stock** - Inventory management with stock codes
11. **activation_codes** - Digital product activation keys
12. **product_reviews** - Customer reviews and ratings
13. **product_faqs** - Product-specific FAQ entries

### Payment & Wallet:
14. **payment_requests** - Manual payment proof uploads
15. **wallet_deposit_requests** - User wallet deposit requests
16. **wallet_transactions** - Wallet transaction history

### Content Management:
17. **blog_posts** - Blog articles with SEO
18. **custom_pages** - Custom CMS pages
19. **email_templates** - Customizable email templates
20. **popups** - Marketing campaign popups
21. **topbar_settings** - Promotional top bar

### Navigation & UI:
22. **menu_items** - Dynamic menu management
23. **footer_sections** - Footer link sections
24. **fake_order_notifications** - Social proof notifications

### Support System:
25. **support_tickets** - Customer support tickets
26. **ticket_replies** - Ticket conversation threads
27. **notifications** - User notifications

### API & Integrations:
28. **api_providers** - Third-party API configurations (PayTR, Shopier, TurkPin, SMM panels)

### Site Configuration:
29. **site_settings** - System-wide settings (JSONB key-value store)

### System Management:
30. **system_version** - Application version tracking
31. **update_history** - System update logs
32. **update_snapshots** - Database backups for rollback

---

## 🔍 CURRENT METAHUB FEATURES TO MIGRATE

### Authentication System:
- Email/password authentication
- JWT token management
- Password reset functionality
- Session persistence
- Row Level Security (RLS) policies on all tables

### Storage System:
- **Buckets:** `logos`, `product-images`, `blog-images` (all public)
- Image uploads with optimization
- Public URL generation

### Edge Functions (25 total):
1. **paytr-get-token** - PayTR payment gateway
2. **paytr-callback** - PayTR webhook handler
3. **paytr-havale-get-token** - PayTR bank transfer
4. **shopier-create-payment** - Shopier payment
5. **shopier-callback** - Shopier webhook
6. **turkpin-create-order** - TurkPin epin orders
7. **turkpin-check-status** - TurkPin order status
8. **turkpin-product-list** - TurkPin product catalog
9. **turkpin-game-list** - TurkPin game list
10. **turkpin-balance** - TurkPin balance check
11. **turkpin-cron-check** - Auto order status updates
12. **smm-api-order** - SMM panel order creation
13. **smm-api-status** - SMM panel order status
14. **smm-api-balance** - SMM panel balance
15. **send-email** - SMTP email sender
16. **test-smtp** - SMTP configuration test
17. **welcome-email** - New user welcome email
18. **manual-delivery-email** - Manual delivery notification
19. **send-telegram-notification** - Telegram bot integration
20. **sitemap** - Dynamic sitemap generator
21. **backup-database** - Database backup
22. **check-updates** - System update checker
23. **apply-update** - System update application
24. **rollback-update** - System update rollback
25. **delete-user** - User account deletion
26. **delete-user-orders** - Bulk order deletion

### Database Functions:
- `update_updated_at_column()` - Auto-update timestamps
- `exec_sql()` - Dynamic SQL execution (admin)
- `has_role()` - Role checking (security definer)
- `assign_activation_code()` - Digital product delivery
- `assign_stock_to_order()` - Stock assignment
- `handle_new_user()` - Auto-create profile on signup

---

## 🎯 MIGRATION REQUIREMENTS

### Phase 1: Backend API Creation (Node.js + Express)

**Tech Stack Requirements:**
- Node.js 18+ with TypeScript
- Express.js or Fastify framework
- Prisma ORM for MySQL/MariaDB
- JWT authentication (jsonwebtoken + bcrypt)
- Zod for request validation
- Multer + Sharp for file uploads
- Morgan for logging
- Helmet for security headers
- CORS middleware
- Rate limiting (express-rate-limit)

**Database Requirements:**
- MySQL 8.0+ or MariaDB 10.6+
- InnoDB storage engine
- UTF-8mb4 charset
- Foreign key constraints
- Indexes for performance

**API Structure:**
```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Prisma client
│   │   ├── jwt.ts               # JWT config
│   │   ├── upload.ts            # Multer config
│   │   └── env.ts               # Environment validation
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification
│   │   ├── admin.ts             # Admin role check
│   │   ├── validation.ts        # Zod validation
│   │   ├── errorHandler.ts     # Global error handler
│   │   └── rateLimit.ts         # Rate limiting
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.validation.ts
│   │   ├── products/
│   │   ├── categories/
│   │   ├── orders/
│   │   ├── cart/
│   │   ├── users/
│   │   ├── coupons/
│   │   ├── blog/
│   │   ├── support/
│   │   ├── payments/
│   │   ├── wallet/
│   │   ├── admin/
│   │   └── webhooks/           # Edge function replacements
│   ├── utils/
│   │   ├── email.ts            # Nodemailer wrapper
│   │   ├── telegram.ts         # Telegram bot
│   │   ├── encryption.ts       # Data encryption
│   │   └── helpers.ts
│   ├── prisma/
│   │   ├── schema.prisma       # MySQL schema
│   │   └── migrations/
│   └── server.ts
└── package.json
```

**Required Endpoints (90+ total):**

**Auth Module:**
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh-token
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/me

**Products Module:**
- GET /api/products (with filters, pagination)
- GET /api/products/:id
- GET /api/products/slug/:slug
- POST /api/admin/products (admin)
- PUT /api/admin/products/:id (admin)
- DELETE /api/admin/products/:id (admin)
- GET /api/products/:id/reviews
- POST /api/products/:id/reviews
- GET /api/products/:id/faqs

**Categories Module:**
- GET /api/categories
- GET /api/categories/:id
- GET /api/categories/slug/:slug
- POST /api/admin/categories (admin)
- PUT /api/admin/categories/:id (admin)
- DELETE /api/admin/categories/:id (admin)

**Orders Module:**
- GET /api/orders (user's orders)
- GET /api/orders/:id
- POST /api/orders
- GET /api/admin/orders (admin, all orders)
- PUT /api/admin/orders/:id/status (admin)
- GET /api/orders/:id/download (digital delivery)

**Cart Module:**
- GET /api/cart
- POST /api/cart/items
- PUT /api/cart/items/:id
- DELETE /api/cart/items/:id
- DELETE /api/cart/clear

**Coupons Module:**
- POST /api/coupons/validate
- GET /api/admin/coupons (admin)
- POST /api/admin/coupons (admin)

**Blog Module:**
- GET /api/blog/posts
- GET /api/blog/posts/:slug
- POST /api/admin/blog/posts (admin)

**Support Module:**
- GET /api/support/tickets
- POST /api/support/tickets
- GET /api/support/tickets/:id
- POST /api/support/tickets/:id/replies

**Wallet Module:**
- GET /api/wallet/balance
- GET /api/wallet/transactions
- POST /api/wallet/deposit-request

**Payments Module:**
- POST /api/payments/paytr/create
- POST /api/payments/paytr/callback
- POST /api/payments/shopier/create
- POST /api/payments/shopier/callback

**API Providers Module:**
- POST /api/integrations/turkpin/order
- POST /api/integrations/turkpin/status
- POST /api/integrations/smm/order
- POST /api/integrations/smm/status

**Admin Module:**
- GET /api/admin/dashboard/stats
- GET /api/admin/users
- PUT /api/admin/users/:id/role
- GET /api/admin/settings
- PUT /api/admin/settings

**File Upload:**
- POST /api/upload/product-image
- POST /api/upload/blog-image
- POST /api/upload/logo

---

### Phase 2: Prisma Schema for MySQL

**Critical Requirements:**
1. All tables must use UUID as primary key
2. Created_at and updated_at timestamps on all tables
3. Proper foreign key constraints with ON DELETE CASCADE
4. Indexes on frequently queried columns
5. JSONB fields converted to JSON type
6. Enum types defined properly
7. Text fields for long content (@db.Text)
8. Decimal fields for prices (@db.Decimal(10, 2))

**Example Schema Structure:**
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum AppRole {
  admin
  moderator
  user
}

enum ProductType {
  digital
  epin
  topup
  smm
  other
}

model User {
  id                String              @id @default(uuid())
  email             String              @unique
  password_hash     String
  created_at        DateTime            @default(now())
  updated_at        DateTime            @updatedAt
  
  profile           Profile?
  roles             UserRole[]
  orders            Order[]
  cart_items        CartItem[]
  support_tickets   SupportTicket[]
  
  @@map("users")
}

model Profile {
  id            String    @id
  user_id       String    @unique
  full_name     String?
  phone         String?
  avatar_url    String?
  wallet_balance Decimal  @default(0) @db.Decimal(10, 2)
  is_active     Boolean   @default(true)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt
  
  user          User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@map("profiles")
}

// ... (continue for all 32 tables)
```

---

### Phase 3: Frontend Migration Strategy

**Current Frontend Structure:**
- 87 files use direct Metahub queries
- 428 total Metahub API calls
- Authentication via useAuth hook
- Direct database queries via metahub.from()
- Edge function calls via metahub.functions.invoke()
- Storage uploads via metahub.storage.from()

**Required Frontend Changes:**

1. **Create API Client Layer:**
```typescript
// src/lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

2. **Update Authentication Hook:**
```typescript
// src/hooks/useAuth.ts
// Replace Metahub auth with JWT auth
const login = async (email: string, password: string) => {
  const { data } = await apiClient.post('/api/auth/login', { email, password });
  localStorage.setItem('auth_token', data.token);
  setUser(data.user);
};

const signOut = async () => {
  await apiClient.post('/api/auth/logout');
  localStorage.removeItem('auth_token');
  setUser(null);
};
```

3. **Replace All Metahub Queries:**
```typescript
// ❌ Before (Metahub):
const { data, error } = await metahub
  .from("products")
  .select("*")
  .eq("is_active", true)
  .order("created_at", { ascending: false });

// ✅ After (REST API):
const { data } = await apiClient.get("/api/products", {
  params: { is_active: true, sort: "-created_at" }
});
```

4. **Replace Storage Uploads:**
```typescript
// ❌ Before (Metahub Storage):
const { data } = await metahub.storage
  .from('product-images')
  .upload(fileName, file);

// ✅ After (Multer):
const formData = new FormData();
formData.append('file', file);
const { data } = await apiClient.post('/api/upload/product-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

5. **Replace Edge Function Calls:**
```typescript
// ❌ Before (Metahub Edge Function):
const { data } = await metahub.functions.invoke('paytr-get-token', {
  body: { order_id: orderId }
});

// ✅ After (Backend Endpoint):
const { data } = await apiClient.post('/api/payments/paytr/create', {
  order_id: orderId
});
```

**Files Requiring Updates (87 files):**
- src/hooks/useAuth.ts
- src/hooks/useCart.tsx
- src/pages/Products.tsx
- src/pages/ProductDetail.tsx
- src/pages/Checkout.tsx
- src/pages/Cart.tsx
- src/pages/Dashboard.tsx
- src/pages/UserOrderDetail.tsx
- src/pages/Support.tsx
- src/pages/Blog.tsx
- src/pages/BlogDetail.tsx
- src/components/admin/ProductManagement.tsx
- src/components/admin/CategoryManagement.tsx
- src/components/admin/OrderManagement.tsx
- src/components/admin/CouponManagement.tsx
- src/components/admin/BlogManagement.tsx
- src/components/admin/TicketManagement.tsx
- src/components/admin/ApiProviderManagement.tsx
- src/pages/admin/ProductList.tsx
- src/pages/admin/ProductForm.tsx
- src/pages/admin/CategoryList.tsx
- src/pages/admin/CategoryForm.tsx
- src/pages/admin/OrderList.tsx
- src/pages/admin/OrderDetail.tsx
- src/pages/admin/CouponList.tsx
- src/pages/admin/CouponForm.tsx
- src/pages/admin/BlogList.tsx
- src/pages/admin/BlogForm.tsx
- src/pages/admin/TicketList.tsx
- src/pages/admin/TicketDetail.tsx
- src/pages/admin/UserList.tsx
- src/pages/admin/UserEdit.tsx
- src/pages/admin/Settings.tsx
- src/pages/admin/Reports.tsx
- src/pages/admin/ApiProviderList.tsx
- src/pages/admin/ApiProviderForm.tsx
- src/pages/admin/EmailTemplateList.tsx
- src/pages/admin/EmailTemplateForm.tsx
- src/pages/admin/PopupList.tsx
- src/pages/admin/PopupForm.tsx
- src/pages/admin/PageList.tsx
- src/pages/admin/PageForm.tsx
- src/pages/admin/MenuManagement.tsx
- src/pages/admin/HomeSettings.tsx
- src/pages/admin/BackupManagement.tsx
- src/pages/admin/UpdateManagement.tsx
- src/pages/admin/DepositRequestList.tsx
- src/pages/admin/PaymentRequestList.tsx
- src/pages/admin/FakeNotificationList.tsx
- src/pages/admin/DeleteUserOrders.tsx
- src/pages/admin/TurkpinSettings.tsx
- src/components/home/FeaturedProducts.tsx
- src/components/home/FeaturedCategories.tsx
- src/components/home/Blog.tsx
- src/components/CartDrawer.tsx
- src/components/FakeOrderNotification.tsx
- src/components/CampaignPopup.tsx
- + 35 more files

---

### Phase 4: Data Migration Script

**Requirements:**
- Migrate all data from PostgreSQL to MySQL
- Preserve UUIDs
- Maintain referential integrity
- Migrate in correct order (parent tables first)
- Handle JSONB to JSON conversion
- Migrate file storage to local/S3
- Create comprehensive backup before migration

**Migration Order:**
1. users → profiles → user_roles
2. categories
3. api_providers
4. products → product_options → product_stock → activation_codes → product_reviews → product_faqs
5. coupons
6. cart_items
7. orders → order_items
8. payment_requests → wallet_deposit_requests → wallet_transactions
9. support_tickets → ticket_replies
10. blog_posts
11. custom_pages
12. email_templates
13. menu_items → footer_sections
14. popups
15. topbar_settings
16. fake_order_notifications
17. notifications
18. site_settings
19. system_version → update_history → update_snapshots

---

### Phase 5: Security Requirements

**Authentication:**
- JWT tokens with 7-day expiry
- Refresh token mechanism
- Password hashing with bcrypt (12 rounds)
- Password reset with time-limited tokens
- Rate limiting on auth endpoints (5 requests/15min)

**Authorization:**
- Role-based access control (admin, user)
- Protected routes on frontend
- Protected endpoints on backend
- Admin verification middleware
- Owner verification for user resources

**Data Protection:**
- Sensitive settings encrypted at rest
- SQL injection prevention (Prisma)
- XSS prevention (input sanitization)
- CORS configuration
- Helmet security headers
- Rate limiting on all endpoints

**Payment Security:**
- Webhook signature verification
- Payment amount validation
- Order ownership verification
- Transaction logging

---

### Phase 6: Testing Requirements

**Unit Tests:**
- All service layer functions
- All utility functions
- Authentication logic
- Payment processing logic

**Integration Tests:**
- API endpoint testing
- Database operations
- File upload functionality
- Email sending

**E2E Tests:**
- User registration/login flow
- Product browsing and purchase
- Admin panel operations
- Payment gateway integration

---

### Phase 7: Deployment Requirements

**Backend Deployment:**
- Node.js 18+ environment
- PM2 process manager
- Nginx reverse proxy
- SSL certificate (Let's Encrypt)
- Environment variables configuration
- Database connection pooling
- Log rotation
- Automatic restart on failure

**Database Deployment:**
- MySQL/MariaDB on separate server
- Automated daily backups
- Replication setup (optional)
- Monitoring and alerts

**Frontend Deployment:**
- No changes needed (Vercel/Netlify)
- Update API_URL environment variable

**File Storage:**
- Option 1: Local storage with Nginx serving
- Option 2: AWS S3 or DigitalOcean Spaces
- Image optimization pipeline
- CDN integration (optional)

---

## 🚨 CRITICAL REQUIREMENTS

1. **No Data Loss:** All existing data must be migrated
2. **Backwards Compatibility:** Frontend should work with minimal changes
3. **Same Functionality:** All features must work identically
4. **Security First:** Role-based access must be enforced
5. **Performance:** API response times < 200ms for most endpoints
6. **Error Handling:** Comprehensive error messages and logging
7. **Turkish Market:** All payment gateways (PayTR, Shopier, TurkPin) must work
8. **Digital Delivery:** Automatic activation code assignment must work
9. **Stock Management:** Real-time stock tracking
10. **Admin Panel:** Full admin functionality preserved

---

## 📝 DELIVERABLES REQUIRED

1. **Backend API:**
   - Complete Express.js application
   - Prisma schema with all 32 tables
   - 90+ REST endpoints
   - Authentication system
   - File upload system
   - Webhook handlers for payments
   - Email service integration
   - Telegram bot integration

2. **Data Migration:**
   - Migration scripts from PostgreSQL to MySQL
   - Data validation scripts
   - Rollback scripts

3. **Frontend Updates:**
   - Updated API client layer
   - Modified hooks (useAuth, etc.)
   - Updated all 87 files using Metahub
   - Environment configuration

4. **Documentation:**
   - API documentation (Swagger/OpenAPI)
   - Database schema documentation
   - Deployment guide
   - Environment variables guide
   - Migration runbook

5. **Testing:**
   - Unit test suite
   - Integration test suite
   - E2E test scenarios
   - Load testing results

---

## ⏱️ ESTIMATED TIMELINE

- Backend API Development: 7-10 days
- Database Schema & Migration: 2-3 days
- Frontend Refactoring: 10-15 days
- Authentication System: 3-4 days
- File Upload Implementation: 2 days
- Webhook Integration: 3 days
- Testing & QA: 5-7 days
- Deployment: 2-3 days

**Total:** 34-47 days (1.5-2 months)

---

## 🎯 SUCCESS CRITERIA

- [ ] All 32 tables migrated to MySQL
- [ ] All API endpoints functional
- [ ] All payment gateways working
- [ ] User authentication working
- [ ] Admin panel fully functional
- [ ] File uploads working
- [ ] Email notifications working
- [ ] Turkish payment integrations working
- [ ] Stock management accurate
- [ ] Digital product delivery working
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Zero data loss confirmed
- [ ] Frontend UI unchanged
- [ ] All tests passing

---

## 🚀 START INSTRUCTIONS

Please begin by:
1. Creating the complete Prisma schema for all 32 tables
2. Setting up the Express.js project structure
3. Implementing the authentication module first
4. Creating the products module as a reference implementation
5. Providing a step-by-step migration guide

Ask clarifying questions if anything is unclear. Prioritize security and data integrity above all else.
