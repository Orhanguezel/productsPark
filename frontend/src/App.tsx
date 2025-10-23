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
const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Categories = lazy(() => import("./pages/Categories"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentInfo = lazy(() => import("./pages/PaymentInfo"));
const DepositPaymentInfo = lazy(() => import("./pages/DepositPaymentInfo"));
const PaymentIframe = lazy(() => import("./pages/PaymentIframe"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentPending = lazy(() => import("./pages/PaymentPending"));
const Auth = lazy(() => import("./pages/Auth"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const Documentation = lazy(() => import("./pages/Documentation"));
const Admin = lazy(() => import("./pages/Admin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Support = lazy(() => import("./pages/Support"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HomeSettings = lazy(() => import("./pages/admin/HomeSettings"));
const ProductList = lazy(() => import("./pages/admin/ProductList"));
const ProductForm = lazy(() => import("./pages/admin/ProductForm"));
const CategoryList = lazy(() => import("./pages/admin/CategoryList"));
const CategoryForm = lazy(() => import("./pages/admin/CategoryForm"));
const BlogList = lazy(() => import("./pages/admin/BlogList"));
const BlogForm = lazy(() => import("./pages/admin/BlogForm"));
const CouponList = lazy(() => import("./pages/admin/CouponList"));
const CouponForm = lazy(() => import("./pages/admin/CouponForm"));
const OrderList = lazy(() => import("./pages/admin/OrderList"));
const OrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const UserOrderDetail = lazy(() => import("./pages/UserOrderDetail"));
const TicketList = lazy(() => import("./pages/admin/TicketList"));
const TicketDetail = lazy(() => import("./pages/admin/TicketDetail"));
const UserList = lazy(() => import("./pages/admin/UserList"));
const UserEdit = lazy(() => import("./pages/admin/UserEdit"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const FakeNotificationList = lazy(() => import("./pages/admin/FakeNotificationList"));
const DepositRequestList = lazy(() => import("./pages/admin/DepositRequestList"));
const PageList = lazy(() => import("./pages/admin/PageList"));
const PageForm = lazy(() => import("./pages/admin/PageForm"));
const CustomPage = lazy(() => import("./pages/CustomPage"));
const MenuManagement = lazy(() => import("./pages/admin/MenuManagement"));
const ApiProviderList = lazy(() => import("./pages/admin/ApiProviderList"));
const ApiProviderForm = lazy(() => import("./pages/admin/ApiProviderForm"));
const TurkpinSettings = lazy(() => import("./pages/admin/TurkpinSettings"));
const PaymentRequestList = lazy(() => import("./pages/admin/PaymentRequestList"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const PopupList = lazy(() => import("./pages/admin/PopupList"));
const PopupForm = lazy(() => import("./pages/admin/PopupForm"));
const EmailTemplateList = lazy(() => import("./pages/admin/EmailTemplateList"));
const EmailTemplateForm = lazy(() => import("./pages/admin/EmailTemplateForm"));
const UpdateManagement = lazy(() => import("./pages/admin/UpdateManagement"));
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
      <BrowserRouter>
        <CartDrawer />
        <CampaignPopup />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/hakkimizda" element={<About />} />
            <Route path="/sitemap.xml" element={<Sitemap />} />
            <Route path="/urunler" element={<Products />} />
            <Route path="/kategoriler/:slug" element={<Products />} />
            <Route path="/urun/:id" element={<ProductDetail />} />
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
            <Route path="/admin/updates" element={<UpdateManagement />} />
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
