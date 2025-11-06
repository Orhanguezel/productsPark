// =============================================================
// FILE: FooterMenuList.tsx
// =============================================================
"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2, FileText, ExternalLink } from "lucide-react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MenuItemAdmin } from "@/integrations/metahub/db/types/menu";
import type { FooterSection } from "@/integrations/metahub/db/types/footer";
import { availableIcons } from "./icons";

type Props = {
  sections: FooterSection[];
  items: MenuItemAdmin[];
  onReorder: (items: { id: string; display_order: number }[]) => Promise<void>;
  onEdit: (item: MenuItemAdmin) => void;
  onDelete: (id: string) => void;
};

function Row({ item, onEdit, onDelete }: {
  item: MenuItemAdmin;
  onEdit: (i: MenuItemAdmin) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const iconData = item.icon ? availableIcons.find(i => i.name === item.icon) : undefined;
  const IconComp = iconData?.Icon;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {IconComp ? (
            <IconComp className="h-4 w-4 text-primary" />
          ) : item.type === "page" ? (
            <FileText className="h-4 w-4 text-primary" />
          ) : (
            <ExternalLink className="h-4 w-4 text-primary" />
          )}
          <span className="font-medium">{item.title}</span>
          {!item.is_active && <Badge variant="secondary">Pasif</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{item.url}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    </div>
  );
}

export default function FooterMenuList({ sections, items, onReorder, onEdit, onDelete }: Props) {
  // Global sıralamayı önce güvenceye al
  const sortedAll = [...items].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  // Grup hazırla
  const sectionIdSet = new Set(sections.map(s => s.id));
  const grouped: Record<string, MenuItemAdmin[]> = {};
  for (const s of sections) grouped[s.id] = [];

  const orphans: MenuItemAdmin[] = [];
  for (const i of sortedAll) {
    if (i.section_id && sectionIdSet.has(i.section_id)) grouped[i.section_id].push(i);
    else orphans.push(i);
  }

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Grup içi reorder → tüm listeyi yeniden düzle ve index ata
  const reorderWithinGroup = async (groupKey: string | null, activeId: string, overId: string) => {
    // Çalışacağımız liste: grup veya orphans
    const oldList = groupKey ? grouped[groupKey] : orphans;
    const oldIndex = oldList.findIndex(i => i.id === activeId);
    const newIndex = oldList.findIndex(i => i.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const newList = arrayMove(oldList, oldIndex, newIndex);

    // Tüm footer menüyü yeni sırada yeniden düzle:
    const flattened: MenuItemAdmin[] = [];
    for (const s of sections) {
      if (groupKey === s.id) flattened.push(...newList);
      else flattened.push(...grouped[s.id]);
    }
    if (groupKey === null) flattened.push(...newList);
    else flattened.push(...orphans);

    // Yeni global display_order ver
    const payload = flattened.map((i, idx) => ({ id: i.id, display_order: idx }));
    await onReorder(payload);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Footer Menü Öğeleri</CardTitle></CardHeader>
      <CardContent>
        {sortedAll.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Henüz footer menü öğesi eklenmemiş</p>
        ) : (
          <div className="space-y-4">
            {/* Bölümlere göre listeler */}
            {sections.map(section => {
              const list = grouped[section.id] ?? [];
              if (list.length === 0) return null;
              return (
                <div key={section.id} className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">{section.title}</h4>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={async (e: DragEndEvent) => {
                      const { active, over } = e;
                      if (!over || active.id === over.id) return;
                      await reorderWithinGroup(section.id, String(active.id), String(over.id));
                    }}
                  >
                    <SortableContext items={list.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2 pl-4 border-l-2 border-border">
                        {list.map(i => (
                          <Row key={i.id} item={i} onEdit={onEdit} onDelete={onDelete} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              );
            })}

            {/* Bölümsüz/Diğer */}
            {orphans.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Bölümsüz / Diğer</h4>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={async (e: DragEndEvent) => {
                    const { active, over } = e;
                    if (!over || active.id === over.id) return;
                    await reorderWithinGroup(null, String(active.id), String(over.id));
                  }}
                >
                  <SortableContext items={orphans.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {orphans.map(i => (
                        <Row key={i.id} item={i} onEdit={onEdit} onDelete={onDelete} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
