// =============================================================
// FILE: src/pages/account/components/NotificationsTab.tsx
// =============================================================
import { useMemo } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const NotificationsTab: React.FC = () => {
  const {
    items,
    unreadCount,
    isLoading,
    isFetching,
    markRead,
    markAllRead,
    remove,
  } = useNotifications({ fetchList: true });

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
      ),
    [items]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <div className="h-9 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border rounded-lg p-4 flex flex-col gap-2 bg-muted/40 animate-pulse"
            >
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-2/3 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Bildirimlerim</h2>
          <p className="text-sm text-muted-foreground">
            Hesabınızla ilgili sistem bildirimleri burada listelenir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive">
              {unreadCount} okunmamış bildirim
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0 || isFetching}
            onClick={() => void markAllRead()}
          >
            Tümünü okundu işaretle
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {sortedItems.length === 0 && (
        <div className="border rounded-lg p-6 text-center text-muted-foreground">
          <p className="font-medium mb-1">Henüz bir bildiriminiz yok.</p>
          <p className="text-sm">
            Sipariş, cüzdan ve destek hareketleriniz burada görünecek.
          </p>
        </div>
      )}

      {/* List */}
      {sortedItems.length > 0 && (
        <div className="space-y-2">
          {sortedItems.map((n) => {
            const createdAt = n.created_at
              ? new Date(n.created_at)
              : null;

            return (
              <div
                key={n.id}
                className={cn(
                  "border rounded-lg p-4 flex flex-col gap-2 transition-smooth",
                  !n.is_read && "bg-primary/5 border-primary/40"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm md:text-base">
                        {n.title}
                      </h3>
                      {!n.is_read && (
                        <Badge
                          variant="default"
                          className="text-[10px] uppercase tracking-wide"
                        >
                          Yeni
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {n.message}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {createdAt && (
                      <span className="text-[11px] text-muted-foreground">
                        {createdAt.toLocaleString("tr-TR")}
                      </span>
                    )}
                    <div className="flex gap-2">
                      {!n.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void markRead(n.id)}
                        >
                          Oku
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => void remove(n.id)}
                      >
                        Sil
                      </Button>
                    </div>
                  </div>
                </div>

                {n.type && (
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Tür: {n.type}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
