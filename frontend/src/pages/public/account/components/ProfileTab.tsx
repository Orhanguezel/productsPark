// =============================================================
// FILE: src/pages/account/components/ProfileTab.tsx
// =============================================================
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import {
  useGetMyProfileQuery,
  useUpsertMyProfileMutation,
} from "@/integrations/metahub/rtk/endpoints/profiles.endpoints";
import { useUpdateUserMutation } from "@/integrations/metahub/rtk/endpoints/auth.endpoints";

export function ProfileTab() {
  const { user } = useAuth();

  const { data: profileData } = useGetMyProfileQuery();
  const [upsertProfile, { isLoading: upsertingProfile }] =
    useUpsertMyProfileMutation();

  const [updateUser, { isLoading: updatingUser }] = useUpdateUserMutation();

  // ---- local state ----
  const [email, setEmail] = useState(user?.email ?? "");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // user değişince e-postayı senkronla
  useEffect(() => {
    setEmail(user?.email ?? "");
  }, [user?.email]);

  // profil yüklendiğinde ad/telefonu doldur
  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name ?? "");
      setPhone(profileData.phone ?? "");
    }
  }, [profileData]);

  const handleUpdateProfile = async () => {
    try {
      await upsertProfile({ profile: { full_name: fullName, phone } }).unwrap();
      toast.success("Profil güncellendi");
    } catch {
      toast.error("Profil güncellenemedi");
    }
  };

  const handleUpdateEmail = async () => {
    if (!email) {
      toast.error("Geçerli bir e-posta girin");
      return;
    }
    if (email === (user?.email ?? "")) {
      toast.info("E-posta zaten güncel");
      return;
    }

    try {
      await updateUser({ email }).unwrap();
      toast.success(
        "E-posta güncelleme bağlantısı gönderildi. Lütfen yeni e-postayı kontrol edin."
      );
    } catch (e) {
      console.error(e);
      toast.error("E-posta güncellenemedi");
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    try {
      await updateUser({ password: newPassword }).unwrap();
      toast.success("Şifre başarıyla güncellendi");

      // inputları sıfırla
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      console.error(e);
      toast.error("Şifre güncellenemedi");
    }
  };

  const isBusy = upsertingProfile || updatingUser;

  return (
    <>
      {/* Profil Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* E-posta */}
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@domain.com"
              />
              <Button
                type="button"
                onClick={handleUpdateEmail}
                disabled={updatingUser || !email}
              >
                Güncelle
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              E-posta değişikliği için doğrulama linki gönderilecektir.
            </p>
          </div>

          {/* Ad Soyad */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Telefon */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon Numarası</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 5XX XXX XX XX"
            />
          </div>

          <Button
            onClick={handleUpdateProfile}
            disabled={isBusy}
            className="w-full"
          >
            Profili Güncelle
          </Button>
        </CardContent>
      </Card>

      {/* Şifre Değiştir */}
      <Card>
        <CardHeader>
          <CardTitle>Şifre Değiştir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Yeni Şifre</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Yeni şifrenizi girin"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Şifrenizi tekrar girin"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button
            onClick={handleChangePassword}
            className="w-full"
            disabled={updatingUser}
          >
            Şifreyi Güncelle
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
