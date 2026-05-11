import { Search, Wallet } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import BetSlip from "../BettingSlip";
import { selectBetCount, selectBetSlipOpen, toggleBetSlip } from "@/store/slices/bettingSlipSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const isAuth = useSelector((state: any) => state.auth.isAuthenticated);
  const user = useSelector((state: any) => state.auth.user) || {};
  const betCount = useSelector(selectBetCount);
  const isBetSlipOpen = useSelector(selectBetSlipOpen);

  const handleToggleBetSlip = () => {
    dispatch(toggleBetSlip());
  };

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-[#181818] z-10 flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for Games..."
            className="w-full bg-[#2C2C2E] text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {isAuth ? (
        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-4">
            {/* Bet Slip Button (Desktop) */}
            <div className="relative hidden md:block">
              <button
                onClick={handleToggleBetSlip}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-md px-4 py-2 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z" />
                  <path d="M11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Bet Slip
                {betCount > 0 && (
                  <span className="ml-2 bg-white text-orange-600 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                    {betCount}
                  </span>
                )}
              </button>

              {/* Floating Bet Slip */}
              {isBetSlipOpen && (
                <div className="absolute right-0 mt-2 w-80 z-50">
                  <BetSlip />
                </div>
              )}
            </div>
          </div>
          {/* Balance */}
          <div className="flex items-center gap-2 bg-[#2C2C2E] px-4 py-2 rounded-lg">
            <Wallet className="w-4 h-4 text-orange-500" />
            <span className="text-white font-medium">${user.balance}</span>
          </div>

          {/* Notifications */}
          {/* <button className="relative text-gray-400 hover:text-white transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs flex items-center justify-center rounded-full">
              3
            </span>
          </button> */}

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <img
              src={`https://ui-avatars.com/api/?name=${user.name[0]}+${user.name[1]}&background=FF6B00&color=fff`}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex items-center gap-2 cursor-pointer group">
              <div>
                <div className="text-sm font-medium text-white">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-400">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-gray-300 hover:text-white transition-colors"
          >
            <button className="px-4 py-2 text-gray-300 hover:text-white hover:border-orange-500 transition-colors">
              Login
            </button>
          </Link>
          <Link to="/register" className="text-white">
            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors border-0">
              Register
            </button>
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
