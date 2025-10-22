import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { Wrench, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MaintenanceMode = () => {
  const [settings, setSettings] = useState<{
    maintenance_message: string;
    site_title: string;
  }>({
    maintenance_message: "Sitemiz şu anda bakımda. Lütfen daha sonra tekrar deneyin.",
    site_title: "Site Bakımda"
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await metahub
        .from("site_settings")
        .select("*")
        .in("key", ["maintenance_message", "site_title"]);

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsObj = data.reduce((acc: any, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        setSettings({
          maintenance_message: settingsObj.maintenance_message || settings.maintenance_message,
          site_title: settingsObj.site_title || settings.site_title
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-card rounded-lg shadow-lg p-8 md:p-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <div className="relative bg-primary/10 p-6 rounded-full">
                <Wrench className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {settings.site_title}
            </h1>
            <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
          </div>

          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            {settings.maintenance_message}
          </p>

          <div className="pt-6">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Sayfayı Yenile
            </Button>
          </div>

          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Anlayışınız için teşekkür ederiz
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
