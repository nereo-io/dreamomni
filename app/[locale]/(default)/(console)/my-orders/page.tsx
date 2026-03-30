import { getOrdersByUserUuid } from "@/models/order";
import { findUserByUuid } from "@/models/user";
import { getUserEmail, getUserUuid } from "@/services/user";

import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/console/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getTranslations } from "next-intl/server";
import { LocalTime } from "@/components/ui/local-time";
import { redirect } from "next/navigation";
import { InvoiceDownloadButton } from "./invoice-download-button";

export default async function () {
  const t = await getTranslations();

  const user_uuid = await getUserUuid();
  const user_email = await getUserEmail();

  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/my-orders`;
  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // 获取订单信息
  let orders = await getOrdersByUserUuid(user_uuid);
  const user = await findUserByUuid(user_uuid);

  const columns: TableColumn[] = [
    { name: "order_no", title: t("my_orders.table.order_no") },
    { name: "paid_email", title: t("my_orders.table.email") },
    { name: "product_name", title: t("my_orders.table.product_name") },
    {
      name: "amount",
      title: t("my_orders.table.amount"),
      callback: (item: any) =>
        `${item.currency.toUpperCase() === "CNY" ? "¥" : "$"} ${
          item.amount / 100
        }`,
    },
    {
      name: "paid_at",
      title: t("my_orders.table.paid_at"),
      callback: (item: any) => <LocalTime date={item.paid_at} />,
    },
    {
      name: "invoice",
      title: t("my_orders.table.invoice"),
      callback: (item: any) => {
        const orderNo = `${item.order_no || ""}`;
        if (!orderNo) {
          return "-";
        }

        const defaultTitle =
          user?.nickname || item.paid_email || item.user_email || user_email;
        const defaultEmail = item.paid_email || item.user_email || user_email;

        return (
          <InvoiceDownloadButton
            orderNo={orderNo}
            defaultTitle={defaultTitle || ""}
            defaultEmail={defaultEmail || ""}
          />
        );
      },
    },
  ];

  const table: TableSlotType = {
    title: t("my_orders.title"),
    description: t("my_orders.description"),
    columns: columns,
    data: orders,
    empty_message: t("my_orders.no_orders"),
  };

  return <TableSlot {...table} />;
}
