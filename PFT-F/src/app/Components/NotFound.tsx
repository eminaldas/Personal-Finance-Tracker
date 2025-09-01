import { Link, useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b0c14] text-white">
      {/* Background glows + grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-cyan-500/25 blur-[130px]" />
        <div className="absolute bottom-[-6rem] left-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[110px]" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden>
          <defs>
            <pattern id="grid404" width="40" height="40" patternUnits="userSpaceOnUse">
              <path  d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid404)" />
        </svg>
      </div>

      {/* Content */}
      <main className="relative z-10 mx-auto grid min-h-screen max-w-5xl place-items-center px-6 py-12">
        <section className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_20px_70px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/90">
            {/* compass / alert icon */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20Z" stroke="currentColor" strokeWidth="1.4" />
              <path d="M12 7v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1.1" fill="currentColor" />
            </svg>
          </div>

          <h1 className="text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-tr from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">404</span>
          </h1>
          <p className="mt-2 text-lg font-medium">Sayfa bulunamadı</p>
          <p className="mt-1 text-sm text-white/70">Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.</p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-400 to-fuchsia-500 px-5 py-2.5 text-sm font-medium text-black shadow-lg shadow-cyan-900/20 transition hover:brightness-110"
            >
              Ana panele git
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/10"
            >
              Ana sayfa
            </Link>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/10"
            >
              Geri dön
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <HelperCard title="URL'i kontrol et" description="Yazım hatası varsa düzeltip tekrar deneyin." />
            <HelperCard title="Menüyü kullan" description="Sol menüden aradığınız sayfaya ulaşabilirsiniz." />
            <HelperCard title="Destek" description="Sorun devam ediyorsa bize bildirin." href="/support" />
          </div>
        </section>
      </main>
    </div>
  );
}

function HelperCard({ title, description, href }: { title: string; description: string; href?: string }) {
  const Comp = href ? Link : ("div" as any);
  return (
    <Comp to={href} className="rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white/80 backdrop-blur transition hover:bg-white/10">
      <div className="font-medium text-white">{title}</div>
      <div className="mt-0.5 text-white/60">{description}</div>
    </Comp>
  );
}
