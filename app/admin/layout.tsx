import type { Metadata } from "next";
import "../styles/admin/tokens.css";
import "../styles/admin/glass.css";
import "../styles/admin/layout.css";
import "../styles/admin/components.css";
import "../styles/admin/pages.css";
import "../styles/admin/ios.css";

// Area internal: noindex. Perlindungan sebenarnya ada di server (layout (protected) + endpoint API).
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin Pillarians" },
  robots: { index: false, follow: false, nocache: true },
};

// Tanpa pembungkus kelas: sebelumnya memakai "admin-shell", yang juga didefinisikan di site.css (grid 250px 1fr)
// sehingga CSS website utama ikut mengatur tata letak admin. Gaya admin seluruhnya ada di app/styles/admin/*.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
