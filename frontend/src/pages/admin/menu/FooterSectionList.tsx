// =============================================================
// FILE: FooterSectionList.tsx
// FINAL — footer.ts types compatible (strict-safe)
// - local state sorted by display_order
// - DnD reorder sends payload {id, display_order}
// =============================================================
'use client';

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { GripVertical, Pencil, Trash2 } from 'lucide-react';

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

import type { FooterSection } from '@/integrations/types';

type Props = {
  sections: FooterSection[];
  onReorder: (items: Array<{ id: string; display_order: number }>) => Promise<void>;
  onEdit: (section: FooterSection) => void;
  onDelete: (id: string) => void;
  headerRight?: React.ReactNode;
};

function SortableSectionRow({
  section,
  onEdit,
  onDelete,
}: {
  section: FooterSection;
  onEdit: (s: FooterSection) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{section.title}</span>
          {!section.is_active && <Badge variant="secondary">Pasif</Badge>}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(section)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(section.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default function FooterSectionList({
  sections,
  onReorder,
  onEdit,
  onDelete,
  headerRight,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [localSections, setLocalSections] = React.useState<FooterSection[]>([]);

  React.useEffect(() => {
    const sorted = sections.slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    setLocalSections(sorted);
  }, [sections]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const oldIndex = localSections.findIndex((s) => s.id === activeId);
    const newIndex = localSections.findIndex((s) => s.id === overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(localSections, oldIndex, newIndex);
    setLocalSections(reordered);

    // NOTE: 0-based. If BE expects 1-based, use idx + 1.
    const payload = reordered.map((s, idx) => ({ id: s.id, display_order: idx }));
    await onReorder(payload);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Footer Bölümleri</CardTitle>
        {headerRight}
      </CardHeader>

      <CardContent>
        {localSections.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Henüz bölüm eklenmemiş</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localSections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localSections.map((s) => (
                  <SortableSectionRow key={s.id} section={s} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
