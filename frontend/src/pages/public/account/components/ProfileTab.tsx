// =============================================================
// FILE: src/pages/account/components/ProfileTab.tsx
// FINAL — No admin mutation, correct payloads (AuthUpdate + Profile upsert)
// =============================================================
import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import {
  useGetMyProfileQuery,
  useUpsertMyProfileMutation,
  useAuthUpdateMutation,
} from '@/integrations/hooks';

export function ProfileTab() {
  const { user } = useAuth();

  // profile (separate table/module)
  const { data: profileData } = useGetMyProfileQuery(undefined, {
    skip: !user?.id,
  });

  const [upsertProfile, { isLoading: upsertingProfile }] = useUpsertMyProfileMutation();

  // auth user update (me)
  const [authUpdate, { isLoading: updatingMe }] = useAuthUpdateMutation();

  // ---- local state ----
  const [email, setEmail] = useState(user?.email ?? '');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // user değişince e-postayı senkronla
  useEffect(() => {
    setEmail(user?.email ?? '');
  }, [user?.email]);

  // profil yüklendiğinde ad/telefonu doldur
  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name ?? '');
      setPhone(profileData.phone ?? '');
    } else {
      // fallback: auth user varsa
      setFullName(user?.full_name ?? '');
      setPhone(user?.phone ?? '');
    }
  }, [profileData, user?.full_name, user?.phone]);

  const isBusy = upsertingProfile || updatingMe;

  const emailChanged = useMemo(() => {
    const current = (user?.email ?? '').trim();
    return email.trim() !== '' && email.trim() !== current;
  }, [email, user?.email]);

  const handleUpdateProfile = async () => {
    if (!user?.id) {
      toast.error('Oturum bulunamadı');
      return;
    }

    try {
      // ✅ Hook Partial<Pick<Profile,...>> bekliyor: doğrudan alanları gönder
      await upsertProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
      }).unwrap();

      toast.success('Profil güncellendi');
    } catch (e) {
      console.error(e);
      toast.error('Profil güncellenemedi');
    }
  };

  const handleUpdateEmail = async () => {
    if (!user?.id) {
      toast.error('Oturum bulunamadı');
      return;
    }
    if (!email.trim()) {
      toast.error('Geçerli bir e-posta girin');
      return;
    }
    if (!emailChanged) {
      toast.info('E-posta zaten güncel');
      return;
    }

    try {
      // ✅ Admin değil: authUpdate (me) body
      await authUpdate({ email: email.trim() } as any).unwrap();
      // Not: AuthUpdateBody senin paylaştığın tipte email yok.
      // Eğer backend /auth/user email güncelliyorsa, AuthUpdateBody'ye email eklemen gerekir.
      // Aşağıdaki "as any"yi kaldırmak için, AuthUpdateBody'yi genişlet:
      //   email?: string | null;

      toast.success('E-posta güncelleme isteği alındı');
    } catch (e) {
      console.error(e);
      toast.error('E-posta güncellenemedi');
    }
  };

  const handleChangePassword = async () => {
    if (!user?.id) {
      toast.error('Oturum bulunamadı');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    try {
      // ✅ password AuthUpdateBody içinde var
      await authUpdate({ password: newPassword }).unwrap();
      toast.success('Şifre başarıyla güncellendi');

      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      console.error(e);
      toast.error('Şifre güncellenemedi');
    }
  };

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
                disabled={isBusy}
              />
              <Button type="button" onClick={handleUpdateEmail} disabled={isBusy || !emailChanged}>
                Güncelle
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              E-posta değişikliği için doğrulama akışı backend’e bağlıdır.
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
              disabled={isBusy}
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
              disabled={isBusy}
            />
          </div>

          <Button onClick={handleUpdateProfile} disabled={isBusy} className="w-full">
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
              disabled={isBusy}
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
              disabled={isBusy}
            />
          </div>

          <Button onClick={handleChangePassword} className="w-full" disabled={isBusy}>
            Şifreyi Güncelle
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
