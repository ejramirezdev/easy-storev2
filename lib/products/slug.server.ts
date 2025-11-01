import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function resolveProductSlug(
  name: string,
  providedSlug?: string | null,
  excludeId?: string
): Promise<string> {
  const baseInput = (providedSlug ?? "").trim() || name;
  const baseSlug = slugify(baseInput);

  if (!baseSlug) {
    throw new Error("No se pudo generar el slug del producto");
  }

  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        slug: candidate,
        ...(excludeId
          ? {
              NOT: {
                id: excludeId,
              },
            }
          : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}
