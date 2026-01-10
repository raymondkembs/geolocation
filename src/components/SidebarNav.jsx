import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Map,
  BarChart3,
  MessageCircle,
} from "lucide-react";

const NavButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`
      group flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition
      ${active
        ? "bg-indigo-50 text-indigo-700 rounded-l-none border-l-4 border-indigo-600"
        : "text-gray-600 rounded-l-none hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent"}
    `}
  >
    <Icon
      size={18}
      className={active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}
    />
    <span>{label}</span>
  </button>
);

export default function SidebarNav({
  activePanel,
  setActivePanel,
  openReportsPanel,
}) {
  return (
    <nav className="border-t border-gray-200 pt-4">
      <div className="flex flex-col gap-1">
        <NavButton
          label="Dashboard"
          icon={LayoutDashboard}
          active={activePanel === "dashboard"}
          onClick={() => setActivePanel("dashboard")}
        />

        <NavButton
          label="Cleaners"
          icon={Users}
          active={activePanel === "cleaners"}
          onClick={() => setActivePanel("cleaners")}
        />

        <NavButton
          label="Bookings"
          icon={CalendarCheck}
          active={activePanel === "bookings"}
          onClick={() => setActivePanel("bookings")}
        />

        <NavButton
          label="Maps"
          icon={Map}
          active={activePanel === "maps"}
          onClick={() => setActivePanel("maps")}
        />

        <NavButton
          label="Reports"
          icon={BarChart3}
          active={activePanel === "reports"}
          onClick={openReportsPanel}
        />

        <NavButton
          label="Conversations"
          icon={MessageCircle}
          active={activePanel === "conversations"}
          onClick={() => setActivePanel("conversations")}
        />
      </div>
    </nav>
  );
}
