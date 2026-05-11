import {
  fetchAllMatches,
  selectAllMatches,
  selectMatchesStatus,
  selectMatchesError,
} from "@/store/slices/gamesSlice";
import { AppDispatch } from "@/store/store";
import { Clock } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toastNotifier } from "@/utils/toastNotifier";
import { addBet, setBetSlipOpen } from "@/store/slices/bettingSlipSlice";

interface Team {
  name: string;
  logo: string;
}

interface League {
  name: string;
  logo: string;
  key: string;
}

interface DisplayMatch {
  id: string;
  time: string;
  rawTime: string;
  league: League;
  team1: Team;
  team2: Team;
  isLive: boolean;
  odds: {
    "1": string;
    X: string;
    "2": string;
    overPoint?: number;
    over?: string;
    under?: string;
  };
}

interface MatchCardUpcomingProps {
  activeTab?: string;
  selectedLeague?: string;
  selectedDate?: string;
}

export default function MatchCardUpcoming({
  activeTab = "all",
  selectedLeague = "all",
  selectedDate = "all",
}: MatchCardUpcomingProps) {
  const dispatch = useDispatch<AppDispatch>();
  const matches = useSelector(selectAllMatches);
  const status = useSelector(selectMatchesStatus);
  const error = useSelector(selectMatchesError);

  useEffect(() => {
    dispatch(fetchAllMatches());
  }, [dispatch]);

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

  // Helper to check if a match is live
  const isMatchLive = (commenceTime: string): boolean => {
    const matchTime = new Date(commenceTime);
    const now = new Date();
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    return (
      matchTime <= now && now.getTime() - matchTime.getTime() < twoHoursInMs
    );
  };

  // Helper to check if a match matches the date filter
  const matchesDateFilter = (
    commenceTime: string,
    dateFilter: string
  ): boolean => {
    if (dateFilter === "all") return true;

    const matchDate = new Date(commenceTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset hours to compare just the dates
    const matchDay = new Date(matchDate.setHours(0, 0, 0, 0));
    const todayDay = new Date(today.setHours(0, 0, 0, 0));
    const tomorrowDay = new Date(tomorrow.setHours(0, 0, 0, 0));

    switch (dateFilter) {
      case "today":
        return matchDay.getTime() === todayDay.getTime();
      case "tomorrow":
        return matchDay.getTime() === tomorrowDay.getTime();
      case "this-week": {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        return matchDay >= todayDay && matchDay <= endOfWeek;
      }
      default:
        return true;
    }
  };

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
      case "1":
        betOutcome = `${match.team1.name} Win`;
        break;
      case "X":
        betOutcome = "Draw";
        break;
      case "2":
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
      type: "success",
      duration: 3000,
    });
  };

  // Helper to format match data for display
  const formatMatchForDisplay = (match: any): DisplayMatch => {
    // Extract league from match data
    const league = {
      name: match.league.title,
      logo: `/leagues/${match.league.key}.png`,
      key: match.league.key,
    };

    const isLive = isMatchLive(match.match.commenceTime);

    // Extract teams and add logos
    const team1 = {
      name: match.match.homeTeam,
      logo:
        (match.homeTeamLogo || "") ||
        `/teams/${match.match.homeTeam.replace(/\s+/g, "_").toLowerCase()}.jpg`,
    };

    const team2 = {
      name: match.match.awayTeam,
      logo:
        (match.awayTeamLogo || "") ||
        `/teams/${match.match.awayTeam.replace(/\s+/g, "_").toLowerCase()}.jpg`,
    };

    // Extract odds with null safety
    const odds = {
      "1": match.odds?.homeWin ? match.odds.homeWin.toFixed(2) : "-",
      X: match.odds?.draw ? match.odds.draw.toFixed(2) : "-",
      "2": match.odds?.awayWin ? match.odds.awayWin.toFixed(2) : "-",
      overPoint: undefined,
      over: "-",
      under: "-",
    };

    // Add over/under if available
    if (match.odds?.overUnder) {
      odds.overPoint = match.odds.overUnder.point;
      odds.over = match.odds.overUnder.over
        ? match.odds.overUnder.over.toFixed(2)
        : "-";
      odds.under = match.odds.overUnder.under
        ? match.odds.overUnder.under.toFixed(2)
        : "-";
    }

    return {
      id: match.id,
      time: formatMatchTime(match.match.commenceTime),
      rawTime: match.match.commenceTime,
      league,
      team1,
      team2,
      isLive,
      odds,
    };
  };

  // Filter and format matches based on selected filters
  const filteredMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [];

    const now = new Date();

    return matches
      .filter((match) => {
        const matchTime = new Date(match.match.commenceTime);
        const isLive = isMatchLive(match.match.commenceTime);

        // Filter by tab (all, live, upcoming)
        if (activeTab === "live" && !isLive) return false;
        if (activeTab === "upcoming" && (isLive || matchTime < now))
          return false;

        // Direct filter by league key - exact match with select value
        if (selectedLeague !== "all" && match.league.key !== selectedLeague)
          return false;

        // Filter by date
        if (!matchesDateFilter(match.match.commenceTime, selectedDate))
          return false;

        return true;
      })
      .map(formatMatchForDisplay)
      .sort((a, b) => {
        // Sort live matches first, then by start time
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        return new Date(a.rawTime).getTime() - new Date(b.rawTime).getTime();
      });
  }, [matches, activeTab, selectedLeague, selectedDate]);

  if (status === "loading") {
    return (
      <div className="text-center p-8 bg-[#2C2C2E] rounded-xl animate-pulse">
        <p className="text-gray-400">Loading matches...</p>
      </div>
    );
  }

  if (status === "failed" && error) {
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
    <>
      {filteredMatches.length === 0 ? (
        <div className="text-center p-8 bg-[#2C2C2E] rounded-xl">
          <p className="text-gray-400">
            No matches found for the selected filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className="bg-[#2C2C2E] rounded-xl p-4 hover:bg-[#3C3C3E] transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                <img
                      src={match.league.logo}
                      alt={match.league.name}
                      className="w-8 h-8 "
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-league.jpg";
                      }}
                    />
                  <span className="text-sm text-gray-300">
                    {match.league.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {match.isLive && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-md animate-pulse">
                      LIVE
                    </span>
                  )}
                  <span className="text-sm text-gray-400">
                    <Clock className="w-4 h-4 inline-block mr-1" />
                    {match.time}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 w-2/5">
                  {/* Team 1 logo commented out but kept for future reference */}
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
                  {/* Team 2 logo commented out but kept for future reference */}
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                {Object.entries({
                  "1": match.odds["1"],
                  X: match.odds["X"],
                  "2": match.odds["2"],
                }).map(([key, value]) => (
                  <button
                    key={key}
                    className="flex-1 p-2 rounded-lg text-center bg-[#1C1C1E] hover:bg-orange-500 text-white transition-colors"
                    onClick={() => handleAddToBetSlip(match, key, value)}
                  >
                    <div className="text-xs mb-1 text-gray-400">{key}</div>
                    <div className="font-medium">{value}</div>
                  </button>
                ))}
              </div>

              {/* Over/Under options if available */}
              {match.odds.overPoint && (
                <div className="flex gap-2 mt-3">
                  <button 
                    className="flex-1 p-2 rounded-lg text-center bg-[#1C1C1E] hover:bg-orange-500 text-white transition-colors"
                    onClick={() => handleAddToBetSlip(match, "over", match.odds.over || "-")}
                  >
                    <div className="text-xs mb-1 text-gray-400">
                      Over {match.odds.overPoint}
                    </div>
                    <div className="font-medium">{match.odds.over}</div>
                  </button>
                  <button 
                    className="flex-1 p-2 rounded-lg text-center bg-[#1C1C1E] hover:bg-orange-500 text-white transition-colors"
                    onClick={() => handleAddToBetSlip(match, "under", match.odds.under || "-")}
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
    </>
  );
}