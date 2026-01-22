// =============================================================
// FILE: src/routes/AdminRoutes.tsx
// FINAL — Admin subtree (RELATIVE paths under /admin/*)
// =============================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

const Admin = lazy(() => import('../pages/admin/Admin'));
const Reports = lazy(() => import('../pages/admin/reports/Reports'));
const HomeSettings = lazy(() => import('../pages/admin/home-settings/HomeSettings'));
const ProductList = lazy(() => import('../pages/admin/product/ProductList'));
const ProductForm = lazy(() => import('../pages/admin/product/ProductForm'));
const CategoryList = lazy(() => import('../pages/admin/CategoryList'));
const CategoryForm = lazy(() => import('../pages/admin/CategoryForm'));
const BlogList = lazy(() => import('../pages/admin/BlogList'));
const BlogForm = lazy(() => import('../pages/admin/BlogForm'));
const ContactsList = lazy(() => import('../pages/admin/ContactsList'));
const ContactDetail = lazy(() => import('../pages/admin/ContactDetail'));
const CouponList = lazy(() => import('../pages/admin/CouponList'));
const CouponForm = lazy(() => import('../pages/admin/CouponForm'));
const OrderList = lazy(() => import('../pages/admin/OrderList'));
const OrderDetail = lazy(() => import('../pages/admin/OrderDetail'));
const TicketList = lazy(() => import('../pages/admin/ticket/TicketList'));
const TicketDetail = lazy(() => import('../pages/admin/ticket/TicketDetail'));
const UserList = lazy(() => import('../pages/admin/users/UserList'));
const UserEdit = lazy(() => import('../pages/admin/users/UserEdit'));
const Settings = lazy(() => import('../pages/admin/settings/Settings'));
const FakeOrdersPage = lazy(() => import('../pages/admin/FakeOrdersPage'));
const FakeOrderForm = lazy(() => import('../pages/admin/FakeOrderForm'));
const FakeNotificationList = lazy(() => import('../pages/admin/FakeNotificationList'));
const DepositRequestList = lazy(() => import('../pages/admin/DepositRequestList'));
const PageList = lazy(() => import('../pages/admin/PageList'));
const PageForm = lazy(() => import('../pages/admin/PageForm'));
const MenuManagement = lazy(() => import('../pages/admin/menu/MenuManagement'));
const ApiProviderList = lazy(() => import('../pages/admin/ApiProviderList'));
const ApiProviderForm = lazy(() => import('../pages/admin/ApiProviderForm'));
const TurkpinSettings = lazy(() => import('../pages/admin/TurkpinSettings'));
const PaymentRequestList = lazy(() => import('../pages/admin/payment/PaymentRequestList'));
const AdminPaymentsPage = lazy(() => import('../pages/admin/payment/AdminPaymentsPage'));
const PopupList = lazy(() => import('../pages/admin/PopupList'));
const PopupForm = lazy(() => import('../pages/admin/PopupForm'));
const EmailTemplateList = lazy(() => import('../pages/admin/EmailTemplateList'));
const EmailTemplateForm = lazy(() => import('../pages/admin/EmailTemplateForm'));
const BackupManagement = lazy(() => import('../pages/admin/BackupManagement'));
const DeleteUserOrders = lazy(() => import('../pages/admin/DeleteUserOrders'));
const Telegram = lazy(() => import('../pages/admin/telegram/Telegram'));

export default function AdminRoutes() {
  return (
    <Routes>
      {/* /admin -> dashboard */}
      <Route index element={<Admin />} />

      <Route path="reports" element={<Reports />} />
      <Route path="home-settings" element={<HomeSettings />} />

      <Route path="products" element={<ProductList />} />
      <Route path="products/new" element={<ProductForm />} />
      <Route path="products/edit/:id" element={<ProductForm />} />

      <Route path="categories" element={<CategoryList />} />
      <Route path="categories/new" element={<CategoryForm />} />
      <Route path="categories/edit/:id" element={<CategoryForm />} />

      <Route path="blog" element={<BlogList />} />
      <Route path="blog/new" element={<BlogForm />} />
      <Route path="blog/edit/:id" element={<BlogForm />} />

      <Route path="contacts" element={<ContactsList />} />
      <Route path="contacts/:id" element={<ContactDetail />} />

      <Route path="coupons" element={<CouponList />} />
      <Route path="coupons/new" element={<CouponForm />} />
      <Route path="coupons/edit/:id" element={<CouponForm />} />

      <Route path="orders" element={<OrderList />} />
      <Route path="orders/:id" element={<OrderDetail />} />

      <Route path="tickets" element={<TicketList />} />
      <Route path="tickets/:id" element={<TicketDetail />} />

      <Route path="users" element={<UserList />} />
      <Route path="users/:id" element={<UserEdit />} />

      <Route path="settings" element={<Settings />} />

      <Route path="fake-notifications" element={<FakeNotificationList />} />

      <Route path="fake-orders" element={<FakeOrdersPage />} />
      <Route path="fake-orders/new" element={<FakeOrderForm />} />
      <Route path="fake-orders/:id" element={<FakeOrderForm />} />

      <Route path="deposit-requests" element={<DepositRequestList />} />
      <Route path="payment-requests" element={<PaymentRequestList />} />
      <Route path="payments" element={<AdminPaymentsPage />} />
      

      <Route path="pages" element={<PageList />} />
      <Route path="pages/new" element={<PageForm />} />
      <Route path="pages/edit/:id" element={<PageForm />} />

      <Route path="menu" element={<MenuManagement />} />

      <Route path="api-providers" element={<ApiProviderList />} />
      <Route path="api-providers/new" element={<ApiProviderForm />} />
      <Route path="api-providers/edit/:id" element={<ApiProviderForm />} />

      <Route path="turkpin-settings" element={<TurkpinSettings />} />

      <Route path="popups" element={<PopupList />} />
      <Route path="popups/new" element={<PopupForm />} />
      <Route path="popups/edit/:id" element={<PopupForm />} />

      <Route path="email-templates" element={<EmailTemplateList />} />
      <Route path="email-templates/:id" element={<EmailTemplateForm />} />

      <Route path="backup" element={<BackupManagement />} />
      <Route path="delete-user-orders" element={<DeleteUserOrders />} />

      <Route path="telegram" element={<Telegram />} />

      {/* Catch-all inside /admin only */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
