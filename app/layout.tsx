import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Bots", template: "%s · Bots" }, description: "Private, self-hosted product monitoring for Unraid.", icons: { icon: "/bots-icon.png" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><header className="topbar"><Link href="/" className="brand"><span className="brandMark">B</span><span>Bots</span></Link><nav aria-label="Main navigation"><Link href="/">Dashboard</Link><Link href="/status">Status</Link><Link href="/settings/notifications">Notifications</Link><Link href="/settings">Settings</Link><Link href="/help">Help</Link></nav></header><main className="shell">{children}</main></body></html>;
}
