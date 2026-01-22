'use client';

// =============================================================
// FILE: src/pages/admin/settings/components/SeoSettingsCard.tsx
// FINAL — SEO Settings Card (seed birebir: home/blog/products/categories/contact + optional pages)
// - Parent SettingsPage compatible (generic T)
// - Safe read/write via Record<string, unknown>
// - exactOptionalPropertyTypes friendly
// =============================================================

import * as React from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props<T> = {
  settings: T;
  setSettings: Dispatch<SetStateAction<T>>;
};

type SeoStringKey =
  | 'site_title'
  | 'site_description'
  | 'seo_home_title'
  | 'seo_home_description'
  | 'seo_blog_title'
  | 'seo_blog_description'
  | 'seo_products_title'
  | 'seo_products_description'
  | 'seo_categories_title'
  | 'seo_categories_description'
  | 'seo_contact_title'
  | 'seo_contact_description'
  | 'seo_about_title'
  | 'seo_about_description'
  | 'seo_campaigns_title'
  | 'seo_campaigns_description'
  | 'seo_cart_title'
  | 'seo_cart_description'
  | 'seo_checkout_title'
  | 'seo_checkout_description'
  | 'seo_login_title'
  | 'seo_login_description'
  | 'seo_register_title'
  | 'seo_register_description'
  | 'seo_faq_title'
  | 'seo_faq_description'
  | 'seo_terms_title'
  | 'seo_terms_description'
  | 'seo_privacy_title'
  | 'seo_privacy_description';

const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

