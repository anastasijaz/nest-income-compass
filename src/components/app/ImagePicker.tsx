import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Photo } from "./Photo";
import { compressImage, uploadImage } from "@/lib/files";
import { toast } from "sonner";

/** Picks an image (camera or library), uploads it, returns storage path. */
export function ImagePicker({
  value,
  onChange,
  folder,
  label = "Add photo",
}: {
  value: string | null;
  onChange: (path: string | null) => void;
  folder: string;
  label?: string | undefined;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-input bg-card text-muted-foreground"
      >
        {value ? (
          <Photo path={value} alt="" className="h-full w-full" />
        ) : (
          <Camera className="h-6 w-6" />
        )}
        {busy && <span className="absolute inset-0 animate-pulse bg-background/70" />}
      </button>
      <div className="flex flex-col gap-1 text-sm">
        <button
          type="button"
          className="text-left font-medium"
          onClick={() => ref.current?.click()}
        >
          {value ? "Change photo" : label}
        </button>
        {value && (
          <button
            type="button"
            className="flex items-center gap-1 text-left text-muted-foreground"
            onClick={() => onChange(null)}
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          try {
            onChange(await uploadImage(await compressImage(f), folder));
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
