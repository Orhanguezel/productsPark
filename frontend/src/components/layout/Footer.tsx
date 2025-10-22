import { useEffect, useState } from "react";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { metahub } from "@/integrations/metahub/client";

interface MenuItem {
  id: string;
  title: string;
  url: string;
  is_active: boolean;
  section_id: string | null;
}

interface FooterSection {
  id: string;
  title: string;
  display_order: number;
  is_active: boolean;
}

const Footer = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [footerSections, setFooterSections] = useState<FooterSection[]>([]);
  const [socialLinks, setSocialLinks] = useState({
    facebook: "#",
    twitter: "#",
    instagram: "#",
    youtube: "#"
  });
  const [footerSettings, setFooterSettings] = useState({
    company_name: "Dijital Market",
    description: "Güvenilir dijital ürün satış platformu. En uygun fiyatlarla lisans, hesap, yazılım ve daha fazlası.",
    copyright: "© 2024 Dijital Market. Tüm hakları saklıdır.",
    email: "destek@dijitalmarket.com",
    phone: "+90 555 123 45 67",
    address: "Atatürk Cad. No:123\nİstanbul, Türkiye"
  });

  useEffect(() => {
    fetchMenuItems();
    fetchFooterSections();
    fetchSocialLinks();
    fetchFooterSettings();
  }, []);

  const fetchMenuItems = async () => {
    const { data } = await metahub
      .from("menu_items")
      .select("id, title, url, is_active, section_id")
      .eq("location", "footer")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      setMenuItems(data);
    }
  };

  const fetchFooterSections = async () => {
    const { data } = await metahub
      .from("footer_sections")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      setFooterSections(data);
    }
  };

  const fetchSocialLinks = async () => {
    try {
      const { data } = await metahub
        .from("site_settings")
        .select("key, value")
        .in("key", ["facebook_url", "twitter_url", "instagram_url", "youtube_url"]);

      if (data) {
        const links = {
          facebook: String(data.find(s => s.key === "facebook_url")?.value || "#"),
          twitter: String(data.find(s => s.key === "twitter_url")?.value || "#"),
          instagram: String(data.find(s => s.key === "instagram_url")?.value || "#"),
          youtube: String(data.find(s => s.key === "youtube_url")?.value || "#")
        };
        setSocialLinks(links);
      }
    } catch (error) {
      console.error("Error fetching social links:", error);
    }
  };

  const fetchFooterSettings = async () => {
    try {
      const { data } = await metahub
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "footer_company_name",
          "footer_description",
          "footer_copyright",
          "footer_email",
          "footer_phone",
          "footer_address"
        ]);

      if (data) {
        setFooterSettings({
          company_name: String(data.find(s => s.key === "footer_company_name")?.value || "Dijital Market"),
          description: String(data.find(s => s.key === "footer_description")?.value || "Güvenilir dijital ürün satış platformu. En uygun fiyatlarla lisans, hesap, yazılım ve daha fazlası."),
          copyright: String(data.find(s => s.key === "footer_copyright")?.value || "© 2024 Dijital Market. Tüm hakları saklıdır."),
          email: String(data.find(s => s.key === "footer_email")?.value || "destek@dijitalmarket.com"),
          phone: String(data.find(s => s.key === "footer_phone")?.value || "+90 555 123 45 67"),
          address: String(data.find(s => s.key === "footer_address")?.value || "Atatürk Cad. No:123\nİstanbul, Türkiye")
        });
      }
    } catch (error) {
      console.error("Error fetching footer settings:", error);
    }
  };

  return (
    <footer className="bg-muted text-foreground border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">{footerSettings.company_name.charAt(0)}</span>
              </div>
              <span className="font-bold text-xl text-foreground">{footerSettings.company_name}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {footerSettings.description}
            </p>
            <div className="flex gap-3">
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-smooth">
                <Facebook className="w-4 h-4" />
              </a>
              <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-smooth">
                <Twitter className="w-4 h-4" />
              </a>
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-smooth">
                <Instagram className="w-4 h-4" />
              </a>
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-smooth">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Dynamic Footer Sections */}
          {footerSections.map((section) => {
            const sectionItems = menuItems.filter(item => item.section_id === section.id);
            if (sectionItems.length === 0) return null;

            return (
              <div key={section.id}>
                <h3 className="font-semibold mb-4 text-foreground">{section.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {sectionItems.map((item) => (
                    <li key={item.id}>
                      <a href={item.url} className="hover:text-primary transition-smooth">
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">İletişim</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href={`mailto:${footerSettings.email}`} className="hover:text-primary transition-smooth">
                  {footerSettings.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a href={`tel:${footerSettings.phone.replace(/\s/g, '')}`} className="hover:text-primary transition-smooth">
                  {footerSettings.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span style={{ whiteSpace: 'pre-line' }}>
                  {footerSettings.address}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              {footerSettings.copyright}
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="hover:text-primary transition-smooth">Kullanım Koşulları</a>
              <a href="#" className="hover:text-primary transition-smooth">Gizlilik Politikası</a>
              <a href="#" className="hover:text-primary transition-smooth">Çerez Politikası</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
