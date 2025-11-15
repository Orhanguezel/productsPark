// =============================================================
// FILE: src/pages/admin/home-settings/ScrollContentSectionCard.tsx
// =============================================================
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { HomeSettingsSectionProps } from "./types";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export function ScrollContentSectionCard({
  settings,
  onChange,
}: HomeSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anasayfa Makale Alanı</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Aktif Switch */}
        <div className="flex items-center gap-2 pb-1">
          <Switch
            id="scroll_content_active"
            checked={settings.home_scroll_content_active}
            onCheckedChange={(checked) =>
              onChange({ home_scroll_content_active: checked })
            }
          />
          <Label htmlFor="scroll_content_active">Aktif</Label>
        </div>

        {/* İçerik (Quill) */}
        <div className="space-y-2">
          <Label>İçerik</Label>

          <div className="border rounded-md overflow-hidden">
            <ReactQuill
              value={settings.home_scroll_content}
              onChange={(value) =>
                onChange({ home_scroll_content: value })
              }
              className="bg-background"
              theme="snow"
              style={{ height: 300 }}
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  [{ color: [] }, { background: [] }],
                  ["link", "image"],
                  ["clean"],
                ],
              }}
            />
          </div>

          {/* Önizleme */}
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-2">
              Önizleme (400px max, scroll edilebilir)
            </div>
            <div
              className="prose prose-sm md:prose max-h-[400px] overflow-auto"
              dangerouslySetInnerHTML={{
                __html: settings.home_scroll_content,
              }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Bu içerik anasayfada scroll edilebilir bir alanda gösterilir
            (maks. 400px).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
