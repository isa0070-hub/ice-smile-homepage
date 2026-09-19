import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskName(value) {
  const name = String(value || "").trim();

  if (!name) {
    return "고객**";
  }

  return `${name.slice(0, 1)}**`;
}

function maskPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length < 4) {
    return "****";
  }

  return `****-${digits.slice(-4)}`;
}

function shortText(value, maxLength = 18) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("online_inquiries")
      .select(
        "customer_name,phone,preferred_branch,device,model,symptom,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("최근 온라인 접수 조회 실패:", error);

      return Response.json(
        {
          ok: false,
          items: [],
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const items = (data || []).map((item) => ({
      name: maskName(item.customer_name),
      phone: maskPhone(item.phone),
      device: shortText(item.device, 18),
      model: shortText(item.model, 22),
      symptom: shortText(item.symptom, 20),
      branch: shortText(item.preferred_branch, 12),
    }));

    return Response.json(
      {
        ok: true,
        items,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("최근 온라인 접수 API 오류:", error);

    return Response.json(
      {
        ok: false,
        items: [],
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
