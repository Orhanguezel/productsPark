// =============================================================
// FILE: HeaderMenuList.tsx
// FINAL — menu_item.ts compatible (MenuItem normalized)
// - DnD reorder sends [{id, display_order}] (0-based)
// =============================================================
'use client';

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { GripVertical, Pencil, Trash2, FileText, ExternalLink } from 'lucide-react';

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

import type { MenuItem } from '@/integrations/types';
import { availableIcons } from './icons';

type Props = {
  items: MenuItem[];
  onReorder: (items: Array<{ id: string; display_order: number }>) => Promise<void>;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
};

function SortableMenuItemRow({
  item,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  onEdit: (i: MenuItem) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const iconData = item.icon ? availableIcons.find((i) => i.name === item.icon) : undefined;
  const IconComp = iconData?.Icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          {IconComp ? (
            <IconComp className="h-4 w-4 text-primary" />
          ) : item.type === 'page' ? (
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
        <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default function HeaderMenuList({ items, onReorder, onEdit, onDelete }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // safety: only header + sorted
  const headerItems = React.useMemo(() => {
    return items
      .filter((i) => i.location === 'header')
      .slice()
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [items]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const oldIndex = headerItems.findIndex((i) => i.id === activeId);
    const newIndex = headerItems.findIndex((i) => i.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(headerItems, oldIndex, newIndex);
    const payload = reordered.map((i, idx) => ({ id: i.id, display_order: idx }));

    await onReorder(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Header Menü Öğeleri</CardTitle>
      </CardHeader>

      <CardContent>
        {headerItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Henüz header menü öğesi eklenmemiş
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={headerItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {headerItems.map((i) => (
                  <SortableMenuItemRow key={i.id} item={i} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
