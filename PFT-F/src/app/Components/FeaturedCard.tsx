// --- FeatureCard ---
import { Link } from "react-router-dom";

export default function FeatureCard({
  icon,
  title,
  desc,
  to,
  cta,
}: {
  icon: string;
  title: string;
  desc: string;
  to: string;
  cta: string;
}) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div>
        <div className="mb-2 text-2xl">{icon}</div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-white/70">{desc}</p>
      </div>
      <div className="mt-4">
        <Link
          to={to}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 transition hover:bg-white/10"
        >
          {cta}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
