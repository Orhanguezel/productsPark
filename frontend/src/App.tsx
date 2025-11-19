import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy } from "react";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { MaintenanceMode } from "@/components/MaintenanceMode";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { FakeOrderNotification } from "./components/FakeOrderNotification";
import { HelmetProvider } from "react-helmet-async";
import { CustomScriptsRenderer } from "@/hooks/useCustomScripts";

import { CampaignPopup } from "./components/CampaignPopup";
import { CartDrawer } from "./components/CartDrawer";

// Lazy load pages
const Index = lazy(() => import("./pages/public/Index"));
const Products = lazy(() => import("./pages/public/product/Products"));
const ProductDetail = lazy(() => import("./pages/public/product/ProductDetail"));
const Categories = lazy(() => import("./pages/public/Categories"));
const Cart = lazy(() => import("./pages/public/Cart"));
const Checkout = lazy(() => import("./pages/public/checkout/Checkout"));
const PaymentInfo = lazy(() => import("./pages/public/payment/PaymentInfo"));
const DepositPaymentInfo = lazy(() => import("./pages/public/DepositPaymentInfo"));
const PaymentIframe = lazy(() => import("./pages/public/payment/PaymentIframe"));
const PaymentSuccess = lazy(() => import("./pages/public/payment/PaymentSuccess"));
const PaymentPending = lazy(() => import("./pages/public/payment/PaymentPending"));
const Auth = lazy(() => import("./pages/public/Auth"));
const PasswordReset = lazy(() => import("./pages/public/PasswordReset"));
const Blog = lazy(() => import("./pages/public/Blog"));
const BlogDetail = lazy(() => import("./pages/public/BlogDetail"));
const Contact = lazy(() => import("./pages/public/Contact"));
const About = lazy(() => import("./pages/public/About"));
const Documentation = lazy(() => import("./pages/public/Documentation"));
const Admin = lazy(() => import("./pages/public/Admin"));
const Dashboard = lazy(() => import("./pages/public/account/Dashboard"));
const Support = lazy(() => import("./pages/public/Support"));
const CouponDetailPage = lazy(() => import("./pages/public/CouponDetailPage"));
const NotFound = lazy(() => import("./pages/public/NotFound"));
const HomeSettings = lazy(() => import("./pages/admin/home-settings/HomeSettings"));
const ProductList = lazy(() => import("./pages/admin/product/ProductList"));
const ProductForm = lazy(() => import("./pages/admin/product/ProductForm"));
const CategoryList = lazy(() => import("./pages/admin/CategoryList"));
const CategoryForm = lazy(() => import("./pages/admin/CategoryForm"));
const BlogList = lazy(() => import("./pages/admin/BlogList"));
const BlogForm = lazy(() => import("./pages/admin/BlogForm"));
const ContactsList = lazy(() => import("./pages/admin/ContactsList"));
const ContactDetail = lazy(() => import("./pages/admin/ContactDetail"));
const CouponList = lazy(() => import("./pages/admin/CouponList"));
const CouponForm = lazy(() => import("./pages/admin/CouponForm"));
const OrderList = lazy(() => import("./pages/admin/OrderList"));
const OrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const UserOrderDetail = lazy(() => import("./pages/public/UserOrderDetail"));
const TicketList = lazy(() => import("./pages/admin/TicketList"));
const TicketDetail = lazy(() => import("./pages/admin/TicketDetail"));
const UserList = lazy(() => import("./pages/admin/UserList"));
const UserEdit = lazy(() => import("./pages/admin/UserEdit"));
const Settings = lazy(() => import("./pages/admin/settings/Settings"));
const FakeOrdersPage = lazy(() => import("./pages/admin/FakeOrdersPage"));
const FakeOrderForm = lazy(() => import("./pages/admin/FakeOrderForm"));
const FakeNotificationList = lazy(() => import("./pages/admin/FakeNotificationList"));
const DepositRequestList = lazy(() => import("./pages/admin/DepositRequestList"));
const PageList = lazy(() => import("./pages/admin/PageList"));
const PageForm = lazy(() => import("./pages/admin/PageForm"));
const CustomPage = lazy(() => import("./pages/public/CustomPage"));
const MenuManagement = lazy(() => import("./pages/admin/menu/MenuManagement"));
const ApiProviderList = lazy(() => import("./pages/admin/ApiProviderList"));
const ApiProviderForm = lazy(() => import("./pages/admin/ApiProviderForm"));
const TurkpinSettings = lazy(() => import("./pages/admin/TurkpinSettings"));
const PaymentRequestList = lazy(() => import("./pages/admin/PaymentRequestList"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const Sitemap = lazy(() => import("./pages/public/Sitemap"));
const PopupList = lazy(() => import("./pages/admin/PopupList"));
const PopupForm = lazy(() => import("./pages/admin/PopupForm"));
const EmailTemplateList = lazy(() => import("./pages/admin/EmailTemplateList"));
const EmailTemplateForm = lazy(() => import("./pages/admin/EmailTemplateForm"));
const BackupManagement = lazy(() => import("./pages/admin/BackupManagement"));
const DeleteUserOrders = lazy(() => import("./pages/admin/DeleteUserOrders"));

const queryClient = new QueryClient();

const AppContent = () => {
  const { shouldShowMaintenance, loading } = useMaintenanceMode();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (shouldShowMaintenance) {
    return <MaintenanceMode />;
  }

  return (
    <>
      <CustomScriptsRenderer />
      <Toaster />
      <Sonner />
      <FakeOrderNotification />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <CartDrawer />
        <CampaignPopup />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/hakkimizda" element={<About />} />
            <Route path="/sitemap.xml" element={<Sitemap />} />
            <Route path="/urunler" element={<Products />} />
            <Route path="/kategoriler/:slug" element={<Products />} />
            <Route path="/urun/:slug" element={<ProductDetail />} />
            <Route path="/kategoriler" element={<Categories />} />
            <Route path="/sepet" element={<Cart />} />
            <Route path="/odeme" element={<Checkout />} />
            <Route path="/odeme-bilgileri" element={<PaymentInfo />} />
            <Route path="/bakiye-odeme-bilgileri" element={<DepositPaymentInfo />} />
            <Route path="/odeme-iframe" element={<PaymentIframe />} />
            <Route path="/odeme-basarili" element={<PaymentSuccess />} />
            <Route path="/odeme-beklemede" element={<PaymentPending />} />
            <Route path="/odeme-bildirimi" element={<PaymentPending />} />
            <Route path="/giris" element={<Auth />} />
            <Route path="/sifre-sifirlama" element={<PasswordReset />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/iletisim" element={<Contact />} />
            <Route path="/dokumantasyon" element={<Documentation />} />
            <Route path="/coupon" element={<CouponDetailPage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/home-settings" element={<HomeSettings />} />
            <Route path="/admin/products" element={<ProductList />} />
            <Route path="/admin/products/new" element={<ProductForm />} />
            <Route path="/admin/products/edit/:id" element={<ProductForm />} />
            <Route path="/admin/categories" element={<CategoryList />} />
            <Route path="/admin/categories/new" element={<CategoryForm />} />
            <Route path="/admin/categories/edit/:id" element={<CategoryForm />} />
            <Route path="/admin/blog" element={<BlogList />} />
            <Route path="/admin/blog/new" element={<BlogForm />} />
            <Route path="/admin/blog/edit/:id" element={<BlogForm />} />
            <Route path="/admin/contacts" element={<ContactsList />} />
            <Route path="/admin/contacts/:id" element={<ContactDetail />} />
            <Route path="/admin/coupons" element={<CouponList />} />
            <Route path="/admin/coupons/new" element={<CouponForm />} />
            <Route path="/admin/coupons/edit/:id" element={<CouponForm />} />
            <Route path="/admin/orders" element={<OrderList />} />
            <Route path="/admin/orders/:id" element={<OrderDetail />} />
            <Route path="/admin/tickets" element={<TicketList />} />
            <Route path="/admin/tickets/:id" element={<TicketDetail />} />
            <Route path="/admin/users" element={<UserList />} />
            <Route path="/admin/users/:id" element={<UserEdit />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/fake-notifications" element={<FakeNotificationList />} />
            <Route path="/admin/fake-orders" element={<FakeOrdersPage />} />
            <Route path="/admin/fake-orders/new" element={<FakeOrderForm />} />
            <Route path="/admin/fake-orders/:id" element={<FakeOrderForm />} />
            <Route path="/admin/deposit-requests" element={<DepositRequestList />} />
            <Route path="/admin/pages" element={<PageList />} />
            <Route path="/admin/pages/new" element={<PageForm />} />
            <Route path="/admin/pages/edit/:id" element={<PageForm />} />
            <Route path="/admin/menu" element={<MenuManagement />} />
            <Route path="/admin/api-providers" element={<ApiProviderList />} />
            <Route path="/admin/api-providers/new" element={<ApiProviderForm />} />
            <Route path="/admin/api-providers/edit/:id" element={<ApiProviderForm />} />
            <Route path="/admin/turkpin-settings" element={<TurkpinSettings />} />
            <Route path="/admin/payment-requests" element={<PaymentRequestList />} />
            <Route path="/admin/popups" element={<PopupList />} />
            <Route path="/admin/popups/new" element={<PopupForm />} />
            <Route path="/admin/popups/edit/:id" element={<PopupForm />} />
            <Route path="/admin/email-templates" element={<EmailTemplateList />} />
            <Route path="/admin/email-templates/:id" element={<EmailTemplateForm />} />
            <Route path="/admin/backup" element={<BackupManagement />} />
            <Route path="/admin/delete-user-orders" element={<DeleteUserOrders />} />
            <Route path="/hesabim" element={<Dashboard />} />
            <Route path="/siparis/:id" element={<UserOrderDetail />} />
            <Route path="/destek" element={<Support />} />
            <Route path="/:slug" element={<CustomPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <HelmetProvider>
          <AppContent />
        </HelmetProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