function FieldTitle<T>({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function FieldDesc({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function SeoSettingsCard<T>({ settings, setSettings }: Props<T>) {
  const dyn = settings as unknown as Record<string, unknown>;

  const setField =
    (key: SeoStringKey) =>
    (value: string): void => {
      setSettings((prev) => {
        const out = { ...(prev as unknown as Record<string, unknown>) };
        out[key] = value;
        return out as unknown as T;
      });
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Sayfaları</CardTitle>
      </CardHeader>

      <CardContent className="space-y-10">
        {/* Site identity */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Site Kimliği</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldTitle
              id="site_title"
              label="Site Başlığı"
              value={toStr(dyn.site_title)}
              onChange={setField('site_title')}
              placeholder="Site genel başlığı"
            />
            <FieldDesc
              id="site_description"
              label="Site Açıklaması"
              value={toStr(dyn.site_description)}
              onChange={setField('site_description')}
              placeholder="Site genel açıklaması"
              rows={3}
            />
          </div>
        </section>

        {/* Home */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Ana Sayfa</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldTitle
              id="seo_home_title"
              label="Başlık"
              value={toStr(dyn.seo_home_title)}
              onChange={setField('seo_home_title')}
              placeholder="Ana sayfa başlığı"
            />
            <FieldDesc
              id="seo_home_description"
              label="Açıklama"
              value={toStr(dyn.seo_home_description)}
              onChange={setField('seo_home_description')}
              placeholder="Ana sayfa açıklaması"
            />
          </div>
        </section>

        {/* Blog */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Blog (Liste)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldTitle
              id="seo_blog_title"
              label="Başlık"
              value={toStr(dyn.seo_blog_title)}
              onChange={setField('seo_blog_title')}
              placeholder="Blog sayfası başlığı"
            />
            <FieldDesc
              id="seo_blog_description"
              label="Açıklama"
              value={toStr(dyn.seo_blog_description)}
              onChange={setField('seo_blog_description')}
              placeholder="Blog sayfası açıklaması"
            />
          </div>
        </section>

        {/* Products */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Ürünler</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldTitle
              id="seo_products_title"
              label="Başlık"
              value={toStr(dyn.seo_products_title)}
              onChange={setField('seo_products_title')}
              placeholder="Ürünler sayfası başlığı"
            />
            <FieldDesc
              id="seo_products_description"
              label="Açıklama"
              value={toStr(dyn.seo_products_description)}
              onChange={setField('seo_products_description')}
              placeholder="Ürünler sayfası açıklaması"
            />
          </div>
        </section>

        {/* Categories */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Kategoriler</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldTitle
              id="seo_categories_title"
              label="Başlık"
              value={toStr(dyn.seo_categories_title)}
              onChange={setField('seo_categories_title')}
              placeholder="Kategoriler sayfası başlığı"
            />
            <FieldDesc
              id="seo_categories_description"
              label="Açıklama"
              value={toStr(dyn.seo_categories_description)}
              onChange={setField('seo_categories_description')}
              placeholder="Kategoriler sayfası açıklaması"
            />
          </div>
        </section>

        {/* Contact */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">İletişim</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldTitle
              id="seo_contact_title"
              label="Başlık"
              value={toStr(dyn.seo_contact_title)}
              onChange={setField('seo_contact_title')}
              placeholder="İletişim sayfası başlığı"
            />
            <FieldDesc
              id="seo_contact_description"
              label="Açıklama"
              value={toStr(dyn.seo_contact_description)}
              onChange={setField('seo_contact_description')}
              placeholder="İletişim sayfası açıklaması"
            />
          </div>
        </section>

        {/* Optional pages */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Diğer Sayfalar</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldTitle
              id="seo_about_title"
              label="Hakkımızda Başlık"
              value={toStr(dyn.seo_about_title)}
              onChange={setField('seo_about_title')}
            />
            <FieldDesc
              id="seo_about_description"
              label="Hakkımızda Açıklama"
              value={toStr(dyn.seo_about_description)}
              onChange={setField('seo_about_description')}
            />

            <FieldTitle
              id="seo_campaigns_title"
              label="Kampanyalar Başlık"
              value={toStr(dyn.seo_campaigns_title)}
              onChange={setField('seo_campaigns_title')}
            />
            <FieldDesc
              id="seo_campaigns_description"
              label="Kampanyalar Açıklama"
              value={toStr(dyn.seo_campaigns_description)}
              onChange={setField('seo_campaigns_description')}
            />

            <FieldTitle
              id="seo_cart_title"
              label="Sepet Başlık"
              value={toStr(dyn.seo_cart_title)}
              onChange={setField('seo_cart_title')}
            />
            <FieldDesc
              id="seo_cart_description"
              label="Sepet Açıklama"
              value={toStr(dyn.seo_cart_description)}
              onChange={setField('seo_cart_description')}
            />

            <FieldTitle
              id="seo_checkout_title"
              label="Ödeme Başlık"
              value={toStr(dyn.seo_checkout_title)}
              onChange={setField('seo_checkout_title')}
            />
            <FieldDesc
              id="seo_checkout_description"
              label="Ödeme Açıklama"
              value={toStr(dyn.seo_checkout_description)}
              onChange={setField('seo_checkout_description')}
            />

            <FieldTitle
              id="seo_login_title"
              label="Giriş Başlık"
              value={toStr(dyn.seo_login_title)}
              onChange={setField('seo_login_title')}
            />
            <FieldDesc
              id="seo_login_description"
              label="Giriş Açıklama"
              value={toStr(dyn.seo_login_description)}
              onChange={setField('seo_login_description')}
            />

            <FieldTitle
              id="seo_register_title"
              label="Kayıt Başlık"
              value={toStr(dyn.seo_register_title)}
              onChange={setField('seo_register_title')}
            />
            <FieldDesc
              id="seo_register_description"
              label="Kayıt Açıklama"
              value={toStr(dyn.seo_register_description)}
              onChange={setField('seo_register_description')}
            />

            <FieldTitle
              id="seo_faq_title"
              label="SSS Başlık"
              value={toStr(dyn.seo_faq_title)}
              onChange={setField('seo_faq_title')}
            />
            <FieldDesc
              id="seo_faq_description"
              label="SSS Açıklama"
              value={toStr(dyn.seo_faq_description)}
              onChange={setField('seo_faq_description')}
            />

            <FieldTitle
              id="seo_terms_title"
              label="Kullanım Şartları Başlık"
              value={toStr(dyn.seo_terms_title)}
              onChange={setField('seo_terms_title')}
            />
            <FieldDesc
              id="seo_terms_description"
              label="Kullanım Şartları Açıklama"
              value={toStr(dyn.seo_terms_description)}
              onChange={setField('seo_terms_description')}
            />

            <FieldTitle
              id="seo_privacy_title"
              label="Gizlilik Başlık"
              value={toStr(dyn.seo_privacy_title)}
              onChange={setField('seo_privacy_title')}
            />
            <FieldDesc
              id="seo_privacy_description"
              label="Gizlilik Açıklama"
              value={toStr(dyn.seo_privacy_description)}
              onChange={setField('seo_privacy_description')}
            />
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
