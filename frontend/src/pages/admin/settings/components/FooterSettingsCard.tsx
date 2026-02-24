// =============================================================
// FILE: src/components/admin/settings/FooterSettingsCard.tsx
// =============================================================
"use client";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateAssetAdminMutation } from "@/integrations/hooks";
import type { Dispatch, SetStateAction } from "react";

function pickUrl(res: unknown): string | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  return (
    (typeof r.url === "string" ? r.url : null) ??
    (typeof r.public_url === "string" ? r.public_url : null) ??
    (r.data && typeof (r.data as Record<string, unknown>).url === "string"
      ? ((r.data as Record<string, unknown>).url as string)
      : null) ??
    (r.asset && typeof (r.asset as Record<string, unknown>).url === "string"
      ? ((r.asset as Record<string, unknown>).url as string)
      : null) ??
    null
  );
}

function LogoField({
  label,
  description,
  value,
  onChange,
  onUpload,
  uploading,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex gap-2">
        <Input
          placeholder="https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={uploading}
        />
        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")} disabled={uploading}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-end gap-3">
        {value ? (
          <img
            src={value}
            alt={label}
            className="h-12 max-w-[160px] rounded border object-contain bg-white p-1"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="h-12 w-[160px] rounded border bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Önizleme yok</span>
          </div>
        )}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.currentTarget.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <ImagePlus className="h-4 w-4 mr-2" />
            {uploading ? "Yükleniyor…" : "Dosya Yükle"}
          </Button>
        </div>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")} disabled={uploading} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Kaldır
          </Button>
        )}
      </div>
    </div>
  );
}

export default function FooterSettingsCard({ settings, setSettings }: { settings: any; setSettings: Dispatch<SetStateAction<any>> }) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadAsset] = useCreateAssetAdminMutation();

  const handleUpload = async (key: "light_logo" | "dark_logo", file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
      return;
    }
    try {
      setUploading(key);
      const res = await uploadAsset({
        file,
        bucket: "brand",
        folder: "logos",
        metadata: { module: "footer", kind: key },
      }).unwrap();
      const url = pickUrl(res);
      if (!url) throw new Error("Yükleme tamamlandı ama URL alınamadı");
      setSettings((s: any) => ({ ...s, [key]: url }));
      toast.success("Logo yüklendi");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err instanceof Error ? err.message : "Yükleme sırasında hata oluştu");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Logo */}
      <Card>
        <CardHeader><CardTitle>Footer Logo</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <LogoField
            label="Light Tema Logosu"
            description="Açık arka plan üzerinde gösterilecek logo"
            value={settings.light_logo ?? ""}
            onChange={(url) => setSettings((s: any) => ({ ...s, light_logo: url }))}
            onUpload={(file) => handleUpload("light_logo", file)}
            uploading={uploading === "light_logo"}
          />
          <div className="border-t pt-4">
            <LogoField
              label="Dark Tema Logosu"
              description="Koyu arka plan üzerinde gösterilecek logo"
              value={settings.dark_logo ?? ""}
              onChange={(url) => setSettings((s: any) => ({ ...s, dark_logo: url }))}
              onUpload={(file) => handleUpload("dark_logo", file)}
              uploading={uploading === "dark_logo"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metin Ayarları */}
      <Card>
        <CardHeader><CardTitle>Footer Ayarları</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Şirket Adı</Label><Input value={settings.footer_company_name || ""} onChange={(e) => setSettings((s: any) => ({ ...s, footer_company_name: e.target.value }))} placeholder="Dijital Market" /></div>
          <div className="space-y-2"><Label>Açıklama</Label><Textarea rows={3} value={settings.footer_description || ""} onChange={(e) => setSettings((s: any) => ({ ...s, footer_description: e.target.value }))} placeholder="Kısa açıklama..." /></div>
          <div className="space-y-2"><Label>Copyright</Label><Input value={settings.footer_copyright || ""} onChange={(e) => setSettings((s: any) => ({ ...s, footer_copyright: e.target.value }))} placeholder="© 2025 Dijital Market" /></div>
          <div className="space-y-2"><Label>E‑posta</Label><Input type="email" value={settings.contact_email || ""} onChange={(e) => setSettings((s: any) => ({ ...s, footer_email: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Telefon</Label><Input value={settings.footer_phone || ""} onChange={(e) => setSettings((s: any) => ({ ...s, footer_phone: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Adres</Label><Textarea rows={2} value={settings.footer_address || ""} onChange={(e) => setSettings((s: any) => ({ ...s, footer_address: e.target.value }))} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
