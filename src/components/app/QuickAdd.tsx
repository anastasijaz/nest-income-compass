import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, ArrowDownLeft, ArrowUpRight, ScanLine, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransactionSheet, type TxnKind } from "./TransactionSheet";
import { FixSheet } from "./FixSheets";
import { propertiesQuery } from "@/lib/queries";
import { pickImage } from "@/lib/files";

type Mode = { t: "txn"; kind: TxnKind; scanFile?: File } | { t: "fix" } | null;

export function QuickAdd({ propertyId }: { propertyId?: string }) {
  const { data: properties = [] } = useQuery(propertiesQuery);
  const [mode, setMode] = useState<Mode>(null);
  const pick = (m: Mode) => () => {
    if (!properties.length) return void toast("Add a property first");
    setMode(m);
  };
  const scan = () => {
    if (!properties.length) return void toast("Add a property first");
    void pickImage().then((file) => file && setMode({ t: "txn", kind: "cost", scanFile: file }));
  };
  const item = "h-12 gap-3 rounded-lg px-3 text-base";
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Quick add"
            className="fixed bottom-[calc(var(--nav-h)+1rem+env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-fab transition-transform active:scale-95"
          >
            <Plus className="h-7 w-7" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={12}
          className="w-60 rounded-xl p-1.5"
        >
          <DropdownMenuItem className={item} onSelect={pick({ t: "txn", kind: "income" })}>
            <ArrowDownLeft className="h-5 w-5" /> Add income
          </DropdownMenuItem>
          <DropdownMenuItem className={item} onSelect={pick({ t: "txn", kind: "cost" })}>
            <ArrowUpRight className="h-5 w-5" /> Add cost
          </DropdownMenuItem>
          <DropdownMenuItem className={item} onSelect={scan}>
            <ScanLine className="h-5 w-5" /> Scan receipt
          </DropdownMenuItem>
          <DropdownMenuItem className={item} onSelect={pick({ t: "fix" })}>
            <Wrench className="h-5 w-5" /> Add fix
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TransactionSheet
        open={mode?.t === "txn"}
        onOpenChange={(o) => !o && setMode(null)}
        kind={mode?.t === "txn" ? mode.kind : "cost"}
        scanFile={mode?.t === "txn" ? mode.scanFile : undefined}
        propertyId={propertyId}
      />
      <FixSheet
        open={mode?.t === "fix"}
        onOpenChange={(o) => !o && setMode(null)}
        propertyId={propertyId}
      />
    </>
  );
}
