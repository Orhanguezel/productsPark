import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { ScrollArea } from "@/components/ui/scroll-area";

const Newsletter = () => {
  const [scrollContent, setScrollContent] = useState("<h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz.</p>");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchScrollContent();
  }, []);

  const fetchScrollContent = async () => {
    try {
      const { data: contentData, error: contentError } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "home_scroll_content")
        .maybeSingle();

      const { data: activeData, error: activeError } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "home_scroll_content_active")
        .maybeSingle();

      if (contentError) {
        console.error("Error fetching scroll content:", contentError);
      }

      if (activeError) {
        console.error("Error fetching scroll content active status:", activeError);
      }

      if (contentData && typeof contentData.value === "string") {
        setScrollContent(contentData.value);
      }

      if (activeData && typeof activeData.value === "boolean") {
        setIsActive(activeData.value);
      }
    } catch (error) {
      console.error("Error fetching scroll content:", error);
    }
  };



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
