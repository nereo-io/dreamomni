import Header from "@/components/dashboard/header";
import TableBlock from "@/components/blocks/table";
import { Table as TableSlotType } from "@/types/slots/table";

export default function ({ ...table }: TableSlotType) {
  return (
    <>
      <Header crumb={table.crumb} />
      <div className="w-full px-4 md:px-8 py-8">
        <h1 className="text-2xl font-medium mb-8">{table.title}</h1>
        <div className="overflow-x-auto">
          <TableBlock columns={table.columns} data={table.data} />
        </div>
      </div>
    </>
  );
}
