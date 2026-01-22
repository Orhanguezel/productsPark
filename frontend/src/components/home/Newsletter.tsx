// =============================================================
// FILE: src/components/home/Newsletter.tsx
// FINAL — Home Newsletter / Scroll Content
// - uses RTK listSiteSettings(keys=...)
// - subscribe via /newsletter/subscribe
// - uses shared helpers from integrations/utils/publicHome
// - includes Sonner toast for success/error
// - hooks order OK
// =============================================================

import React, { useMemo, useState } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';

import { useListSiteSettingsQuery, useSubscribeNewsletterMutation } from '@/integrations/hooks';

import type { JsonLike } from '@/integrations/types';
import { toStr, toBool, isValidEmail, jsonLikeToBoolLike, toHtml} from '@/integrations/types';

const DEFAULT_SCROLL_CONTENT =
  '<h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz.</p>';

const Newsletter: React.FC = () => {
  // ✅ hooks: koşulsuz, en üstte
  const [email, setEmail] = useState('');
  const [subscribe, { isLoading: subscribing }] = useSubscribeNewsletterMutation();

  const keys = useMemo(
    () => [
      'home_scroll_content_active',
      'home_scroll_content',
      'home_newsletter_title',
      'home_newsletter_subtitle',
      'home_newsletter_placeholder',
      'home_newsletter_button',
    ],
    [],
  );

  const {
    data: settingsList,
    isLoading,
    isFetching,
  } = useListSiteSettingsQuery({
    keys,
    order: 'key.asc',
    limit: 50,
    offset: 0,
  });

  const map = useMemo(() => {
    const m = new Map<string, JsonLike>();
    for (const row of settingsList ?? []) m.set(row.key, row.value);
    return m;
  }, [settingsList]);

  const isActive = toBool(jsonLikeToBoolLike(map.get('home_scroll_content_active')), true);
  const loading = isLoading || isFetching;

  if (!isActive) return null;

  const scrollContent = toHtml(map.get('home_scroll_content'), DEFAULT_SCROLL_CONTENT);

  const title = toStr(map.get('home_newsletter_title')).trim() || 'Bültenimize Katılın';
  const subtitle =
    toStr(map.get('home_newsletter_subtitle')).trim() ||
    'Kampanyalar ve yeni ürünler hakkında haberdar olun.';

  const placeholder = toStr(map.get('home_newsletter_placeholder')).trim() || 'E-posta adresiniz';
  const buttonText = toStr(map.get('home_newsletter_button')).trim() || 'Abone Ol';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = email.trim();
    if (!isValidEmail(value)) {
      toast.error('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    try {
      await subscribe({ email: value }).unwrap();
      setEmail('');
      toast.success('Aboneliğiniz alındı.');
    } catch (err) {
      // RTK error shape çok değişken; güvenli mesaj:
      toast.error('Abonelik işlemi başarısız. Lütfen tekrar deneyin.');
      // İstersen dev’de log:
      // console.error('newsletter subscribe error:', err);
    }
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          {/* Scroll Content */}
          <ScrollArea className="h-[400px] w-full">
            {loading ? (
              <div className="p-8 md:p-12 text-muted-foreground">Yükleniyor...</div>
            ) : (
              <div
                className="p-8 md:p-12 prose prose-sm max-w-none dark:prose-invert [&_*]:!text-foreground"
                dangerouslySetInnerHTML={{ __html: scrollContent }}
              />
            )}
          </ScrollArea>

          {/* Header + Form */}
          <div className="p-8 md:p-12 border-t border-border">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
              {subtitle ? <p className="mt-3 text-muted-foreground">{subtitle}</p> : null}

              <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={placeholder}
                  inputMode="email"
                  autoComplete="email"
                />
                <Button type="submit" disabled={subscribing || !isValidEmail(email)}>
                  {subscribing ? 'Gönderiliyor...' : buttonText}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
