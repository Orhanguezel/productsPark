import { AdminLayout } from "@/components/admin/AdminLayout";
import { ApiProviderManagement } from "@/components/admin/ApiProviderManagement";

export default function ApiProviderList() {
  return (
    <AdminLayout title="API Sağlayıcı Yönetimi">
      <ApiProviderManagement />
    </AdminLayout>
  );
}