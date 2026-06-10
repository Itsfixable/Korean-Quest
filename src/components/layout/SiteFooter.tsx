import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/resources", label: "Learn" },
  { href: "/adventure", label: "Adventure" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/schedule", label: "Schedule" },
  { href: "/about", label: "About" },
];

export function SiteFooter() {
  return (
    <footer className="kq-footer">
      <div className="kq-footer-inner">
        <div className="kq-footer-brand">
          <Image src="/favicon/logo.png" alt="" width={28} height={28} />
          <span>
            Korean <strong>Quest</strong>
          </span>
        </div>
        <nav className="kq-footer-links" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="kq-footer-note">
          © 2026 Korean Quest — student-built for learners.{" "}
          <Link href="/resources">Credits &amp; sources</Link>
        </p>
      </div>
    </footer>
  );
}
