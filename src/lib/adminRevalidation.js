import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateAdminResource(resource) {
  switch (resource) {
    case "branches":
      revalidatePath("/");
      revalidatePath("/branches");
      revalidatePath("/branches/[slug]", "page");
      revalidatePath("/repair-cases/[slug]", "page");
      revalidatePath("/repair-services/[slug]", "page");
      revalidatePath("/sitemap.xml");
      break;
    case "notices":
      revalidatePath("/");
      revalidatePath("/notices");
      revalidatePath("/notices/[id]", "page");
      revalidatePath("/sitemap.xml");
      break;
    case "popups":
      revalidateTag("public-popup-notice", { expire: 0 });
      revalidatePath("/");
      break;
    case "repair-cases":
    case "repair-case-images":
      revalidateTag("public-repair-cases", { expire: 0 });
      revalidatePath("/");
      revalidatePath("/repair-cases");
      revalidatePath("/repair-cases/[slug]", "page");
      revalidatePath("/repair-services/[slug]", "page");
      revalidatePath("/sitemap.xml");
      revalidatePath("/rss.xml");
      break;
    default:
      break;
  }
}
