export async function POST(request) {
  const body = await request.json()

  const adminId = process.env.ADMIN_ID
  const adminPassword = process.env.ADMIN_PASSWORD

  if (body.id === adminId && body.password === adminPassword) {
    return Response.json({ ok: true })
  }

  return Response.json(
    { ok: false, message: "아이디 또는 비밀번호가 맞지 않습니다." },
    { status: 401 }
  )
}
