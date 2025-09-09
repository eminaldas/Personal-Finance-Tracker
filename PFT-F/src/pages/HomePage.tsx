// src/pages/HomeLanding.tsx
import { Link } from "react-router-dom";
import FeatureCard from "../app/Components/FeaturedCard";


export default function HomeLanding() {
  return (
    <div className="min-h-dvh bg-[#0b0e14] text-white">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <Decor />
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Badge>Personal Finance Tracker</Badge>
              <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
                Bütçeni akıllıca yönet,
                <br />
                hedeflerine daha hızlı ulaş.
              </h1>
              <p className="mt-4 max-w-xl text-white/70">
                Gelir-giderlerini topla, kategorilere ayır, aylık bütçeler koy. Biz de
                kategoriler, bütçeler ve işlemlerle sana net bir görünürlük sağlayalım.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110"
                >
                  Ücretsiz Başla
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
                >
                  Giriş Yap
                </Link>
              </div>

              <ul className="mt-6 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <Dot /> İşlemler: gelir & gider ekleme/düzenleme
                </li>
                <li className="flex items-center gap-2">
                  <Dot /> Kategoriler: emoji & renk desteği
                </li>
                <li className="flex items-center gap-2">
                  <Dot /> Bütçeler: aylık limit ve uyarılar
                </li>
                <li className="flex items-center gap-2">
                  <Dot /> Dashboard: anlık özet ve son işlemler
                </li>
              </ul>
            </div>

            {/* Mock preview kartı */}
            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-white/80">Hızlı Önizleme</span>
                  <span className="text-xs text-white/50">Mock</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <PreviewCard title="Bakiye" value="$3,832" />
                  <PreviewCard title="Bu Ay Gelir" value="$4,880" />
                  <PreviewCard title="Bu Ay Gider" value="$1,048" negative />
                  <PreviewBar title="Bütçe (Food)" percent={72} />
                  <PreviewBar title="Bütçe (Transport)" percent={48} />
                  <PreviewBar title="Bütçe (Entertainment)" percent={58} />
                </div>
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                    <span>Son İşlemler</span>
                    <span>Bu ay</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <TxRow title="Groceries" right="-$86" />
                    <TxRow title="Freelance" right="+$680" positive />
                    <TxRow title="Transport" right="-$60" />
                    <TxRow title="Coffee" right="-$8" />
                  </ul>
                </div>
              </div>
              <Glow />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 pb-14">
        <h2 className="text-center text-2xl font-semibold">Neler Yapabilirsin?</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-white/70">
          Uygulamanın çekirdeği: Kategoriler, Bütçeler, İşlemler ve özet Dashboard.
          Hepsi minimalist, hızlı ve net.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon="💸"
            title="İşlemler"
            desc="Gelir-giderleri ekle, filtrele, düzenle. Pozitif tutarlar, tipten işaretlenir."
            to="/transactions"
            cta="İşlemlere Git"
          />
          <FeatureCard
            icon="🏷️"
            title="Kategoriler"
            desc="Emoji ve renklerle kişisel kategoriler oluştur, arşivle, düzenle."
            to="/categories"
            cta="Kategorilere Git"
          />
          <FeatureCard
            icon="📅"
            title="Bütçeler"
            desc="Aylık limitler belirle; kategori bazlı harcamaları kontrol et."
            to="/budgets"
            cta="Bütçelere Git"
          />
          <FeatureCard
            icon="📊"
            title="Dashboard"
            desc="Anlık özet, son işlemler ve bütçe durumunu tek ekranda gör."
            to="/dashboard"
            cta="Dashboard’a Git"
          />
        </div>
      </section>

      {/* CTA BAND */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-tr from-cyan-500/20 to-fuchsia-500/20 p-6 backdrop-blur-xl">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-semibold">Hazır mısın?</h3>
              <p className="mt-1 text-white/70">Hemen ücretsiz hesap oluştur, verilerini içeri aktar ve başla.</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/register"
                className="rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110"
              >
                Ücretsiz Başla
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ----------------- Pieces ----------------- */

function Header() {
  return (
    <div className="sticky top-0 z-50 bg-[#0b0e14]/70 backdrop-blur supports-[backdrop-filter]:bg-[#0b0e14]/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l9 5v10l-9 5-9-5V7l9-5Z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-wide">PFT</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
          <Link className="hover:text-white" to="/dashboard">Dashboard</Link>
          <Link className="hover:text-white" to="/transactions">Transactions</Link>
          <Link className="hover:text-white" to="/categories">Categories</Link>
          <Link className="hover:text-white" to="/budgets">Budgets</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
          >
            Giriş
          </Link>
          <Link
            to="/register"
            className="hidden rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110 sm:block"
          >
            Kayıt Ol
          </Link>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-white/60 sm:flex-row">
        <p>© {new Date().getFullYear()} PFT · Personal Finance Tracker</p>
        <div className="flex items-center gap-4">
          <a className="hover:text-white" href="#" onClick={(e)=>e.preventDefault()}>Gizlilik</a>
          <a className="hover:text-white" href="#" onClick={(e)=>e.preventDefault()}>Kullanım Koşulları</a>
        </div>
      </div>
    </footer>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70 backdrop-blur">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" /> {children}
    </span>
  );
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/40" />;
}

function PreviewCard({ title, value, negative }: { title: string; value: string; negative?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] text-white/60">{title}</div>
      <div className={`mt-1 text-lg font-semibold ${negative ? "text-rose-300" : ""}`}>{value}</div>
    </div>
  );
}

function PreviewBar({ title, percent }: { title: string; percent: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] text-white/60">
        <span>{title}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white/40" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function TxRow({ title, right, positive }: { title: string; right: string; positive?: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-white/80">{title}</span>
      <span className={positive ? "text-emerald-300" : "text-rose-300"}>{right}</span>
    </li>
  );
}

function Decor() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(800px_400px_at_20%_10%,rgba(34,211,238,.18),transparent),radial-gradient(600px_300px_at_90%_10%,rgba(217,70,239,.18),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </>
  );
}

function Glow() {
  return (
    <div className="pointer-events-none absolute -inset-x-6 -bottom-6 -top-6 -z-10 bg-[radial-gradient(50%_30%_at_50%_0%,rgba(255,255,255,.08),transparent)]" />
  );
}
