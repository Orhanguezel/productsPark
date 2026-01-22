// =============================================================
// FILE: src/routes/AppRoutes.tsx
// FINAL — Single routing tree (admin vs public mutually exclusive)
// =============================================================

import { Routes, Route } from 'react-router-dom';
import AdminRoutes from '@/routes/AdminRoutes';
import PublicRoutes from '@/routes/PublicRoutes';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Admin subtree */}
      <Route path="/admin/*" element={<AdminRoutes />} />

      {/* Public subtree */}
      <Route path="/*" element={<PublicRoutes />} />
    </Routes>
  );
}
