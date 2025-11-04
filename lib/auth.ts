import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {}, // si luego quieres custom login page
  callbacks: {
    async signIn({ user, account, profile }) {
      // Vincular cuenta Google a usuario existente si el email coincide
      // Esto se ejecuta ANTES de que el adapter intente vincular, evitando OAuthAccountNotLinked
      if (account?.provider === "google" && user?.email && account.providerAccountId) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          
          if (existingUser) {
            // Verificar si ya tiene cuenta Google vinculada
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: existingUser.id,
                provider: "google",
              },
            });
            
            // Si no tiene cuenta Google vinculada, la vinculamos ANTES de que el adapter falle
            if (!existingAccount) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token ?? null,
                  refresh_token: account.refresh_token ?? null,
                  expires_at: account.expires_at ?? null,
                  token_type: account.token_type ?? null,
                  scope: account.scope ?? null,
                  id_token: account.id_token ?? null,
                  session_state: account.session_state ?? null,
                },
              });
              // Actualizar el user.id para que el adapter use el usuario existente
              user.id = existingUser.id;
            }
          }
        } catch (error) {
          console.error("Error vinculando cuenta Google:", error);
          // Si hay error, permitir que continúe el flujo normal
        }
      }
      // Siempre permitir el signIn (el adapter ahora encontrará la cuenta vinculada)
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as any).role ?? "CUSTOMER";
      }
      return token;
    },
    async session({ session, token, user }) {
      if (!session.user) {
        return session;
      }

      let userId = token?.id as string | undefined;
      let userRole = token?.role as ("CUSTOMER" | "ADMIN") | undefined;

      if (!token) {
        if (user) {
          const userRoleFromUser = (user as any).role as
            | "CUSTOMER"
            | "ADMIN"
            | undefined;

          userId = userId ?? (user.id as string | undefined);
          userRole = userRole ?? userRoleFromUser;
        }

        if ((!userId || !userRole) && session.user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true },
          });

          if (dbUser) {
            userId = userId ?? dbUser.id;
            userRole = userRole ?? dbUser.role;
          }
        }
      }

      if (userId) {
        session.user.id = userId;
      }
      if (userRole) {
        session.user.role = userRole;
      }

      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

