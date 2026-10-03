import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="nav">
      <div className="nav__inner">
        <Link href="/" className="nav__logo">
          RuangAcara
        </Link>
        <nav className="nav__links" aria-label="Navigasi utama">
          <Link href="/" className="nav__link">
            Jelajahi Event
          </Link>
        </nav>
        <div className="nav__actions">
          <Link href="/signin" className="btn btn--secondary btn--small">
            Masuk
          </Link>
        </div>
      </div>
    </header>
  );
}
