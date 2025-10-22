import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft } from "lucide-react";

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Geçerli bir e-posta adresi giriniz" }),
});

const passwordSchema = z.object({
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

const PasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Check if this is a password reset confirmation (has access_token in URL)
  const isConfirmation = searchParams.get('type') === 'recovery';

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = emailSchema.parse({ email });
      setLoading(true);

      const { error } = await metahub.auth.resetPasswordForEmail(validated.email, {
        redirectTo: `${window.location.origin}/sifre-sifirlama`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Send password reset email
      try {
        const { data: siteSetting } = await metahub
          .from("site_settings")
          .select("value")
          .eq("key", "site_title")
          .single();

        await metahub.functions.invoke('send-email', {
          body: {
            to: validated.email,
            template_key: 'password_reset',
            variables: {
              user_email: validated.email,
              reset_link: `${window.location.origin}/sifre-sifirlama`,
              site_name: siteSetting?.value || 'Dijital Market'
            }
          }
        });
      } catch (emailError) {
        console.error('Password reset email error:', emailError);
        // Don't fail the reset if email fails
      }

      toast.success("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!");
      setEmail("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Bir hata oluştu");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = passwordSchema.parse({ password, confirmPassword });
      setLoading(true);

      const { error } = await metahub.auth.updateUser({
        password: validated.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Şifreniz başarıyla güncellendi!");
      navigate("/auth");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Bir hata oluştu");
      }
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
              {isConfirmation ? "Yeni Şifre Belirle" : "Şifremi Unuttum"}
            </CardTitle>
            <CardDescription>
              {isConfirmation
                ? "Hesabınız için yeni bir şifre belirleyin"
                : "E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz"}
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
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-primary"
                  disabled={loading}
                >
                  {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
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
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-primary"
                  disabled={loading}
                >
                  {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                </Button>
              </form>
            )}

            <div className="mt-6 flex justify-center">
              <Button
                variant="link"
                onClick={() => navigate("/auth")}
              >
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
