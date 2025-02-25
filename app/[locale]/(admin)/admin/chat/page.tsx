import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getChatSessionList } from "@/models/chat";
import moment from "moment";
import Link from "next/link";

export default async function () {
  const chatSessions = await getChatSessionList(1, 100);

  const columns: TableColumn[] = [
    {
      name: "uuid",
      title: "UUID",
      callback: (row) => (
        <Link href={`/admin/chat/${row.uuid}`}>{row.uuid}</Link>
      ),
    },
    { name: "title", title: "Title" },
    { name: "status", title: "Status" },
    { name: "customer_info_id", title: "Customer Info ID" },
    {
      name: "created_at",
      title: "Created At",
      callback: (row) => moment(row.created_at).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  const table: TableSlotType = {
    title: "Chat Sessions",
    columns,
    data: chatSessions,
  };

  return <TableSlot {...table} />;
}
