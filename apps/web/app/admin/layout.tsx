import type { Metadata } from "next";
import "../styles/admin.css";

// Area internal: noindex. Perlindungan sebenarnya ada di server (layout (protected) + endpoint API).
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin Pillarians" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell">{children}</div>;
}
