// =============================================================
// FILE: src/components/admin/products/form/sections/CategorySelect.tsx
// =============================================================

import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CategoryRow, ProductAdmin } from "@/integrations/metahub/db/types/products";

type Props = {
  parentCategories: Pick<CategoryRow, "id" | "name" | "parent_id">[];
  subCategories: Pick<CategoryRow, "id" | "name" | "parent_id">[];
  selectedParentId: string;
  setSelectedParentId: (v: string) => void;
  formData: Partial<ProductAdmin>;
  setField: <K extends keyof ProductAdmin>(key: K, val: ProductAdmin[K] | any) => void;
};

export default function CategorySelect({
  parentCategories,
  subCategories,
  selectedParentId,
  setSelectedParentId,
  formData,
  setField,
}: Props) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="parent_category">Üst Kategori</Label>
        <Select
          value={selectedParentId}
          onValueChange={(v) => {
            setSelectedParentId(v);
            setField("category_id", "");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Üst kategori seçin" />
          </SelectTrigger>
          <SelectContent>
            {parentCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!!selectedParentId && (
        <div className="space-y-2">
          <Label htmlFor="category_id">Alt Kategori (opsiyonel)</Label>
          <Select value={(formData.category_id as string) ?? ""} onValueChange={(v) => setField("category_id", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Alt kategori seçin veya üst kategori kullan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={selectedParentId}>
                {parentCategories.find((c) => c.id === selectedParentId)?.name} (Üst Kategori)
              </SelectItem>
              {subCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
