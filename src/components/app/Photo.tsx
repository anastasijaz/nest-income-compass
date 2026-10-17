import { type ReactNode } from "react";
import { useSignedUrl } from "@/lib/files";
import { cn } from "@/lib/utils";

export function Photo({
  path,
  alt,
  className,
  fallback,
}: {
  path?: string | null;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const { data } = useSignedUrl(path);
  if (!path || !data)
    return <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>{fallback}</div>;
  return <img src={data} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
