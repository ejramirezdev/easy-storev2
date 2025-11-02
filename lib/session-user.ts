import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function ensureSessionUser(session: Session | null) {
  if (!session?.user?.email) {
    return null;
  }

  const sessionUserId = session.user.id;
  const email = session.user.email;

  if (sessionUserId) {
    const existingById = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true },
    });

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
  });

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
  });

  session.user.id = created.id;
  return created;
}
