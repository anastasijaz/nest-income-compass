import { type ReactNode, type FormEvent } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  centered,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  onSubmit: () => unknown;
  submitLabel?: string | undefined;
  busy?: boolean | undefined;
  extraActions?: ReactNode | undefined;
  centered?: boolean | undefined;
}) {
  const form = (Header: typeof SheetHeader, Title: typeof SheetTitle, Desc: typeof SheetDescription) => (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        void onSubmit();
      }}
      className="flex flex-col"
    >
      <Header className="px-5 pt-6 text-left">
        <Title className="font-display text-xl">{title}</Title>
        {description && <Desc>{description}</Desc>}
      </Header>
      <div className="space-y-4 px-5 py-4">{children}</div>
      <div className="sticky bottom-0 flex gap-2 border-t bg-background px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {extraActions}
        <Button type="submit" size="lg" className="h-12 flex-1 rounded-xl text-base" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );

  if (centered)
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="block max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl p-0">
          {form(DialogHeader, DialogTitle, DialogDescription)}
        </DialogContent>
      </Dialog>
    );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-xl overflow-y-auto rounded-t-3xl p-0">
        {form(SheetHeader, SheetTitle, SheetDescription)}
      </SheetContent>
    </Sheet>
  );
}
