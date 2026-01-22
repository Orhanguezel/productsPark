
"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useGetAssetAdminQuery } from "@/integrations/hooks";

export function ThumbById({ id, onRemove, isCover }: {
  id: string;
  onRemove?: () => void;
  isCover?: boolean;
}) {
  const { data } = useGetAssetAdminQuery({ id }, { skip: !id });
  const url = (data as any)?.url || (data as any)?.secure_url || (data as any)?.cdn_url || "";

  return (
    <div className="group relative">
      <img src={url} className="h-24 w-24 rounded border object-cover" alt="" />
      <div className="absolute inset-0 hidden items-center justify-center gap-1 rounded bg-black/40 p-1 group-hover:flex">
        {onRemove && (
          <Button size="sm" variant="destructive" onClick={onRemove} className="h-7 px-2">
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Sil
          </Button>
        )}
      </div>
      {isCover && (
        <div className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          Kapak
        </div>
      )}
    </div>
  );
}
