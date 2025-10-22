import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { Helmet } from "react-helmet-async";

export const useCustomScripts = () => {
  const [customHeaderCode, setCustomHeaderCode] = useState<string>("");
  const [customFooterCode, setCustomFooterCode] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomScripts();

    const channel = metahub
      .channel('custom-scripts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
        },
        (payload) => {
          const key = (payload.new as any)?.key || (payload.old as any)?.key;
          if (key === 'custom_header_code' || key === 'custom_footer_code') {
            fetchCustomScripts();
          }
        }
      )
      .subscribe();

    return () => {
      metahub.removeChannel(channel);
    };
  }, []);

  const fetchCustomScripts = async () => {
    try {
      const { data, error } = await metahub
        .from("site_settings")
        .select("key, value")
        .in("key", ["custom_header_code", "custom_footer_code"]);

      if (error) throw error;

      data?.forEach((item) => {
        if (item.key === "custom_header_code") {
          setCustomHeaderCode((item.value as string) || "");
        } else if (item.key === "custom_footer_code") {
          setCustomFooterCode((item.value as string) || "");
        }
      });
    } catch (error) {
      console.error("Error fetching custom scripts:", error);
    } finally {
      setLoading(false);
    }
  };

  return { customHeaderCode, customFooterCode, loading };
};

export const CustomScriptsRenderer = () => {
  const { customHeaderCode, customFooterCode } = useCustomScripts();

  useEffect(() => {
    if (customFooterCode) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = customFooterCode;

      const scripts = tempDiv.getElementsByTagName('script');
      Array.from(scripts).forEach((script) => {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        Array.from(script.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        document.body.appendChild(newScript);
      });
    }
  }, [customFooterCode]);

  if (!customHeaderCode) return null;

  return (
    <Helmet>
      <meta charSet="utf-8" />
      {customHeaderCode.split('\n').map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Parse meta tags
        if (trimmed.startsWith('<meta')) {
          const nameMatch = trimmed.match(/name="([^"]+)"/);
          const contentMatch = trimmed.match(/content="([^"]+)"/);
          const propertyMatch = trimmed.match(/property="([^"]+)"/);

          if (nameMatch && contentMatch) {
            return <meta key={index} name={nameMatch[1]} content={contentMatch[1]} />;
          }
          if (propertyMatch && contentMatch) {
            return <meta key={index} property={propertyMatch[1]} content={contentMatch[1]} />;
          }
        }

        // Parse script tags
        if (trimmed.startsWith('<script')) {
          const srcMatch = trimmed.match(/src="([^"]+)"/);
          if (srcMatch) {
            return <script key={index} src={srcMatch[1]} />;
          }
        }

        // Parse link tags
        if (trimmed.startsWith('<link')) {
          const hrefMatch = trimmed.match(/href="([^"]+)"/);
          const relMatch = trimmed.match(/rel="([^"]+)"/);
          if (hrefMatch && relMatch) {
            return <link key={index} rel={relMatch[1]} href={hrefMatch[1]} />;
          }
        }

        return null;
      })}
    </Helmet>
  );
};
