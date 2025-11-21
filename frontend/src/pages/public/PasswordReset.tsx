// =============================================================
// FILE: src/pages/auth/PasswordReset.tsx
// =============================================================
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ArrowLeft } from "lucide-react";
import { useSendEmailMutation } from "@/integrations/metahub/rtk/endpoints/functions.endpoints";
import {
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
} from "@/integrations/metahub/rtk/endpoints/auth.endpoints";
import { useGetSiteSettingByKeyQuery } from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Geçerli bir e-posta adresi giriniz" }),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "Şifre en az 6 karakter olmalıdır" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
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

  // URL'den token okumak (backend JWT token gönderiyor)
  const token = searchParams.get("token") ?? "";
  const isConfirmation = !!token;

  // RTK: backend fonksiyonları
  const [requestPasswordReset] = useRequestPasswordResetMutation();
  const [confirmPasswordReset] = useConfirmPasswordResetMutation();

  // RTK send-email fonksiyonu
  const [sendEmail] = useSendEmailMutation();

  // Site başlığı: RTK site_settings'ten çek
  const { data: siteTitleSetting } = useGetSiteSettingByKeyQuery("site_title");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = emailSchema.parse({ email });
      setLoading(true);

      // 1) Backend tarafında reset flow'u tetikle
      const resp = await requestPasswordReset({
        email: validated.email,
      }).unwrap();

      if (!resp.success) {
        toast.error(resp.error || "Şifre sıfırlama başlatılamadı");
        return;
      }

      const resetToken = resp.token;
      if (!resetToken) {
        // Teorik olarak her zaman gelmeli ama yine de guard atalım
        toast.error("Şifre sıfırlama token üretilemedi");
        return;
      }

      // 2) Site başlığını RTK'den al
      const siteName = String(siteTitleSetting?.value ?? "Dijital Market");

      // 3) Kendi mail fonksiyonunla mail gönder
      const resetLink = `${window.location.origin}/sifre-sifirlama?token=${encodeURIComponent(
        resetToken,
      )}`;

      try {
        await sendEmail({
          to: validated.email,
          template_key: "password_reset",
          variables: {
            user_email: validated.email,
            reset_link: resetLink,
            site_name: siteName,
          },
        }).unwrap();
      } catch (emailError) {
        console.error("Password reset email error:", emailError);
        // Mail patlasa bile backend'de reset isteği yapılmış durumda,
        // o yüzden süreci tamamen bozma.
      }

      toast.success(
        resp.message ||
          "Eğer bu e-posta adresi ile kayıtlı bir hesabınız varsa, şifre sıfırlama bağlantısı gönderildi.",
      );
      setEmail("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message ?? "Form hatası");
      } else {
        toast.error("Bir hata oluştu");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Geçersiz veya eksik şifre sıfırlama bağlantısı");
      return;
    }

    try {
      const validated = passwordSchema.parse({
        password,
        confirmPassword,
      });
      setLoading(true);

      const resp = await confirmPasswordReset({
        token,
        password: validated.password,
      }).unwrap();

      if (!resp.success) {
        toast.error(resp.error || "Şifre güncellenemedi");
        return;
      }

      toast.success(resp.message || "Şifreniz başarıyla güncellendi!");
      navigate("/auth");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0]?.message ?? "Form hatası");
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
              <span className="text-primary-foreground font-bold text-2xl">
                D
              </span>
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
              <form
                onSubmit={handleUpdatePassword}
                className="space-y-4"
              >
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
                  <Label htmlFor="confirmPassword">
                    Yeni Şifre Tekrar
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
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
              <form
                onSubmit={handleRequestReset}
                className="space-y-4"
              >
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
                  {loading
                    ? "Gönderiliyor..."
                    : "Sıfırlama Bağlantısı Gönder"}
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
