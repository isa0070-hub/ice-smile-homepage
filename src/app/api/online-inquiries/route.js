const allowedBranches = new Set(["강변점", "선릉점", "신도림점"]);
const MAX_BODY_SIZE = 16 * 1024;

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request) {
  const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
  const { isSameOriginRequest } = await import("@/lib/adminSession");
  const { sendTelegramInquiry } = await import("@/lib/sendTelegramInquiry");

  if (!isSameOriginRequest(request)) {
    return Response.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_SIZE) {
    return Response.json({ message: "요청 데이터가 너무 큽니다." }, { status: 413 });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  if (clean(body.website, 200)) {
    return Response.json({ ok: true });
  }

  if (body.privacy_consent !== true) {
    return Response.json(
      { message: "개인정보 수집·이용에 동의해 주세요." },
      { status: 400 },
    );
  }

  const inquiry = {
    customer_name: clean(body.customer_name, 40),
    phone: clean(body.phone, 30),
    preferred_branch: allowedBranches.has(body.preferred_branch)
      ? body.preferred_branch
      : "강변점",
    device: clean(body.device, 80),
    model: clean(body.model, 100),
    contact_time: clean(body.contact_time, 80),
    symptom: clean(body.symptom, 2000),
    memo: clean(body.memo, 1000),
    status: "접수대기",
  };

  if (!inquiry.customer_name || !inquiry.phone || !inquiry.symptom) {
    return Response.json(
      { message: "성함, 연락처, 고장 증상을 모두 입력해 주세요." },
      { status: 400 },
    );
  }

  if (!/^[0-9+()\-\s]{8,30}$/.test(inquiry.phone)) {
    return Response.json(
      { message: "연락처 형식을 확인해 주세요." },
      { status: 400 },
    );
  }

  const duplicateSince = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: recentDuplicates, error: duplicateError } = await supabaseAdmin
    .from("online_inquiries")
    .select("id")
    .eq("phone", inquiry.phone)
    .gte("created_at", duplicateSince)
    .limit(1);

  if (duplicateError) {
    console.error("online inquiry duplicate check error", duplicateError);
  } else if (recentDuplicates?.length) {
    return Response.json(
      { message: "이미 접수된 내용이 있습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  }

  const { error } = await supabaseAdmin
    .from("online_inquiries")
    .insert([inquiry]);

  if (error) {
    console.error("online inquiry insert error", error);
    return Response.json(
      { message: "접수 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }

  try {
    await sendTelegramInquiry(inquiry);
  } catch (notificationError) {
    console.error("online inquiry notification error", notificationError);
  }

  return Response.json({ ok: true });
}
