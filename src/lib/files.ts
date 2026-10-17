import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function compressImage(file: File, max = 1600): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("compress failed"))), "image/jpeg", 0.85),
    );
  } catch {
    return file;
  }
}

export function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(b);
  });
}

export async function uploadImage(blob: Blob, folder: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${data.user.id}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("files")
    .upload(path, blob, { contentType: blob.type || "image/jpeg" });
  if (error) throw error;
  return path;
}

export function useSignedUrl(path?: string | null) {
  return useQuery({
    queryKey: ["signed", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("files").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
