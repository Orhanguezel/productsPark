// src/components/layout/Footer.tsx
import {
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  YoutubeIcon,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

import {
  useListMenuItemsQuery,
} from "@/integrations/metahub/rtk/endpoints/menu_items.endpoints";
import type { MenuItemRow } from "@/integrations/metahub/rtk/types/menu";

import {
  useGetSiteSettingByKeyQuery,
  type JsonLike,
} from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

import {
  useListFooterSectionsQuery,
} from "@/integrations/metahub/rtk/endpoints/footer_sections.endpoints";
import type { FooterSection as FooterSectionModel } from "@/integrations/metahub/rtk/types/footer";

/* ---------- helpers ---------- */

const toStr = (v: JsonLike | undefined, fallback: string): string => {
  if (typeof v === "string" && v.trim() !== "") return v;
  return fallback;
};

const DEFAULT_SOCIAL_LINKS = {
  facebook: "#",
  twitter: "#",
  instagram: "#",
  youtube: "#",
};

const DEFAULT_FOOTER_SETTINGS = {
  company_name: "Dijital Market",
  description:
    "Güvenilir dijital ürün satış platformu. En uygun fiyatlarla lisans, hesap, yazılım ve daha fazlası.",
  copyright: "© 2024 Dijital Market. Tüm hakları saklıdır.",
  email: "destek@dijitalmarket.com",
  phone: "+90 555 123 45 67",
  address: "Atatürk Cad. No:123\nİstanbul, Türkiye",
};

/* ---------- component ---------- */

const Footer = () => {
  // RTK: footer menü item’ları (location: footer)
  const { data: menuItemsData = [] } = useListMenuItemsQuery({
    location: "footer",
    is_active: true,
    order: "order_num",
  });

  const menuItems: MenuItemRow[] = menuItemsData.filter(
    (i) => i.is_active && (i.location === "footer" || i.location == null),
  );

  // RTK: footer_sections (public)
  const { data: footerSectionsData = [] } = useListFooterSectionsQuery({
    is_active: true,
    order: "asc",
  });

  const footerSections: FooterSectionModel[] = footerSectionsData;

  // RTK: site_settings – sosyal linkler
  const { data: facebookSetting } = useGetSiteSettingByKeyQuery("facebook_url");
  const { data: twitterSetting } = useGetSiteSettingByKeyQuery("twitter_url");
  const { data: instagramSetting } = useGetSiteSettingByKeyQuery("instagram_url");
  const { data: youtubeSetting } = useGetSiteSettingByKeyQuery("youtube_url");

  const socialLinks = {
    facebook: toStr(facebookSetting?.value, DEFAULT_SOCIAL_LINKS.facebook),
    twitter: toStr(twitterSetting?.value, DEFAULT_SOCIAL_LINKS.twitter),
    instagram: toStr(instagramSetting?.value, DEFAULT_SOCIAL_LINKS.instagram),
    youtube: toStr(youtubeSetting?.value, DEFAULT_SOCIAL_LINKS.youtube),
  };

  // RTK: site_settings – footer metinleri
  const { data: companyNameSetting } =
    useGetSiteSettingByKeyQuery("footer_company_name");
  const { data: descriptionSetting } =
    useGetSiteSettingByKeyQuery("footer_description");
  const { data: copyrightSetting } =
    useGetSiteSettingByKeyQuery("footer_copyright");
  const { data: emailSetting } =
    useGetSiteSettingByKeyQuery("footer_email");
  const { data: phoneSetting } =
    useGetSiteSettingByKeyQuery("footer_phone");
  const { data: addressSetting } =
    useGetSiteSettingByKeyQuery("footer_address");

  const footerSettings = {
    company_name: toStr(
      companyNameSetting?.value,
      DEFAULT_FOOTER_SETTINGS.company_name,
    ),
    description: toStr(
      descriptionSetting?.value,
      DEFAULT_FOOTER_SETTINGS.description,
    ),
    copyright: toStr(
      copyrightSetting?.value,
      DEFAULT_FOOTER_SETTINGS.copyright,
    ),
    email: toStr(emailSetting?.value, DEFAULT_FOOTER_SETTINGS.email),
    phone: toStr(phoneSetting?.value, DEFAULT_FOOTER_SETTINGS.phone),
    address: toStr(addressSetting?.value, DEFAULT_FOOTER_SETTINGS.address),
  };

  // section_id’si olmayan menü item’ları
  const orphanItems = menuItems.filter((i) => !i.section_id);

  return (
    <footer className="bg-muted text-foreground border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  {footerSettings.company_name.charAt(0)}
                </span>
              </div>
              <span className="font-bold text-xl text-foreground">
                {footerSettings.company_name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {footerSettings.description}
            </p>
            <div className="flex gap-3">
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-smooth"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-smooth"
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-smooth"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href={socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-smooth"
              >
                <YoutubeIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Dynamic Footer Sections */}
          {footerSections.map((section) => {
            const sectionItems = menuItems.filter(
              (item) => item.section_id === section.id,
            );
            if (sectionItems.length === 0) return null;

            return (
              <div key={section.id}>
                <h3 className="font-semibold mb-4 text-foreground">
                  {section.title}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {sectionItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={item.url}
                        className="hover:text-primary transition-smooth"
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Bölümsüz linkler */}
          {orphanItems.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4 text-foreground">
                Bağlantılar
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {orphanItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.url}
                      className="hover:text-primary transition-smooth"
                    >
                      {item.title}
                    </a>
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
                  href={`tel:${footerSettings.phone.replace(/\s/g, "")}`}
                  className="hover:text-primary transition-smooth"
                >
                  {footerSettings.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span style={{ whiteSpace: "pre-line" }}>
                  {footerSettings.address}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>{footerSettings.copyright}</p>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="hover:text-primary transition-smooth">
                Kullanım Koşulları
              </a>
              <a href="#" className="hover:text-primary transition-smooth">
                Gizlilik Politikası
              </a>
              <a href="#" className="hover:text-primary transition-smooth">
                Çerez Politikası
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
