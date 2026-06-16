import { NextResponse } from "next/server";

export async function POST(request) {
  const { adminId, adminPassword } = await request.json();

  if (
    adminId === process.env.ADMIN_ID &&
    adminPassword === process.env.ADMIN_PASSWORD
  ) {
    const response = NextResponse.json({ success: true });

    response.cookies.set("admin_auth", process.env.ADMIN_PASSWORD, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  }

  return NextResponse.json(
    { success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
    { status: 401 }
  );
}