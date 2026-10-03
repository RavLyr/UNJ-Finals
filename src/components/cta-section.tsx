export function CtaSection() {
  return (
    <section className="cta section">
      <div className="container">
        <h2 className="cta__title">
          Kenangan tak terlupakan Anda selanjutnya sudah menunggu.
        </h2>
        <div className="cta__buttons">
          <a href="#event" className="btn btn--primary btn--large">
            Temukan Acara
          </a>
          <a href="/signin" className="btn btn--secondary btn--large">
            Buat Acara
          </a>
        </div>
      </div>
    </section>
  );
}
