import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Görsel/dosya içeren paste'i engelle (default: true) */
  blockImagePaste?: boolean;
  /** Görsel/dosya sürükle-bırak'ı engelle (default: true) */
  blockDrop?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      blockImagePaste = true,
      blockDrop = true,
      autoComplete = "off",
      autoCapitalize = "off",
      autoCorrect = "off",
      spellCheck = false,
      ...props
    },
    ref
  ) => {
    const onPaste: React.ClipboardEventHandler<HTMLTextAreaElement> = (e) => {
      if (!blockImagePaste) return;

      const dt = e.clipboardData;
      // Dosya veya image/* içeriyorsa engelle
      const hasFiles = dt?.files && dt.files.length > 0;
      const hasImageItem =
        Array.from(dt?.items ?? []).some((it) =>
          (it.type || "").toLowerCase().startsWith("image/")
        );

      if (hasFiles || hasImageItem) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // textarea zaten HTML’i düz metne çevirir; ekstra işlem gereksiz
    };

    const onDrop: React.DragEventHandler<HTMLTextAreaElement> = (e) => {
      if (!blockDrop) return;

      const dt = e.dataTransfer;
      const hasFiles = dt?.files && dt.files.length > 0;
      const hasImageItem =
        Array.from(dt?.items ?? []).some(
          (it) =>
            it.kind === "file" ||
            (it.type || "").toLowerCase().startsWith("image/")
        );

      if (hasFiles || hasImageItem) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };

    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize as any}
        autoCorrect={autoCorrect as any}
        spellCheck={spellCheck}
        onPaste={onPaste}
        onDrop={onDrop}
        // UX: metin odaklı klavyeler için faydalı
        inputMode={props.inputMode ?? "text"}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
