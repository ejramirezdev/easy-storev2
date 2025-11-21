// Layout especial para la página de verificación 2FA
// No requiere verificación 2FA para evitar loop infinito
export default function VerifyTwoFactorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

