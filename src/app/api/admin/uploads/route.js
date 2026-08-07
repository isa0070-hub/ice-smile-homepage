import { randomUUID } from "node:crypto";
import {
  adminErrorResponse,
  adminSuccessResponse,
  requireAdminRequest,
} from "@/lib/adminApi";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 512 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);
const UPLOAD_TARGETS = Object.freeze({
  popup: { bucket: "popup-images", folder: "popups" },
});

export async function POST(request) {
  const authError = requireAdminRequest(request, { requireSameOrigin: true });
  if (authError) return authError;

  if (Number(request.headers.get("content-length") || 0) > MAX_REQUEST_SIZE) {
    return adminErrorResponse("이미지는 10MB 이하만 업로드할 수 있습니다.", 413);
  }

  try {
    const formData = await request.formData();
    const target = UPLOAD_TARGETS[String(formData.get("purpose") || "")];
    const file = formData.get("file");

    if (!target) {
      return adminErrorResponse("업로드 위치가 올바르지 않습니다.", 400);
    }

    if (!(file instanceof File) || file.size <= 0) {
      return adminErrorResponse("업로드할 이미지가 없습니다.", 400);
    }

    const contentType = String(file.type || "").toLowerCase();
    const extension = ALLOWED_IMAGE_TYPES.get(contentType);

    if (!extension) {
      return adminErrorResponse(
        "JPG, PNG, WEBP, AVIF, GIF 이미지만 업로드할 수 있습니다.",
        400,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return adminErrorResponse("이미지는 10MB 이하만 업로드할 수 있습니다.", 413);
    }

    const objectPath = `${target.folder}/${Date.now()}-${randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabaseAdmin.storage
      .from(target.bucket)
      .upload(objectPath, buffer, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      console.error("관리자 이미지 업로드 오류:", error);
      return adminErrorResponse("이미지를 저장하지 못했습니다.", 500);
    }

    const { data } = supabaseAdmin.storage
      .from(target.bucket)
      .getPublicUrl(objectPath);

    return adminSuccessResponse({ publicUrl: data.publicUrl }, 201);
  } catch (error) {
    console.error("관리자 이미지 업로드 처리 오류:", error);
    return adminErrorResponse("이미지 업로드 요청을 처리하지 못했습니다.", 500);
  }
}

