// src/components/layout/Footer.tsx
import {
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  YoutubeIcon,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';

import {
  useListMenuItemsQuery,
  useGetSiteSettingByKeyQuery,
  useListFooterSectionsQuery,
  useListPaymentProvidersQuery,
} from '@/integrations/hooks';
import type { MenuItem, JsonLike, FooterSection as FooterSectionModel } from '@/integrations/types';

/* ---------- helpers ---------- */

const toStr = (v: JsonLike | undefined, fallback: string): string => {
  if (typeof v === 'string' && v.trim() !== '') return v;
  return fallback;
};

const toStrOrNull = (v: JsonLike | undefined): string | null => {
  if (typeof v === 'string' && v.trim() !== '') return v;
  return null;
};

const DEFAULT_SOCIAL_LINKS = {
  facebook: '#',
  twitter: '#',
  instagram: '#',
  youtube: '#',
};

const DEFAULT_FOOTER_SETTINGS = {
  company_name: 'Dijital Market',
  description:
    'Güvenilir dijital ürün satış platformu. En uygun fiyatlarla lisans, hesap, yazılım ve daha fazlası.',
  copyright: '© 2024 Dijital Market. Tüm hakları saklıdır.',
  email: 'destek@dijitalmarket.com',
  phone: '+90 555 123 45 67',
  address: 'Atatürk Cad. No:123\nİstanbul, Türkiye',
};

/* ---------- component ---------- */

const Footer = () => {
  const { theme } = useTheme();

  // RTK: footer menü item'ları (location: footer)
  const { data: menuItemsData = [] } = useListMenuItemsQuery({
    location: 'footer',
    is_active: true,
    order: 'order_num',
  });

  const menuItems: MenuItem[] = menuItemsData.filter(
    (i) => i.is_active && (i.location === 'footer' || i.location == null),
  );

  // RTK: footer_sections (public)
  const { data: footerSectionsData = [] } = useListFooterSectionsQuery({
    is_active: true,
    order: 'asc',
  });

  // Bölümleri ayır: link bölümleri vs özel bölümler
  const footerSections: FooterSectionModel[] = footerSectionsData.filter(
    (s) => s.section_type !== 'payment_methods',
  );
  const paymentMethodsSection = footerSectionsData.find(
    (s) => s.section_type === 'payment_methods',
  );

  // RTK: site_settings – sosyal linkler
  const { data: facebookSetting } = useGetSiteSettingByKeyQuery('facebook_url');
  const { data: twitterSetting } = useGetSiteSettingByKeyQuery('twitter_url');
  const { data: instagramSetting } = useGetSiteSettingByKeyQuery('instagram_url');
  const { data: youtubeSetting } = useGetSiteSettingByKeyQuery('youtube_url');

  const socialLinks = {
    facebook: toStr(facebookSetting?.value, DEFAULT_SOCIAL_LINKS.facebook),
    twitter: toStr(twitterSetting?.value, DEFAULT_SOCIAL_LINKS.twitter),
    instagram: toStr(instagramSetting?.value, DEFAULT_SOCIAL_LINKS.instagram),
    youtube: toStr(youtubeSetting?.value, DEFAULT_SOCIAL_LINKS.youtube),
  };
  const socialItems = [
    {
      key: 'facebook',
      href: socialLinks.facebook,
      label: 'Facebook',
      Icon: FacebookIcon,
      className:
        'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/30 hover:bg-[#1877F2] hover:text-white',
    },
    {
      key: 'twitter',
      href: socialLinks.twitter,
      label: 'X / Twitter',
      Icon: TwitterIcon,
      className:
        'bg-slate-500/10 text-slate-700 border-slate-500/30 hover:bg-slate-700 hover:text-white dark:text-slate-300 dark:hover:bg-slate-200 dark:hover:text-slate-900',
    },
    {
      key: 'instagram',
      href: socialLinks.instagram,
      label: 'Instagram',
      Icon: InstagramIcon,
      className:
        'bg-[#E4405F]/10 text-[#E4405F] border-[#E4405F]/30 hover:bg-[#E4405F] hover:text-white',
    },
    {
      key: 'youtube',
      href: socialLinks.youtube,
      label: 'YouTube',
      Icon: YoutubeIcon,
      className:
        'bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/30 hover:bg-[#FF0000] hover:text-white',
    },
  ] as const;

  // RTK: site_settings – footer metinleri
  const { data: companyNameSetting } = useGetSiteSettingByKeyQuery('footer_company_name');
  const { data: descriptionSetting } = useGetSiteSettingByKeyQuery('footer_description');
  const { data: copyrightSetting } = useGetSiteSettingByKeyQuery('footer_copyright');
  const { data: footerEmailSetting } = useGetSiteSettingByKeyQuery('footer_email');
  const { data: phoneSetting } = useGetSiteSettingByKeyQuery('footer_phone');
  const { data: addressSetting } = useGetSiteSettingByKeyQuery('footer_address');

  // RTK: aktif ödeme sağlayıcıları (footer logolar için)
  const { data: paymentProviders = [] } = useListPaymentProvidersQuery({ is_active: true });
  const providersWithLogo = paymentProviders.filter((p) => p.logo_url);

  // RTK: site_settings – logo
  const { data: lightLogoSetting } = useGetSiteSettingByKeyQuery('light_logo');
  const { data: darkLogoSetting } = useGetSiteSettingByKeyQuery('dark_logo');

  const logoUrl = theme === 'dark'
    ? (darkLogoSetting?.value as string) || (lightLogoSetting?.value as string) || ''
    : (lightLogoSetting?.value as string) || (darkLogoSetting?.value as string) || '';

  // RTK: site_settings – contact_email (öncelikli iletişim e-postası)
  const { data: contactEmailSetting } = useGetSiteSettingByKeyQuery('contact_email');

  // E-posta: contact_email → footer_email → default
  const resolvedEmail =
    toStrOrNull(contactEmailSetting?.value) ??
    toStrOrNull(footerEmailSetting?.value) ??
    DEFAULT_FOOTER_SETTINGS.email;

  const footerSettings = {
    company_name: toStr(companyNameSetting?.value, DEFAULT_FOOTER_SETTINGS.company_name),
    description: toStr(descriptionSetting?.value, DEFAULT_FOOTER_SETTINGS.description),
    copyright: toStr(copyrightSetting?.value, DEFAULT_FOOTER_SETTINGS.copyright),
    email: resolvedEmail,
    phone: toStr(phoneSetting?.value, DEFAULT_FOOTER_SETTINGS.phone),
    address: toStr(addressSetting?.value, DEFAULT_FOOTER_SETTINGS.address),
  };

  // section_id'si olmayan menü item'ları
  const orphanItems = menuItems.filter((i) => !i.section_id);

  return (
    <footer className="bg-muted text-foreground border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={footerSettings.company_name}
                  width={200}
                  height={56}
                  className="h-14 w-auto object-contain"
                />
              ) : (
                <>
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">
                      {footerSettings.company_name.charAt(0)}
                    </span>
                  </div>
                  <span className="font-bold text-xl text-foreground">
                    {footerSettings.company_name}
                  </span>
                </>
              )}
            </Link>
            <p className="text-sm text-muted-foreground mb-4">{footerSettings.description}</p>
            <div className="flex gap-2">
              {socialItems.map(({ key, href, label, Icon, className }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 ${className}`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Dynamic Footer Sections */}
          {footerSections.map((section) => {
            const sectionItems = menuItems.filter((item) => item.section_id === section.id);
            if (sectionItems.length === 0) return null;

            return (
              <div key={section.id}>
                <h3 className="font-semibold mb-4 text-foreground">{section.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {sectionItems.map((item) => (
                    <li key={item.id}>
                      <Link to={item.url ?? '#'} className="hover:text-primary transition-smooth">
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Bölümsüz linkler */}
          {orphanItems.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Bağlantılar</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {orphanItems.map((item) => (
                  <li key={item.id}>
                    <Link to={item.url ?? '#'} className="hover:text-primary transition-smooth">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">İletişim</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a
                  href={`mailto:${footerSettings.email}`}
                  className="hover:text-primary transition-smooth"
                >
                  {footerSettings.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a
                  href={`tel:${footerSettings.phone.replace(/\s/g, '')}`}
                  className="hover:text-primary transition-smooth"
                >
                  {footerSettings.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span style={{ whiteSpace: 'pre-line' }}>{footerSettings.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {paymentMethodsSection && providersWithLogo.length > 0 && (
          <div className="border-t border-border mt-8 pt-8">
            <h3 className="font-semibold text-sm text-foreground mb-4">{paymentMethodsSection.title}</h3>
            <div className="flex flex-wrap items-center gap-3">
              {providersWithLogo.map((p) => (
                <div
                  key={p.id}
                  className="h-10 px-3 rounded-lg border border-border bg-background flex items-center justify-center hover:border-primary/40 transition-colors"
                  title={p.display_name}
                >
                  <img
                    src={p.logo_url!}
                    alt={p.display_name}
                    className="h-6 w-auto object-contain"
                    style={{ maxWidth: '80px' }}
                    width={80}
                    height={24}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>{footerSettings.copyright}</p>
            <div className="flex flex-wrap gap-4">
              <Link to="/kampanyalar" className="hover:text-primary transition-smooth">
                Kampanyalar
              </Link>
              <Link to="/kullanim-kosullari" className="hover:text-primary transition-smooth">
                Kullanım Koşulları
              </Link>
              <Link to="/gizlilik-sozlesmesi" className="hover:text-primary transition-smooth">
                Gizlilik Politikası
              </Link>
              <Link to="/cerez-politikasi" className="hover:text-primary transition-smooth">
                Çerez Politikası
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
