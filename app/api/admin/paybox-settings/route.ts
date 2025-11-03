import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!session || !isAdminEmail(email || undefined)) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });

  const settings = await prisma.payboxSettings.findFirst();
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  const booleanFields = [
    "onlyCredit",
    "onlyDebit",
    "blockDeferred",
    "extraFields",
    "recurrentEnabled",
    "amountVariable",
  ] as const;
  for (const key of booleanFields) {
    if (key in body) data[key] = !!body[key];
  }

  const stringFields = [
    "planId",
    "frequency",
    "language",
    "environment",
    "merchantEmail",
    "merchantName",
    "responseUrl",
    "confirmationUrl",
  ] as const;
  for (const key of stringFields) {
    if (key in body) data[key] = body[key] ?? null;
  }

  const existing = await prisma.payboxSettings.findFirst();
  const saved = existing
    ? await prisma.payboxSettings.update({ where: { id: existing.id }, data })
    : await prisma.payboxSettings.create({ data });

  return NextResponse.json({ ok: true, settings: saved });
}


