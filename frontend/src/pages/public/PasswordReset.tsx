// =============================================================
// FILE: src/pages/auth/PasswordReset.tsx
// FINAL — FE aligned with RTK Auth contract (ok:true, no token)
// - Request: POST /auth/password-reset/request  -> { ok:true, message? }
// - Confirm: POST /auth/password-reset/confirm  -> { ok:true, message? }
// - Email sending is assumed to be handled by backend.
// =============================================================
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft } from 'lucide-react';

import {
  useAuthPasswordResetRequestMutation,
  useAuthPasswordResetConfirmMutation,
} from '@/integrations/hooks';

const emailSchema = z.object({
  email: z.string().trim().email({ message: 'Geçerli bir e-posta adresi giriniz' }),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

const PasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // URL'den token okumak
  const token = searchParams.get('token') ?? '';
  const isConfirmation = !!token;

  // RTK mutations
  const [requestPasswordReset] = useAuthPasswordResetRequestMutation();
  const [confirmPasswordReset] = useAuthPasswordResetConfirmMutation();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = emailSchema.parse({ email });
      setLoading(true);

      const resp = await requestPasswordReset({ email: validated.email }).unwrap();

      // RTK contract: { ok: true; message? }
      if (!resp?.ok) {
        toast.error('Şifre sıfırlama başlatılamadı');
        return;
      }

      toast.success(
        resp.message ||
          'Eğer bu e-posta adresi ile kayıtlı bir hesabınız varsa, şifre sıfırlama bağlantısı gönderildi.',
      );

      setEmail('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message ?? 'Form hatası');
        return;
      }

      // RTK error shape tolerant
      const apiMsg =
        typeof error === 'object' &&
        error !== null &&
        'data' in error &&
        (error as any).data &&
        typeof (error as any).data.error?.message === 'string'
          ? (error as any).data.error.message
          : null;

      toast.error(apiMsg || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Geçersiz veya eksik şifre sıfırlama bağlantısı');
      return;
    }

    try {
      const validated = passwordSchema.parse({ password, confirmPassword });
      setLoading(true);

      const resp = await confirmPasswordReset({
        token,
        password: validated.password,
      }).unwrap();

      // RTK contract: { ok: true; message? }
      if (!resp?.ok) {
        toast.error('Şifre güncellenemedi');
        return;
      }

      toast.success(resp.message || 'Şifreniz başarıyla güncellendi!');
      navigate('/auth');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message ?? 'Form hatası');
        return;
      }

      const apiMsg =
        typeof error === 'object' &&
        error !== null &&
        'data' in error &&
        (error as any).data &&
        typeof (error as any).data.error?.message === 'string'
          ? (error as any).data.error.message
          : null;

      toast.error(apiMsg || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-secondary py-12 px-4">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">D</span>
            </div>
            <CardTitle className="text-2xl">
              {isConfirmation ? 'Yeni Şifre Belirle' : 'Şifremi Unuttum'}
            </CardTitle>
            <CardDescription>
              {isConfirmation
                ? 'Hesabınız için yeni bir şifre belirleyin'
                : 'E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isConfirmation ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Yeni Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Yeni Şifre Tekrar</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta Adresi</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                </Button>
              </form>
            )}

            <div className="mt-6 flex justify-center">
              <Button variant="link" onClick={() => navigate('/auth')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Giriş Sayfasına Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default PasswordReset;
