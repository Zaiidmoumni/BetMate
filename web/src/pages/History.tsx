import { useState, useEffect } from "react"
import { History } from "lucide-react"
import { fetchBetHistory } from "@/services/BettingService"

// Define TypeScript interfaces based on your data structure
interface Match {
  matchId: string;
  betOutcome: string;
  odds: number;
  status: string;
  _id: string;
}

interface Bet {
  _id: string;
  userId: string;
  matches: Match[];
  totalOdds: number;
  stake: number;
  potentialPayout: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export default function HistoryPage() {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getHistory()
  }, [])

  const getHistory = async () => {
    try {
      setLoading(true)
      const data = await fetchBetHistory()
      
      if ("error" in data) {
        throw new Error(data.error as string)
      }
      
      setBets(data as Bet[])
      setLoading(false)
    } catch (err: any) {
      setError(err?.message || "Failed to fetch bet history")
      setLoading(false)
    }
  }

  // Normalize status to lowercase for consistent display
  const getNormalizedStatus = (status: string): string => {
    return status.toLowerCase()
  }

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex-1 pl-[18rem] pt-16 p-6 bg-[#121212] text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
          <History className="mr-2" /> Betting History
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff7b26]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-700 p-4 rounded-md text-center">
          <p>Error: {error}</p>
          <button 
            onClick={getHistory}
            className="mt-2 px-4 py-2 bg-[#ff7b26] rounded-md hover:bg-[#e66c17]"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bets.length > 0 ? (
            bets.map((bet) => (
              <div key={bet._id} className="bg-[#1e1e1e] rounded-lg p-4 shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-gray-400 text-sm">Bet ID: {bet._id.substring(0, 8)}...</span>
                    <div className="flex items-center mt-1">
                      <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                        getNormalizedStatus(bet.status) === "won" ? "bg-green-900/30 text-green-400" :
                        getNormalizedStatus(bet.status) === "lost" ? "bg-red-900/30 text-red-400" :
                        "bg-yellow-900/30 text-yellow-400"
                      }`}>
                        {bet.status}
                      </span>
                      <span className="text-gray-400 text-sm ml-2">
                        {formatDate(bet.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Stake: ${bet.stake.toFixed(2)}</div>
                    <div className="font-semibold text-lg">
                      {getNormalizedStatus(bet.status) === "won" 
                        ? <span className="text-green-400">+${bet.potentialPayout.toFixed(2)}</span> 
                        : getNormalizedStatus(bet.status) === "lost" 
                          ? <span className="text-red-400">-${bet.stake.toFixed(2)}</span>
                          : <span className="text-yellow-400">Potential: ${bet.potentialPayout.toFixed(2)}</span>
                      }
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-700 my-3 pt-3">
                  <div className="grid grid-cols-1 gap-3">
                    {bet.matches.map((match, index) => (
                      <div key={index} className="flex items-center justify-between bg-[#2a2a2a] p-3 rounded-md">
                        <div>
                          <div className="text-sm text-gray-300">
                            Match ID: {match.matchId.substring(0, 8)}...
                          </div>
                          <div className="mt-1 font-medium">
                            Outcome: {match.betOutcome}
                          </div>
                          <div className={`text-sm font-medium mt-1 ${
                            getNormalizedStatus(match.status) === "won" ? "text-green-400" :
                            getNormalizedStatus(match.status) === "lost" ? "text-red-400" :
                            "text-yellow-400"
                          }`}>
                            {match.status}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{match.odds.toFixed(2)}</div>
                          <div className="text-sm text-gray-400">Odds</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-700 mt-3 pt-3 flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-400">Total Odds</div>
                    <div className="font-semibold">{bet.totalOdds.toFixed(2)}</div>
                  </div>
                  {bet.matches.length > 1 && (
                    <span className="bg-[#ff7b26] text-white text-xs px-2 py-1 rounded-md">
                      Parlay
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-[#1e1e1e] rounded-lg p-6 text-center">
              <p className="text-gray-400">No betting history found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}