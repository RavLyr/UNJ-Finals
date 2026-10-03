const FEATURES = [
  {
    icon: "users",
    title: "Daftar mudah",
    desc: "Cukup nama dan email, langsung terdaftar dan dapat tiket dalam hitungan detik.",
  },
  {
    icon: "ticket",
    title: "E-ticket dengan QR",
    desc: "Setiap pendaftaran dapat tiket digital dengan QR code unik. Simpan atau unduh sebagai PDF.",
  },
  {
    icon: "phone",
    title: "Check-in QR",
    desc: "Pindai QR code tiket di pintu masuk. Tanpa antre, tanpa kertas.",
  },
];

function FeatureIcon({ name }: { name: string }) {
  if (name === "users") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (name === "ticket") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 17v2" />
        <path d="M13 11v2" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

export function Features() {
  return (
    <section className="features section">
      <div className="container">
        <h2 className="cta__title" style={{ fontSize: "var(--landing-text-4xl)" }}>
          Semua yang Anda butuhkan
        </h2>
        <div className="features__grid">
          {FEATURES.map((feature, index) => (
            <div key={feature.title} className="feature">
              <div className={`feature__icon feature__icon--${index + 1}`}>
                <FeatureIcon name={feature.icon} />
              </div>
              <h3 className="feature__title">{feature.title}</h3>
              <p className="feature__desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
