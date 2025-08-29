import { Outlet } from "react-router-dom";

export default function AuthLayout(){
    return(
            <div className="relative min-h-screen w-full overflow-hidden bg-[#0b0c14] text-white">
      {/* Background glow/particles */}
      <div className="pointer-events-none absolute inset-0">
        {/* radial glow */}
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-cyan-500/25 blur-[130px]" />
        <div className="absolute bottom-[-6rem] left-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[110px]" />
        {/* faint grid */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Navbar placeholder (optional) */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l9 5v10l-9 5-9-5V7l9-5Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-wide"></span>
        </div>
        <a className="text-sm text-white/70 hover:text-white" href="#">Back to Home</a>
      </header>
      <>
      <Outlet/>
      </>
      </div>
      
    )
}