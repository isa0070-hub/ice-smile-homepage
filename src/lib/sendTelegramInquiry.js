export async function sendTelegramInquiry(inquiry) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("텔레그램 알림 환경변수가 설정되지 않았습니다.");
    return { ok: false, skipped: true };
  }

  const message = `
🔔 새 온라인 접수

성함: ${inquiry.customer_name || "-"}
연락처: ${inquiry.phone || "-"}
희망지점: ${inquiry.preferred_branch || "-"}
기기: ${inquiry.device || "-"}
모델: ${inquiry.model || "-"}
연락가능시간: ${inquiry.contact_time || "-"}

증상:
${inquiry.symptom || "-"}

메모:
${inquiry.memo || "-"}
`;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });

  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error("텔레그램 알림 발송 실패");
  return { ok: true };
}
