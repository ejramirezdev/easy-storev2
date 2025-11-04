import type { Metadata } from "next";
import Header from "@/components/Header";
import Providers from "./providers";
import { UiLockProvider } from "@/lib/ui-lock";
import UiLockOverlay from "@/components/common/UiLockOverlay";

export const metadata: Metadata = {
  title: "Easy Store",
  description: "Tecnología sin complicaciones.",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="body-bg" suppressHydrationWarning>
        <UiLockProvider>
          <UiLockOverlay />
          <Providers>
            <Header />
            {children}
            {modal}
          </Providers>
        </UiLockProvider>
      </body>
    </html>
  );
}
