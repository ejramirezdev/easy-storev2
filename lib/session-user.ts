import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function ensureSessionUser(session: Session | null) {
  if (!session?.user?.email) {
    return null;
  }

  // Si Prisma no está disponible, retornar null
  if (!prisma) {
    return null;
  }

  const sessionUserId = session.user.id;
  const email = session.user.email;

  try {
    if (sessionUserId) {
      const existingById = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { id: true },
      }).catch(() => null);

      if (existingById) {
        if (!session.user.id) {
          session.user.id = existingById.id;
        }
        return existingById;
      }
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    }).catch(() => null);

    if (existingByEmail) {
      if (!session.user.id || session.user.id !== existingByEmail.id) {
        session.user.id = existingByEmail.id;
      }
      return existingByEmail;
    }

    const created = await prisma.user.create({
      data: {
        email,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        ...(sessionUserId ? { id: sessionUserId } : {}),
      },
      select: { id: true },
    }).catch(() => null);

    if (created) {
      session.user.id = created.id;
      return created;
    }

    return null;
  } catch (error: any) {
    // Si hay error de conexión, retornar null
    console.warn("Error in ensureSessionUser:", error?.message || error);
    return null;
  }
}
