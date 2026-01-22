// =============================================================
// FILE: src/routes/PublicRoutes.tsx
// FINAL — Public subtree (RELATIVE paths under /*)
// =============================================================

import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const Index = lazy(() => import('../pages/public/Index'));
const Products = lazy(() => import('../pages/public/product/Products'));
const ProductDetail = lazy(() => import('../pages/public/product/ProductDetail'));
const Categories = lazy(() => import('../pages/public/Categories'));
const Cart = lazy(() => import('../pages/public/Cart'));
const Checkout = lazy(() => import('../pages/public/checkout/Checkout'));
const PaymentInfo = lazy(() => import('../pages/public/payment/PaymentInfo'));
const DepositPaymentInfo = lazy(() => import('../pages/public/payment/DepositPaymentInfo'));
const PaymentIframe = lazy(() => import('../pages/public/payment/PaymentIframe'));
const PaymentSuccess = lazy(() => import('../pages/public/payment/PaymentSuccess'));
const PaymentPending = lazy(() => import('../pages/public/payment/PaymentPending'));
const Auth = lazy(() => import('../pages/public/Auth'));
const PasswordReset = lazy(() => import('../pages/public/PasswordReset'));
const Blog = lazy(() => import('../pages/public/Blog'));
const BlogDetail = lazy(() => import('../pages/public/BlogDetail'));
const Contact = lazy(() => import('../pages/public/Contact'));
const About = lazy(() => import('../pages/public/About'));
const Documentation = lazy(() => import('../pages/public/Documentation'));
const Dashboard = lazy(() => import('../pages/public/account/Dashboard'));
const Support = lazy(() => import('../pages/public/Support'));
const CouponDetailPage = lazy(() => import('../pages/public/CouponDetailPage'));
const NotFound = lazy(() => import('../pages/public/NotFound'));
const UserOrderDetail = lazy(() => import('../pages/public/UserOrderDetail'));
const CustomPage = lazy(() => import('../pages/public/CustomPage'));
const Sitemap = lazy(() => import('../pages/public/Sitemap'));

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="hakkimizda" element={<About />} />
      <Route path="sitemap.xml" element={<Sitemap />} />

      <Route path="urunler" element={<Products />} />
      <Route path="kategoriler/:slug" element={<Products />} />
      <Route path="urun/:slug" element={<ProductDetail />} />

      <Route path="kategoriler" element={<Categories />} />

      <Route path="sepet" element={<Cart />} />
      <Route path="odeme" element={<Checkout />} />
      <Route path="odeme-bilgileri" element={<PaymentInfo />} />
      <Route path="bakiye-odeme-bilgileri" element={<DepositPaymentInfo />} />

      <Route path="odeme-iframe" element={<PaymentIframe />} />
      <Route path="odeme-basarili" element={<PaymentSuccess />} />
      <Route path="odeme-beklemede" element={<PaymentPending />} />
      <Route path="odeme-bildirimi" element={<PaymentPending />} />

      <Route path="giris" element={<Auth />} />
      <Route path="sifre-sifirlama" element={<PasswordReset />} />

      <Route path="blog" element={<Blog />} />
      <Route path="blog/:slug" element={<BlogDetail />} />

      <Route path="iletisim" element={<Contact />} />
      <Route path="dokumantasyon" element={<Documentation />} />
      <Route path="coupon" element={<CouponDetailPage />} />

      <Route path="hesabim" element={<Dashboard />} />
      <Route path="siparis/:id" element={<UserOrderDetail />} />
      <Route path="destek" element={<Support />} />

      {/* IMPORTANT: keep this near the end */}
      <Route path=":slug" element={<CustomPage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
