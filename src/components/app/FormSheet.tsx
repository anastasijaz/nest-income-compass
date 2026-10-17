import { type ReactNode, type FormEvent } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Save",
  busy,
  extraActions,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  busy?: boolean;
  extraActions?: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-xl overflow-y-auto rounded-t-3xl p-0">
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void onSubmit();
          }}
          className="flex flex-col"
        >
          <SheetHeader className="px-5 pt-6 text-left">
            <SheetTitle className="font-display text-xl">{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="space-y-4 px-5 py-4">{children}</div>
          <div className="sticky bottom-0 flex gap-2 border-t bg-background px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {extraActions}
            <Button type="submit" size="lg" className="h-12 flex-1 rounded-xl text-base" disabled={busy}>
              {busy ? "Saving…" : submitLabel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
