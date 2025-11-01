export const ADMIN_EMAILS = ["ejramirezdev@gmail.com"] as const;

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === email.toLowerCase());
}
