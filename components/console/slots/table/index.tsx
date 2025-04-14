import { Separator } from "@/components/ui/separator";
import TableBlock from "@/components/blocks/table";
import { Table as TableSlotType } from "@/types/slots/table";
import Toolbar from "@/components/blocks/toolbar";

export default function ({ ...table }: TableSlotType) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{table.title}</h3>
        <p className="text-sm text-muted-foreground">{table.description}</p>
      </div>
      {table.rules && (
        <div className="mb-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center text-sm text-orange-700 mb-1">
            <span className="font-medium mr-1">{table.rules_title}</span>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {table.rules}
          </p>
        </div>
      )}
      {table.tip && (
        <p className="text-sm text-muted-foreground">
          {table.tip.description || table.tip.title}
        </p>
      )}
      {table.toolbar && <Toolbar items={table.toolbar.items} />}
      <Separator />
      <TableBlock {...table} />
    </div>
  );
}
