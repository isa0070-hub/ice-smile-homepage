import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isSameOriginRequest, verifyAdminSessionToken } from "@/lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

function normalizeSlug(value) {
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^a-z0-9가-힣-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100) || "repair-case"
  );
}

function encodeObjectKey(key) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function errorResponse(message, status) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request) {
  const adminAuth = request.cookies.get("admin_auth")?.value;

  if (!(await verifyAdminSessionToken(adminAuth))) {
    return errorResponse("관리자 인증이 필요합니다.", 401);
  }

  if (!isSameOriginRequest(request)) {
    return errorResponse("허용되지 않은 요청입니다.", 403);
  }

  try {
    const body = await request.json();

    const contentType = String(body.contentType || "").toLowerCase();
    const fileSize = Number(body.fileSize);
    const extension = ALLOWED_IMAGE_TYPES[contentType];

    if (!extension) {
      return errorResponse(
        "JPG, PNG, WEBP, AVIF, GIF 이미지만 업로드할 수 있습니다.",
        400,
      );
    }

    if (
      !Number.isFinite(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_FILE_SIZE
    ) {
      return errorResponse(
        "이미지 파일은 한 장당 30MB 이하만 업로드할 수 있습니다.",
        400,
      );
    }

    const endpoint =
      process.env.R2_ENDPOINT?.replace(/\/+$/, "") ||
      (process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : "");

    const bucketName = process.env.R2_BUCKET_NAME;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const publicBaseUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");

    if (
      !endpoint ||
      !bucketName ||
      !accessKeyId ||
      !secretAccessKey ||
      !publicBaseUrl
    ) {
      console.error("R2 환경변수 일부가 설정되지 않았습니다.");

      return errorResponse(
        "이미지 저장소 설정을 확인해주세요.",
        500,
      );
    }

    const slug = normalizeSlug(body.slug);
    const imageRole = body.imageRole === "main" ? "main" : "detail";
    const uniqueId = `${Date.now()}-${randomUUID().slice(0, 8)}`;

    const objectKey =
      `repair-cases/${slug}/` +
      `${slug}-${imageRole}-${uniqueId}.${extension}`;

    const r2 = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
      CacheControl: CACHE_CONTROL,
    });

    const uploadUrl = await getSignedUrl(r2, command, {
      expiresIn: 300,
    });

    const publicUrl =
      `${publicBaseUrl}/${encodeObjectKey(objectKey)}`;

    return NextResponse.json(
      {
        success: true,
        uploadUrl,
        publicUrl,
        objectKey,
        uploadHeaders: {
          "Content-Type": contentType,
          "Cache-Control": CACHE_CONTROL,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("R2 업로드 주소 생성 오류:", error);

    return errorResponse(
      "이미지 업로드 준비 중 오류가 발생했습니다.",
      500,
    );
  }
}
