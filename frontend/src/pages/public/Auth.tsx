import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

import {
  useLoginMutation,
  useSignupMutation,
  useStatusQuery,
  useOauthStartMutation,
} from '@/integrations/hooks';

/* -------------------- schemas -------------------- */

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Geçerli bir e-posta adresi giriniz' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır' }),
});

const registerSchema = loginSchema
  .extend({
    fullName: z.string().trim().min(2, { message: 'Ad soyad en az 2 karakter olmalıdır' }).max(100),
    phone: z
      .string()
      .trim()
      .min(10, { message: 'Telefon numarası en az 10 karakter olmalıdır' })
      .max(20),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

/* -------------------- error helpers (no-any) -------------------- */

type ApiErrShape = { data?: unknown; error?: unknown; status?: unknown };

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

function pickErrorMessage(err: unknown): string | null {
  // RTK Query errors can be: { status, data } or fetch error shapes
  if (!isObject(err)) return null;

  const e = err as ApiErrShape;

  // common places
  const data = isObject(e.data) ? (e.data as Record<string, unknown>) : null;
  const nestedError = data && isObject(data.error) ? (data.error as Record<string, unknown>) : null;

  const msg =
    (nestedError && typeof nestedError.message === 'string' && nestedError.message) ||
    (data && typeof data.message === 'string' && data.message) ||
    (typeof (e as Record<string, unknown>).message === 'string' ? String((e as any).message) : '');

  return msg.trim() ? msg.trim() : null;
}

/* -------------------- component -------------------- */

const Auth = () => {
  const navigate = useNavigate();

  const [loginMutation, { isLoading: loginLoading }] = useLoginMutation();
  const [signupMutation, { isLoading: signupLoading }] = useSignupMutation();
  const [oauthStart, { isLoading: oauthLoading }] = useOauthStartMutation();

  const { data: status, isLoading: statusLoading, isFetching: statusFetching } = useStatusQuery();

  // Form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [localLoading, setLocalLoading] = useState(false);

  const loading = useMemo(
    () => localLoading || loginLoading || signupLoading || oauthLoading,
    [localLoading, loginLoading, signupLoading, oauthLoading],
  );

  // Already authenticated → redirect
  useEffect(() => {
    if (!statusLoading && !statusFetching && status?.authenticated && status.user) {
      navigate('/');
    }
  }, [statusLoading, statusFetching, status, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = loginSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });

      setLocalLoading(true);

      // backend AuthTokenBody: { grant_type:'password', email, password }
      await loginMutation({
        grant_type: 'password',
        email: validated.email,
        password: validated.password,
      }).unwrap();

      toast.success('Giriş başarılı!');
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0]?.message ?? 'Form hatası');
        return;
      }

      const code = pickErrorMessage(err);

      if (code === 'invalid_credentials') toast.error('E-posta veya şifre hatalı');
      else toast.error('Bir hata oluştu');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLocalLoading(true);

      const redirectTo = `${window.location.origin}/`;
      const res = await oauthStart({ redirectTo }).unwrap();

      if (res?.url) {
        window.location.href = res.url;
        return;
      }

      toast.error("Google yönlendirme URL'si alınamadı");
    } catch (err: unknown) {
      const code = pickErrorMessage(err);

      toast.error(
        code === 'google_oauth_not_configured'
          ? 'Google girişi yapılandırılmamış'
          : 'Google ile giriş sırasında bir hata oluştu',
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = registerSchema.parse({
        email: registerEmail,
        password: registerPassword,
        confirmPassword: registerConfirmPassword,
        fullName,
        phone,
      });

      setLocalLoading(true);

      // backend AuthSignupBody: { email, password, full_name?, phone? }
      await signupMutation({
        email: validated.email,
        password: validated.password,
        full_name: validated.fullName,
        phone: validated.phone,
      }).unwrap();

      toast.success('Kayıt başarılı! Giriş yapabilirsiniz.');

      // Reset form
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      setFullName('');
      setPhone('');
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0]?.message ?? 'Form hatası');
        return;
      }

      const code = pickErrorMessage(err);

      if (code === 'user_exists') toast.error('Bu e-posta adresi zaten kayıtlı');
      else toast.error('Bir hata oluştu');
    } finally {
      setLocalLoading(false);
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
            <CardTitle className="text-2xl">Dijital Market</CardTitle>
            <CardDescription>Hesabınıza giriş yapın veya yeni hesap oluşturun</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Giriş Yap</TabsTrigger>
                <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
              </TabsList>

              {/* Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-posta</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Şifre</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-sm"
                      onClick={() => navigate('/sifre-sifirlama')}
                    >
                      Şifremi Unuttum
                    </Button>
                  </div>

                  <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                    {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Veya</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google ile Giriş Yap
                  </Button>
                </form>
              </TabsContent>

              {/* Register */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Ad Soyad</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Ad Soyad"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone">Telefon Numarası</Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="+90 555 123 45 67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-posta</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Şifre</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Şifre Tekrar</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                    {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Veya</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google ile Kayıt Ol
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="justify-center">
            <Button variant="link" onClick={() => navigate('/')}>
              Ana Sayfaya Dön
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
