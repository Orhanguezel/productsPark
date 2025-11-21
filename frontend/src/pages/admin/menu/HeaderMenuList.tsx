"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GripVertical, Pencil, Trash2, FileText, ExternalLink } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MenuItemAdmin } from "@/integrations/metahub/rtk/types/menu";
import { availableIcons } from "./icons";

type Props = {
  items: MenuItemAdmin[];
  onReorder: (items: { id: string; display_order: number }[]) => Promise<void>;
  onEdit: (item: MenuItemAdmin) => void;
  onDelete: (id: string) => void;
};

function SortableMenuItem({ item, onEdit, onDelete }: {
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
          {IconComp ? <IconComp className="h-4 w-4 text-primary" /> : (item.type === "page" ? <FileText className="h-4 w-4 text-primary" /> : <ExternalLink className="h-4 w-4 text-primary" />)}
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

export default function HeaderMenuList({ items, onReorder, onEdit, onDelete }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(items, oldIndex, newIndex).map((i, idx) => ({ id: i.id, display_order: idx }));
    await onReorder(reordered);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Header Menü Öğeleri</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Henüz header menü öğesi eklenmemiş</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map(i => <SortableMenuItem key={i.id} item={i} onEdit={onEdit} onDelete={onDelete} />)}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
