import { History, Home, LogOut, Volleyball, Wallet } from "lucide-react";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { useEffect, useState } from "react";
import { fetchLeagues } from "@/services/EventsService";
import { toastNotifier } from "@/utils/toastNotifier";

const guestMenu = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Volleyball, label: "Games", path: "/games" },
];

const authMenu = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Volleyball, label: "Games", path: "/games" },
  { icon: Wallet, label: "My Wallet", path: "/my-wallet" },
  { icon: History, label: "Betting History", path: "/history" },
  { icon: Home, label: "Profile", path: "/profile" },
];

const adminMenu = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Wallet, label: "Transactions", path: "/transactions" },
];

interface League {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}
const Sidebar = () => {
  const isAuth = useSelector((state: any) => state.auth.isAuthenticated);
  const isAdmin = useSelector(
    (state: any) => state.auth.user?.role === "admin"
  );
  const dispatch = useDispatch();
  const menuItems = isAuth ? (isAdmin ? adminMenu : authMenu) : guestMenu;

  async function handleLogout() {
    dispatch(logout());
  }
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getLeagues = async () => {
      try {
        const response = await fetchLeagues();
        setLeagues(response);
      } catch (error) {
        console.error("Failed to fetch leagues:", error);
        toastNotifier({
          message: "Failed to fetch leagues",
          type: "error",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    getLeagues();
  }, []);

  return (
    <div className="w-64 h-screen fixed left-0 top-0 bg-[#181818] text-gray-400">
      <div className="p-4">
        <div className="my-4 self-center">
          <Link to="/">
            <img
              src="./BetMate-Logo.png"
              className="hidden md:block w-40 "
              alt="Logo"
            />
          </Link>
          <Link to="/">
            <img
              src="./adaptive-icon.png"
              className="block md:hidden w-14"
              alt="Logo"
            />
          </Link>
        </div>

        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link to={item.path} key={item.label}>
              <button
                key={item.label}
                className={clsx(
                  "w-full text-white flex border-0 items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-orange-500/10 hover:text-orange-500"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            </Link>
          ))}
        </div>

        {!isAuth && (
          <div className="mt-8">
            <h3 className="text-xs font-medium text-gray-500 uppercase px-3 mb-3">
              Available Leagues
            </h3>
            <div className="space-y-1">
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  Loading leagues...
                </div>
              ) : leagues.length > 0 ? (
                leagues.map((league) => (
                  <div
                    key={league.title}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-[#2C2C2E]"
                  >
                    <img
                      src={`/leagues/${league.key}.png`}
                      alt={league.key}
                      className="w-6 h-6 rounded-full object-contain"
                    />
                    <div>
                      <div className="text-sm text-gray-300">
                        {league.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {league.group}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-400">
                  No leagues available
                </div>
              )}
            </div>
          </div>
        )}
        {isAuth ? (
          <div className="mt-8">
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-[#2C2C2E]"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        ) : (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-[#2C2C2E] rounded-lg p-4">
              <h4 className="text-white text-sm font-medium mb-2">
                Join BetMate Today
              </h4>
              <p className="text-gray-400 text-sm mb-3">
                Get 100% bonus on your first deposit!
              </p>
              <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors">
                Register Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
