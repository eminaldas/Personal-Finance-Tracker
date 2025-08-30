import { Outlet } from "react-router-dom";
import Sidebar from "../app/Components/Sidebar";

export default function MainLayout() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b0c14] text-white">
      {/* BACKGROUND (en arkada) */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-cyan-500/25 blur-[130px]" />
        <div className="absolute bottom-[-6rem] left-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[110px]" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden>
          <defs>
            <pattern id="gridDash" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridDash)" />
        </svg>
      </div>

         <aside className="fixed inset-y-0 left-0 w-60 border-r border-white/10 bg-white/5 backdrop-blur-xl z-20">

        <Sidebar />
</aside>

        <div className="relative z-10 flex min-h-screen pl-60">
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
