import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getChatSessionList } from "@/models/chat";
import moment from "moment";
import Link from "next/link";
import { findUserByUuid } from "@/models/user";
import { findMembershipByUserUuid } from "@/models/membership";
export default async function () {
  const chatSessions = await getChatSessionList(1, 200);

  // 获取用户信息并加入到 chatSessions
  const chatSessionsWithUsers = await Promise.all(
    chatSessions.map(async (session) => {
      const user = await findUserByUuid(session.user_uuid);
      const membership = await findMembershipByUserUuid(session.user_uuid);
      return {
        ...session,
        user_nickname: user?.nickname || "未知用户",
        user_email: user?.email || "未知邮箱",
        membership_status: membership?.status || "No",
      };
    })
  );

  // 过滤掉特定 email 的数据
  const filteredChatSessions = chatSessionsWithUsers.filter(
    (session) =>
      ![
        "liuweifly@yahoo.com",
        "liuwei@yullion.com",
        "hugeroger@gmail.com",
      ].includes(session.user_email)
  );

  const columns: TableColumn[] = [
    {
      name: "index",
      title: "序号",
      callback: (row) => row.index + 1,
    },
    {
      name: "uuid",
      title: "UUID",
      callback: (row) => (
        <Link
          href={`/admin/chat/${row.uuid}`}
          className="text-blue-500 hover:underline"
        >
          {row.uuid}
        </Link>
      ),
    },
    { name: "user_nickname", title: "User Nickname" },
    { name: "user_email", title: "User Email" },
    { name: "membership_status", title: "Membership Status" },
    { name: "title", title: "Title" },
    { name: "status", title: "Status" },
    { name: "model", title: "Model" },
    {
      name: "created_at",
      title: "Created At",
      callback: (row) => moment(row.created_at).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  const table: TableSlotType = {
    title: "Chat Sessions",
    columns,
    data: filteredChatSessions.map((session, index) => ({ ...session, index })),
  };

  return <TableSlot {...table} />;
}
