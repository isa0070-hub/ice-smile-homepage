export async function POST(request) {
  const body = await request.json()

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return Response.json({ ok: false, message: "텔레그램 환경변수가 없습니다." }, { status: 500 })
  }

  const message = `
🔔 새 온라인 접수

성함: ${body.customer_name || "-"}
연락처: ${body.phone || "-"}
희망지점: ${body.preferred_branch || "-"}
기기: ${body.device || "-"}
모델: ${body.model || "-"}
연락가능시간: ${body.contact_time || "-"}

증상:
${body.symptom || "-"}

메모:
${body.memo || "-"}
`

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  })

  const data = await res.json()

  if (!data.ok) {
    return Response.json({ ok: false, message: "텔레그램 발송 실패", data }, { status: 500 })
  }

  return Response.json({ ok: true })
}
