// FILE: src/components/home/Newsletter.tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useGetSiteSettingByKeyQuery,
  type JsonLike,
} from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

const DEFAULT_SCROLL_CONTENT =
  '<h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz.</p>';

/** site_settings.value → boolean */
const toBool = (v: JsonLike | undefined): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(s)) return true;
    if (["0", "false", "no", "n", "off"].includes(s)) return false;
  }
  // default: aktif olsun
  return true;
};

/** site_settings.value → HTML string */
const toHtml = (v: JsonLike | undefined): string => {
  if (typeof v === "string" && v.trim().length > 0) return v;
  return DEFAULT_SCROLL_CONTENT;
};

const Newsletter = () => {
  // RTK: içerik
  const { data: contentSetting } = useGetSiteSettingByKeyQuery(
    "home_scroll_content",
  );
  // RTK: aktif/pasif
  const { data: activeSetting } = useGetSiteSettingByKeyQuery(
    "home_scroll_content_active",
  );

  const scrollContent = toHtml(contentSetting?.value);
  const isActive = toBool(activeSetting?.value);

  if (!isActive) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          <ScrollArea className="h-[400px] w-full">
            <div
              className="p-8 md:p-12 prose prose-sm max-w-none dark:prose-invert [&_*]:!text-foreground"
              dangerouslySetInnerHTML={{ __html: scrollContent }}
            />
          </ScrollArea>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
