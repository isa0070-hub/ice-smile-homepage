import { isSameOriginRequest, verifyAdminSessionToken } from "@/lib/adminSession";
import { sendTelegramInquiry } from "@/lib/sendTelegramInquiry";

export async function POST(request) {
  const token = request.cookies.get("admin_auth")?.value;
  if (!(await verifyAdminSessionToken(token)) || !isSameOriginRequest(request)) {
    return Response.json({ ok: false, message: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  try {
    await sendTelegramInquiry(await request.json());
    return Response.json({ ok: true });
  } catch (error) {
    console.error("telegram notification error", error);
    return Response.json({ ok: false, message: "텔레그램 발송 실패" }, { status: 500 });
  }
}
