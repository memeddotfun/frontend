import { Link, NavLink } from "react-router";
import {
  Compass,
  Coins,
  Swords,
  Gift,
  LayoutDashboard,
  Settings,
  FileText,
  House,
  TrophyIcon,
  User,
  Rocket,
  ArrowRight,
  SwordIcon,
  Shield,
  UserCog,
} from "lucide-react";
import logo from "@/assets/images/logo.png";
import { useAuthStore } from "@/store/auth";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: "Explore",
    path: "/explore",
    icon: <House className="w-5 h-5" />,
  },
  // {
  //   name: "Staking",
  //   path: "/app/staking",
  //   icon: <Coins className="w-5 h-5" />,
  // },
  {
    name: "Battles",
    path: "/battles",
    icon: <Swords className="w-5 h-5" />,
  },
  {
    name: "Rewards",
    path: "/rewards",
    icon: <TrophyIcon className="w-5 h-5" />,
  },
  {
    name: "Creator",
    path: "/creator",
    icon: <Coins className="w-5 h-5" />,
  },
  {
    name: "Insights",
    path: "/insights",
    icon: <User className="w-5 h-5" />,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  // Get user data to check admin role
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:relative
        w-64  lg:w-[18%] bg-black border-r border-neutral-800 h-full
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        z-50
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <nav className="py-6 flex-1 flex flex-col ">
          <div className="px-4 mb-8 h-[70%] ">
            <div className="flex flex-col items-center gap-4 mb-10 ">
              <Link to="/" className="flex items-center gap-3 w-full mb-3">
                <img
                  src={logo}
                  alt={"Memed.fun"}
                  className="w-[35px] h-35px] object-cover"
                />
                <span className="text-white text-xl font-semibold">Memed</span>
              </Link>
              <Link
                to="/launch"
                className="bg-green-500 w-full cursor-pointer text-sm text-nowrap justify-between text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600 transition-all duration-300 shadow-[0_0_40px_rgba(34,197,94,0.8)] hover:shadow-[0_0_60px_rgba(34,197,94,1)]"
              >
                <Rocket />
                Launch Token
                <div className="bg-black rounded-md flex items-center justify-center text-green-500 p-1">
                  <ArrowRight />
                </div>
              </Link>
            </div>
            <h2 className="text-gray-500 text-xs font-medium  tracking-wider mb-4">
              Navigation
            </h2>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 hover:bg-gradient-to-t from-primary-900 to-black hover:border-t hover:border-b border-primary-900  hover:shadow-[inset_0_0_20px_rgba(34,197,94,0.2),inset_0_0_40px_rgba(0,0,0,0.3)] px-3 py-2.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-t from-primary-900 to-black border-t border-b border-primary-900 text-white shadow-[inset_0_0_20px_rgba(34,197,94,0.2),inset_0_0_40px_rgba(0,0,0,0.3)]"
                          : "text-white hover:text-white"
                      }`
                    }
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Admin Section - Only visible to admin users */}
            {isAdmin && (
              <>
                <h2 className="text-gray-500 text-xs font-medium tracking-wider mb-4 mt-8">
                  Admin
                </h2>
                <ul className="space-y-2">
                  <li>
                    <NavLink
                      to="/admin/create-unclaimed-token"
                      className={({ isActive }) =>
                        `flex items-center gap-3 hover:bg-gradient-to-t from-primary-900 to-black hover:border-t hover:border-b border-primary-900  hover:shadow-[inset_0_0_20px_rgba(34,197,94,0.2),inset_0_0_40px_rgba(0,0,0,0.3)] px-3 py-2.5 rounded-lg transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-t from-primary-900 to-black border-t border-b border-primary-900 text-white shadow-[inset_0_0_20px_rgba(34,197,94,0.2),inset_0_0_40px_rgba(0,0,0,0.3)]"
                            : "text-white hover:text-white"
                        }`
                      }
                    >
                      <UserCog className="w-5 h-5" />
                      <span className="font-medium">Create Unclaimed</span>
                    </NavLink>
                  </li>
                </ul>
              </>
            )}
          </div>

           <div className="px-4 mt-8 pt-8 border-t border-neutral-800">
             <NavLink
               to="/privacy"
               className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gradient-to-t from-primary-900 to-black hover:border-t hover:border-b border-primary-900  hover:shadow-[inset_0_0_20px_rgba(34,197,94,0.2),inset_0_0_40px_rgba(0,0,0,0.3)]  duration-300  rounded-lg transition-colors mb-2"
             >
               <Shield className="w-5 h-5" />
               <span className="font-medium">Privacy</span>
             </NavLink>
             <NavLink
               to="/terms"
               className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gradient-to-t from-primary-900 to-black hover:border-t hover:border-b border-primary-900  hover:shadow-[inset_0_0_20px_rgba(34,197,94,0.2),inset_0_0_40px_rgba(0,0,0,0.3)]  duration-300  rounded-lg transition-colors"
             >
               <FileText className="w-5 h-5" />
               <span className="font-medium">Terms</span>
             </NavLink>
           </div>
        </nav>

        <div className="p-4">
          <div className="text-gray-500 text-xs">© 2025 Memed</div>
        </div>
      </aside>
    </>
  );
}
