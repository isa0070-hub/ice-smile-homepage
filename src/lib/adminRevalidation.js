import "server-only";

import { revalidatePath } from "next/cache";

export function revalidateAdminResource(resource) {
  switch (resource) {
    case "branches":
      revalidatePath("/");
      revalidatePath("/branches");
      revalidatePath("/branches/[slug]", "page");
      revalidatePath("/repair-cases/[slug]", "page");
      break;
    case "notices":
      revalidatePath("/");
      revalidatePath("/notices");
      revalidatePath("/notices/[id]", "page");
      break;
    case "popups":
      revalidatePath("/");
      break;
    case "repair-cases":
    case "repair-case-images":
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
