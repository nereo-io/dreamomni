import { auth } from "@/auth";
import { respData, respErr } from "@/lib/resp";
import { getCustomerInfoByUserUuid } from "@/models/customer";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getCustomerInfoByUserUuid(session.user.uuid);

    return respData(result.data);
  } catch (e) {
    console.error("get customer info failed:", e);
    return respErr("get customer info failed");
  }
}
