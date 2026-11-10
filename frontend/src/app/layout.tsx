import "./globals.css";
import { getDirection } from "@/lib/intl";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = "en";
  return (
    <html lang={locale} dir={getDirection(locale)}>
      <body>{children}</body>
    </html>
  );
}
