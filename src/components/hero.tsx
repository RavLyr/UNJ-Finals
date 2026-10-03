const HERO_WORDS = ["menyenangkan", "semarak", "kosmik", "manis"];

const HERO_CARDS = [
  {
    title: "Festival Musik",
    meta: "Jakarta · 12 Okt",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80",
  },
  {
    title: "Workshop Koding",
    meta: "Bandung · 15 Okt",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&q=80",
  },
  {
    title: "Yoga Pagi",
    meta: "Bali · 18 Okt",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80",
  },
  {
    title: "Pameran Seni",
    meta: "Yogyakarta · 20 Okt",
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400&q=80",
  },
];

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__decoration" aria-hidden="true">
        <div className="hero__shape hero__shape--1" />
        <div className="hero__shape hero__shape--2" />
        <div className="hero__shape hero__shape--3" />
      </div>
      <div className="container">
        <div className="hero__content">
          <h1 className="hero__title">
            Acara{" "}
            <span className="hero__word" aria-label={HERO_WORDS.join(", ")}>
              {HERO_WORDS.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </span>{" "}
            dari sini
          </h1>
          <p className="hero__subtitle">
            Dari klub lari hingga pesta peluncuran dan pertunjukan kembang api,
            kami membuat setiap acara terasa mudah.
          </p>
          <div className="hero__ctas">
            <a href="/signin" className="btn btn--primary btn--large">
              Buat Acara Pertama Anda
            </a>
            <a href="#event" className="btn btn--secondary btn--large">
              Temukan Acara
            </a>
          </div>
        </div>

        <div className="hero__cards" aria-hidden="true">
          {HERO_CARDS.map((card) => (
            <div key={card.title} className="hero__card">
              <div className="hero__card-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.image} alt="" loading="lazy" />
              </div>
              <div className="hero__card-body">
                <div className="hero__card-title">{card.title}</div>
                <div className="hero__card-meta">{card.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
