import { NavLink } from "react-router-dom";
import { Home, List, Wallet, BarChart2, Settings, LogOut } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-60 h-screen sticky top-0 flex flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl ">
      {/* Logo */}
      <div className="p-6 text-lg font-semibold">💰 PFT</div>

      {/* Menu */}
      <nav className="flex-1 px-3 space-y-1">
        <NavItem to="/dashboard" icon={<Home size={18} />} label="Overview" />
        <NavItem to="/transactions" icon={<List size={18} />} label="Transactions" />
        <NavItem to="/budgets" icon={<Wallet size={18} />} label="Budgets" />
        <NavItem to="/reports" icon={<BarChart2 size={18} />} label="Reports" />
        <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" />
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <button className="flex items-center gap-2 text-sm text-white/70 hover:text-cyan-300">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-white/10 text-cyan-300"
            : "text-white/70 hover:text-white hover:bg-white/5"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
