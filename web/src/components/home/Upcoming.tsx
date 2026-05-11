import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { AppDispatch, RootState } from "@/store/store";
import {
  selectAllMatches,
  fetchAllMatches,
  selectMatchesStatus,
  selectMatchesError,
} from "@/store/slices/gamesSlice";
import { toastNotifier } from "@/utils/toastNotifier";
import { addBet, setBetSlipOpen } from "@/store/slices/bettingSlipSlice";

interface Team {
  name: string;
  logo: string;
}

interface League {
  name: string;
  logo: string;
}

interface DisplayMatch {
  id: string;
  time: string;
  rawTime: string;
  league: League;
  team1: Team;
  team2: Team;
  odds: {
    homeWin: string;
    draw: string;
    awayWin: string;
    overPoint?: number; // Changed from overPoints to overPoint to match usage
    over?: string;
    under?: string;
  };
}

export default function UpcomingMatches() {
  const dispatch = useDispatch<AppDispatch>();
  const matches = useSelector((state: RootState) => selectAllMatches(state));
  const status = useSelector((state: RootState) => selectMatchesStatus(state));
  const error = useSelector((state: RootState) => selectMatchesError(state));

  useEffect(() => {
    // Only fetch if we haven't already or if there was an error
    if (status === "idle") {
      console.log("Fetching matches...");
      dispatch(fetchAllMatches());
    }
  }, [status, dispatch]);

  // Helper function to format commence time
  const formatMatchTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const today = new Date();

      // Check if the match is today
      if (date.toDateString() === today.toDateString()) {
        return `Today, ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }

      // Check if the match is tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (date.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow, ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }

      // Otherwise show date and time
      return `${date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      })}, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } catch (e) {
      return "Invalid date";
    }
  };

  // Helper to format match data for display
  const formatMatchForDisplay = (match: any): DisplayMatch => {
    // Extract league from match data
    const league = {
      name: match.league.title,
      logo: `/leagues/${match.league.key}.png`,
    };

    // Extract teams and add logos
    const team1 = {
      name: match.match.homeTeam,
      logo:
        match.homeTeamLogo ||
        `/teams/${match.match.homeTeam.replace(/\s+/g, "_").toLowerCase()}.jpg`,
    };

    const team2 = {
      name: match.match.awayTeam,
      logo:
        match.awayTeamLogo ||
        `/teams/${match.match.awayTeam.replace(/\s+/g, "_").toLowerCase()}.jpg`,
    };

    // Extract odds with null safety
    const odds = {
      homeWin: match.odds?.homeWin ? match.odds.homeWin.toFixed(2) : "-",
      draw: match.odds?.draw ? match.odds.draw.toFixed(2) : "-",
      awayWin: match.odds?.awayWin ? match.odds.awayWin.toFixed(2) : "-",
      overPoint: undefined,
      over: undefined,
      under: undefined,
    };

    // Add over/under if available
    if (match.odds?.overUnder) {
      odds.overPoint = match.odds.overUnder.point;
      odds.over = match.odds.overUnder.over.toFixed(2);
      odds.under = match.odds.overUnder.under.toFixed(2);
    }

    return {
      id: match.id,
      time: formatMatchTime(match.match.commenceTime),
      rawTime: match.match.commenceTime,
      league,
      team1,
      team2,
      odds,
    };
  };

  // Get the 10 most imminent matches, sorted by commence time
  const upcomingMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [];

    // Filter out matches that already started
    const now = new Date();
    const futureMatches = matches.filter(
      (match) => new Date(match.match.commenceTime) > now
    );

    // Format and sort matches by commence time
    return futureMatches
      .map(formatMatchForDisplay)
      .sort(
        (a, b) => new Date(a.rawTime).getTime() - new Date(b.rawTime).getTime()
      )
      .slice(0, 10); // Get only the first 10
  }, [matches]);

  // Function to handle adding a bet to the bet slip
  const handleAddToBetSlip = (
    match: DisplayMatch,
    betType: string,
    odds: string
  ) => {
    // Don't add if odds is not available
    if (odds === "-") {
      toastNotifier({
        message: "Odds not available for this selection",
        type: "error",
        duration: 3000,
      });
      return;
    }

    const oddsValue = parseFloat(odds);
    if (isNaN(oddsValue)) {
      toastNotifier({
        message: "Invalid odds value",
        type: "error",
        duration: 3000,
      });
      return;
    }

    let betOutcome = "";
    switch (betType) {
      case "homeWin":
        betOutcome = `${match.team1.name} Win`;
        break;
      case "draw":
        betOutcome = "Draw";
        break;
      case "awayWin":
        betOutcome = `${match.team2.name} Win`;
        break;
      case "over":
        betOutcome = `Over ${match.odds.overPoint}`;
        break;
      case "under":
        betOutcome = `Under ${match.odds.overPoint}`;
        break;
      default:
        betOutcome = betType;
    }

    dispatch(
      addBet({
        matchId: match.id,
        betOutcome: betOutcome,
        odds: oddsValue,
        matchName: `${match.team1.name} vs ${match.team2.name}`,
      })
    );

    // Open the bet slip if it's not already open
    dispatch(setBetSlipOpen(true));

    // Show toast notification
    toastNotifier({
      message: `Added ${betOutcome} to bet slip`,
      type: "error",
      duration: 3000,
    });
    return;
  };

  if (status === "loading") {
    return (
      <div className="text-center p-8 bg-[#2C2C2E] rounded-xl animate-pulse">
        <p className="text-gray-400">Loading upcoming matches...</p>
      </div>
    );
  }

  if (error) {
    const errorMessage =
      typeof error === "string"
        ? error
        : error ||
          (typeof error === "object" ? JSON.stringify(error) : String(error));
    return (
      <div className="text-center mt-8 text-red-500">Error: {errorMessage}</div>
    );
  }

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Upcoming Matches</h2>
        <Link to="/games" className="text-sm text-orange-400 hover:underline">
          View All
        </Link>
      </div>

      {upcomingMatches.length === 0 ? (
        <div className="text-center p-8 bg-[#2C2C2E] rounded-xl">
          <p className="text-gray-400">No upcoming matches available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {upcomingMatches.map((match) => (
            <div
              key={match.id}
              className="bg-[#2C2C2E] rounded-xl p-4 hover:bg-[#3C3C3E] transition-colors"
            >
              {/* Header with league and time */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img
                    src={match.league.logo}
                    alt={match.league.name}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-league.jpg";
                    }}
                  />
                  <span className="text-sm text-gray-300">
                    {match.league.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    <Clock className="w-4 h-4 inline-block mr-1" />
                    {match.time}
                  </span>
                </div>
              </div>

              {/* Teams */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 w-2/5">
                  {/* <img 
                    src={match.team1.logo} 
                    alt={match.team1.name} 
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-team.jpg';
                    }}
                  /> */}
                  <span className="font-medium text-white truncate">
                    {match.team1.name}
                  </span>
                </div>
                <div className="px-2 py-1 bg-[#3C3C3E] rounded-lg">
                  <span className="text-sm text-gray-400">VS</span>
                </div>
                <div className="flex items-center gap-3 w-2/5 justify-end">
                  <span className="font-medium text-white truncate">
                    {match.team2.name}
                  </span>
                  {/* <img 
                    src={match.team2.logo} 
                    alt={match.team2.name} 
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-team.jpg';
                    }}
                  /> */}
                </div>
              </div>

              {/* Main betting options: 1-X-2 */}
              <div className="flex gap-2 mb-3">
                <button
                  className="flex-1 p-2 rounded-lg text-center bg-[#1C1C1E] hover:bg-orange-500 text-white transition-colors"
                  onClick={() =>
                    handleAddToBetSlip(match, "homeWin", match.odds.homeWin)
                  }
                >
                  <div className="text-xs mb-1 text-gray-400">1</div>
                  <div className="font-medium">{match.odds.homeWin}</div>
                </button>
                <button
                  className="flex-1 p-2 rounded-lg text-center bg-[#1C1C1E] hover:bg-orange-500 text-white transition-colors"
                  onClick={() =>
                    handleAddToBetSlip(match, "draw", match.odds.draw)
                  }
                >
                  <div className="text-xs mb-1 text-gray-400">X</div>
                  <div className="font-medium">{match.odds.draw}</div>
                </button>
                <button
                  className="flex-1 p-2 rounded-lg text-center bg-[#1C1C1E] hover:bg-orange-500 text-white transition-colors"
                  onClick={() =>
                    handleAddToBetSlip(match, "awayWin", match.odds.awayWin)
                  }
                >
                  <div className="text-xs mb-1 text-gray-400">2</div>
                  <div className="font-medium">{match.odds.awayWin}</div>
                </button>
              </div>

              {/* Over/Under options if available */}
              {match.odds.overPoint && (
                <div className="flex gap-2">
                  <button
                    className="flex-1 p-2 rounded-lg text-center bg-[#1C1C1E] hover:bg-orange-500 text-white transition-colors"
                    onClick={() =>
                      handleAddToBetSlip(match, "over", match.odds.over || "-")
                    }
                  >
                    <div className="text-xs mb-1 text-gray-400">
                      Over {match.odds.overPoint}
                    </div>
                    <div className="font-medium">{match.odds.over}</div>
                  </button>
                  <button
                    className="flex-1 p-2 rounded-lg text-center bg-[#1C1C1E] hover:bg-orange-500 text-white transition-colors"
                    onClick={() =>
                      handleAddToBetSlip(
                        match,
                        "under",
                        match.odds.under || "-"
                      )
                    }
                  >
                    <div className="text-xs mb-1 text-gray-400">
                      Under {match.odds.overPoint}
                    </div>
                    <div className="font-medium">{match.odds.under}</div>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
