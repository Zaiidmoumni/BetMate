import { CheckCircle, XCircle, Clock } from "lucide-react"

interface MatchInfo {
  league: string
  leagueIcon: string
  homeTeam: string
  homeTeamIcon: string
  homeScore: number | null
  awayTeam: string
  awayTeamIcon: string
  awayScore: number | null
  date: string
}

interface BetInfo {
  id: string
  type: string
  amount: number
  odds: number
  status: "won" | "lost" | "pending"
  payout: number | null
  placedAt: string
}

interface BetCardProps {
  match: MatchInfo
  bet: BetInfo
}

export default function BetCard({ match, bet }: BetCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "lost":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "won":
        return "text-green-500"
      case "lost":
        return "text-red-500"
      case "pending":
        return "text-yellow-500"
      default:
        return ""
    }
  }

  return (
    <div className="p-4 rounded-lg bg-[#1e1e1e] border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <img
            src={match.leagueIcon || "/leagues/placeholder.jpg"}
            alt={match.league}
            width={24}
            height={24}
            className="mr-2"
          />
          <span className="text-sm font-medium">{match.league}</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-400 mr-2">{formatDate(match.date)}</span>
          <div className="flex items-center px-2 py-1 rounded bg-[#2a2a2a]">
            {getStatusIcon(bet.status)}
            <span className={`ml-1 text-xs font-medium ${getStatusClass(bet.status)}`}>
              {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center flex-1">
          <img
            src={match.homeTeamIcon || "/placeholder.svg"}
            alt={match.homeTeam}
            width={32}
            height={32}
            className="mr-3"
          />
          <span className="font-medium">{match.homeTeam}</span>
          {match.homeScore !== null && <span className="ml-2 font-bold text-white">{match.homeScore}</span>}
        </div>

        <div className="px-3 py-1 text-sm font-medium text-center">
          {match.homeScore !== null ? "vs" : match.date.split(" ")[1] || ""}
        </div>

        <div className="flex items-center justify-end flex-1">
          {match.awayScore !== null && <span className="mr-2 font-bold text-white">{match.awayScore}</span>}
          <span className="font-medium">{match.awayTeam}</span>
          <img
            src={match.awayTeamIcon || "/placeholder.svg"}
            alt={match.awayTeam}
            width={32}
            height={32}
            className="ml-3"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 rounded bg-[#252525]">
        <div>
          <div className="text-xs text-gray-400 mb-1">Bet ID</div>
          <div className="text-sm font-medium">{bet.id}</div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">Bet Type</div>
          <div className="text-sm font-medium">{bet.type}</div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">Amount / Odds</div>
          <div className="text-sm font-medium">
            ${bet.amount} @ {bet.odds}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">Potential Payout</div>
          <div className="text-sm font-medium">
            {bet.status === "won" ? (
              <span className="text-green-500">${bet.payout}</span>
            ) : bet.status === "lost" ? (
              <span className="text-red-500">$0</span>
            ) : (
              <span>${(bet.amount * bet.odds).toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

