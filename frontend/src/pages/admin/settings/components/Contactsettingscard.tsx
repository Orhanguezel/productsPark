// =============================================================
// FILE: src/pages/admin/settings/components/ContactSettingsCard.tsx
// FINAL — İletişim Bilgileri + Sosyal Medya ayarları kartı
// =============================================================

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Send,
} from 'lucide-react';

interface Props {
  settings: {
    contact_email: string;
    footer_phone: string;
    footer_address: string;
    whatsapp_number: string;
    facebook_url: string;
    twitter_url: string;
    instagram_url: string;
    linkedin_url: string;
    youtube_url: string;
    telegram_channel_url: string;
  };
  setSettings: React.Dispatch<React.SetStateAction<any>>;
}

export default function ContactSettingsCard({ settings, setSettings }: Props) {
  const update = (key: string, value: string) => {
    setSettings((prev: Record<string, unknown>) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* ==================== İletişim Bilgileri ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            İletişim Bilgileri
          </CardTitle>
          <CardDescription>
            Bu bilgiler iletişim sayfasında ve footer&apos;da görüntülenir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact_email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              İletişim E-posta Adresi
            </Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="destek@siteniz.com"
              value={settings.contact_email ?? ''}
              onChange={(e) => update('contact_email', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              İletişim formundan gelen mesajlar bu adrese gönderilir ve sayfada gösterilir
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer_phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Telefon Numarası
            </Label>
            <Input
              id="footer_phone"
              type="tel"
              placeholder="+90 555 555 55 55"
              value={settings.footer_phone ?? ''}
              onChange={(e) => update('footer_phone', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              WhatsApp Numarası
            </Label>
            <Input
              id="whatsapp_number"
              type="tel"
              placeholder="+905555555555"
              value={settings.whatsapp_number ?? ''}
              onChange={(e) => update('whatsapp_number', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Ülke kodu dahil, boşluksuz (örn: +905551234567)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer_address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Adres
            </Label>
            <Textarea
              id="footer_address"
              placeholder="Atatürk Cad. No:123&#10;İstanbul, Türkiye"
              rows={3}
              value={settings.footer_address ?? ''}
              onChange={(e) => update('footer_address', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ==================== Sosyal Medya ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Sosyal Medya Hesapları
          </CardTitle>
          <CardDescription>
            Footer ve ilgili sayfalarda gösterilecek sosyal medya bağlantıları
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebook_url" className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-muted-foreground" />
              Facebook
            </Label>
            <Input
              id="facebook_url"
              type="url"
              placeholder="https://facebook.com/sayfaniz"
              value={settings.facebook_url ?? ''}
              onChange={(e) => update('facebook_url', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram_url" className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-muted-foreground" />
              Instagram
            </Label>
            <Input
              id="instagram_url"
              type="url"
              placeholder="https://instagram.com/hesabiniz"
              value={settings.instagram_url ?? ''}
              onChange={(e) => update('instagram_url', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter_url" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Twitter / X
            </Label>
            <Input
              id="twitter_url"
              type="url"
              placeholder="https://x.com/hesabiniz"
              value={settings.twitter_url ?? ''}
              onChange={(e) => update('twitter_url', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_url" className="flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-muted-foreground" />
              LinkedIn
            </Label>
            <Input
              id="linkedin_url"
              type="url"
              placeholder="https://linkedin.com/company/sirketiniz"
              value={settings.linkedin_url ?? ''}
              onChange={(e) => update('linkedin_url', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube_url" className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-muted-foreground" />
              YouTube
            </Label>
            <Input
              id="youtube_url"
              type="url"
              placeholder="https://youtube.com/@kanaliniz"
              value={settings.youtube_url ?? ''}
              onChange={(e) => update('youtube_url', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram_channel_url" className="flex items-center gap-2">
              <Send className="w-4 h-4 text-muted-foreground" />
              Telegram
            </Label>
            <Input
              id="telegram_channel_url"
              type="url"
              placeholder="https://t.me/kanaliniz"
              value={settings.telegram_channel_url ?? ''}
              onChange={(e) => update('telegram_channel_url', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
