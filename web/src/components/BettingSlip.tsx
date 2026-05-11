import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import apiClient from "@/services/api/apiClient";
import {
  removeBet,
  clearBets,
  selectBets,
  selectBetSlipOpen,
  toggleBetSlip,
} from "@/store/slices/bettingSlipSlice";
import { X, ChevronDown, ChevronUp, Clock, Trash2, AlertCircle, CheckCircle } from "lucide-react";

const BetSlip: React.FC = () => {
  const dispatch = useDispatch();
  const selectedBets = useSelector(selectBets);
  const isOpen = useSelector(selectBetSlipOpen);

  const [stake, setStake] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalOdds = selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
  const potentialWinnings = stake * totalOdds;

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setStake(isNaN(value) ? 0 : value);
  };

  const handleRemoveFromSlip = (matchId: string) => {
    dispatch(removeBet(matchId));
  };

  const handleClearSlip = () => {
    dispatch(clearBets());
  };

  const placeBet = async () => {
    if (stake <= 0) {
      setError("Please enter a valid stake amount");
      return;
    }

    if (selectedBets.length === 0) {
      setError("Your bet slip is empty");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const storedAuth = localStorage.getItem("auth");
      const token = storedAuth ? JSON.parse(storedAuth).accessToken : null;
      const betData = {
        stake,
        matches: selectedBets.map((bet) => ({
          matchId: bet.matchId,
          betOutcome: bet.betOutcome,
          odds: bet.odds,
        })),
      };

      await apiClient.post("bet", betData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setSuccess("Bet placed successfully!");
      dispatch(clearBets());
      setStake(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setIsLoading(false);
    }
  };

  // Close any alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="bg-[#111111] text-white shadow-xl rounded-lg border border-[#222222] overflow-hidden">
      {/* Bet Slip Header */}
      <div
        className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-3 flex justify-between items-center cursor-pointer"
        onClick={() => dispatch(toggleBetSlip())}
      >
        <div className="flex items-center space-x-3">
          <Clock className="h-5 w-5" />
          <span className="font-bold text-lg">Bet Slip</span>
          <div className="bg-white text-orange-600 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold shadow-md">
            {selectedBets.length}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 transition-all duration-300" />
        ) : (
          <ChevronDown className="h-5 w-5 transition-all duration-300" />
        )}
      </div>

      {/* Bet Slip Content */}
      {isOpen && (
        <div className="p-4">
          {/* Alert Messages */}
          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4 relative flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="block sm:inline">{error}</span>
              <button
                onClick={() => setError(null)}
                className="absolute top-3 right-2 text-red-300 hover:text-red-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-900/30 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4 relative flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="block sm:inline">{success}</span>
              <button
                onClick={() => setSuccess(null)}
                className="absolute top-3 right-2 text-green-300 hover:text-green-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {selectedBets.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="bg-[#1A1A1A] rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-lg font-medium mb-1">Your bet slip is empty</p>
              <p className="text-sm">Select some odds to start betting</p>
            </div>
          ) : (
            <>
              {/* Selected Bets List */}
              <div className="mb-6 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-[#222]">
                {selectedBets.map((bet, index) => (
                  <div
                    key={bet.matchId}
                    className={`bg-[#1A1A1A] rounded-lg p-3 mb-2 hover:bg-[#222] transition duration-150 ${
                      index === selectedBets.length - 1 ? "" : "border-b border-[#333]"
                    }`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {bet.matchName || `Match ${bet.matchId.substring(0, 6)}...`}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {bet.betOutcome}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                          {bet.odds.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleRemoveFromSlip(bet.matchId)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Betting Controls */}
              <div className="space-y-4">
                <div className="bg-[#1A1A1A] rounded-lg p-3 flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-300">
                    Total Odds
                  </p>
                  <span className="font-bold text-orange-500 text-lg">
                    {totalOdds.toFixed(2)}
                  </span>
                </div>
                
                <div className="relative">
                  <label
                    htmlFor="stake"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Your Stake
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">$</span>
                    </div>
                    <input
                      type="number"
                      id="stake"
                      className="w-full bg-[#1A1A1A] rounded-lg border border-[#333] shadow-inner pl-8 pr-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none transition-all"
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                      value={stake || ""}
                      onChange={handleStakeChange}
                    />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-[#1A1A1A] to-[#222] rounded-lg p-4 border border-[#333]">
                  <p className="text-sm font-medium text-gray-300 mb-1">
                    Potential Winnings:
                  </p>
                  <p className="text-2xl font-bold text-green-500">
                    ${potentialWinnings.toFixed(2)}
                  </p>
                </div>
                
                <div className="grid grid-cols-5 gap-3 pt-2">
                  <button
                    onClick={handleClearSlip}
                    disabled={isLoading || selectedBets.length === 0}
                    className="bg-[#1A1A1A] hover:bg-[#222] text-gray-300 font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center col-span-1 border border-[#333] transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={placeBet}
                    disabled={
                      isLoading || selectedBets.length === 0 || stake <= 0
                    }
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg col-span-4 transition-all"
                  >
                    {isLoading ? "Placing Bet..." : "Place Bet"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BetSlip;