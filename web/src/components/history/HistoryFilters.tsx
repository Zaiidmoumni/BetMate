import { CalendarDays } from "lucide-react"

export default function BetHistoryFilters() {
  return (
    <div className="bg-[#1e1e1e] rounded-lg p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">Filter Bets</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Date Range</label>
          <div className="relative flex items-center">
            <CalendarDays className="absolute left-3 w-4 h-4 text-gray-400" />
            <select className="w-full px-4 py-2 pl-10 pr-8 text-sm font-medium rounded-md appearance-none bg-[#2a2a2a] focus:ring-1 focus:ring-[#ff7b26] focus:outline-none">
              <option value="all-time">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* League */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">League</label>
          <div className="relative">
            <select className="w-full px-4 py-2 pr-8 text-sm font-medium rounded-md appearance-none bg-[#2a2a2a] focus:ring-1 focus:ring-[#ff7b26] focus:outline-none">
              <option value="all">All Leagues</option>
              <option value="premier-league">Premier League</option>
              <option value="la-liga">La Liga</option>
              <option value="champions-league">Champions League</option>
              <option value="serie-a">Serie A</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bet Type */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Bet Type</label>
          <div className="relative">
            <select className="w-full px-4 py-2 pr-8 text-sm font-medium rounded-md appearance-none bg-[#2a2a2a] focus:ring-1 focus:ring-[#ff7b26] focus:outline-none">
              <option value="all">All Types</option>
              <option value="home-win">Home Win</option>
              <option value="away-win">Away Win</option>
              <option value="draw">Draw</option>
              <option value="over-under">Over/Under</option>
              <option value="both-teams-to-score">Both Teams to Score</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4 space-x-2">
        <button className="px-4 py-2 text-sm font-medium rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a]">Reset</button>
        <button className="px-4 py-2 text-sm font-medium rounded-md bg-[#ff7b26] hover:bg-[#e66c1e]">
          Apply Filters
        </button>
      </div>
    </div>
  )
}

