import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).optional().or(z.literal("")),
  lastName: z.string().trim().min(1).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  documentType: z.string().trim().optional().or(z.literal("")),
  documentId: z.string().trim().optional().or(z.literal("")),
  shippingLine1: z.string().trim().optional().or(z.literal("")),
  shippingLine2: z.string().trim().optional().or(z.literal("")),
  shippingCity: z.string().trim().optional().or(z.literal("")),
  shippingState: z.string().trim().optional().or(z.literal("")),
  shippingPostalCode: z.string().trim().optional().or(z.literal("")),
  shippingCountry: z.string().trim().optional().or(z.literal("")),
  billingFirstName: z.string().trim().optional().or(z.literal("")),
  billingLastName: z.string().trim().optional().or(z.literal("")),
  billingEmail: z.string().email().optional().or(z.literal("")),
  billingPhone: z.string().trim().optional().or(z.literal("")),
  billingDocumentType: z.string().trim().optional().or(z.literal("")),
  billingDocumentId: z.string().trim().optional().or(z.literal("")),
  billingLine1: z.string().trim().optional().or(z.literal("")),
  billingLine2: z.string().trim().optional().or(z.literal("")),
  billingCity: z.string().trim().optional().or(z.literal("")),
  billingState: z.string().trim().optional().or(z.literal("")),
  billingPostalCode: z.string().trim().optional().or(z.literal("")),
  billingCountry: z.string().trim().optional().or(z.literal("")),
});

type ProfileInput = z.infer<typeof profileSchema>;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const dbProfile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
  });

  const profile: ProfileInput = {
    firstName: dbProfile?.firstName ?? "",
    lastName: dbProfile?.lastName ?? "",
    email: dbProfile?.email ?? session.user.email ?? "",
    phone: dbProfile?.phone ?? "",
    documentType: dbProfile?.documentType ?? "",
    documentId: dbProfile?.documentId ?? "",
    shippingLine1: dbProfile?.shippingLine1 ?? "",
    shippingLine2: dbProfile?.shippingLine2 ?? "",
    shippingCity: dbProfile?.shippingCity ?? "",
    shippingState: dbProfile?.shippingState ?? "",
    shippingPostalCode: dbProfile?.shippingPostalCode ?? "",
    shippingCountry: dbProfile?.shippingCountry ?? "EC",
    billingFirstName: dbProfile?.billingFirstName ?? "",
    billingLastName: dbProfile?.billingLastName ?? "",
    billingEmail: dbProfile?.billingEmail ?? session.user.email ?? "",
    billingPhone: dbProfile?.billingPhone ?? "",
    billingDocumentType: dbProfile?.billingDocumentType ?? "",
    billingDocumentId: dbProfile?.billingDocumentId ?? "",
    billingLine1: dbProfile?.billingLine1 ?? "",
    billingLine2: dbProfile?.billingLine2 ?? "",
    billingCity: dbProfile?.billingCity ?? "",
    billingState: dbProfile?.billingState ?? "",
    billingPostalCode: dbProfile?.billingPostalCode ?? "",
    billingCountry: dbProfile?.billingCountry ?? "EC",
  };

  return NextResponse.json({ ok: true, profile });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const result = profileSchema.safeParse(json);
  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: "Datos inválidos", issues: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = Object.fromEntries(
    Object.entries(result.data).map(([key, value]) => [key, value === "" ? null : value])
  );

  const profile = await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      ...data,
    },
  });

  return NextResponse.json({ ok: true, profile });
}
