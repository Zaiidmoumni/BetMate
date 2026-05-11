export default function MatchCardLive() {
  return (
    <div className="p-4 rounded-lg bg-[#1e1e1e] border text-white border-gray-800">
      {/* Match header with league info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <img
            src="/leagues/epl.webp"
            alt="Premier League"
            width={40}
            height={40}
            className="mr-2 rounded-full"
          />
          <span className="text-sm font-medium">Premier League</span>
        </div>
        <div className="flex items-center">
          <span className="px-2 py-1 mr-2 text-xs font-medium text-white uppercase rounded bg-red-600">Live 65'</span>
        </div>
      </div>

      {/* Teams and score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center flex-1">
          <img
            src="https://upload.wikimedia.org/wikipedia/hif/f/ff/Manchester_United_FC_crest.png"
            alt="Manchester United"
            width={32}
            height={32}
            className="mr-3"
          />
          <span className="font-medium">Manchester United</span>
          <span className="ml-2 font-bold text-white">2</span>
        </div>

        <div className="flex items-center justify-end flex-1">
          <span className="mr-2 font-bold text-white">1</span>
          <span className="font-medium">Chelsea</span>
          <img src="https://upload.wikimedia.org/wikipedia/fr/thumb/5/51/Logo_Chelsea.svg/2048px-Logo_Chelsea.svg.png" alt="Chelsea" width={32} height={32} className="ml-3" />
        </div>
      </div>

      {/* Match stats */}
      <div className="p-3 mb-4 rounded bg-[#252525]">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="mb-1 text-xs text-center text-gray-400">Possession</div>
            <div className="flex items-center">
              <span className="w-8 text-right">60%</span>
              <div className="flex-1 h-2 mx-2 overflow-hidden rounded-full bg-[#3a3a3a]">
                <div className="h-full bg-[#ff7b26]" style={{ width: "60%" }}></div>
              </div>
              <span className="w-8">40%</span>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs text-center text-gray-400">Shots</div>
            <div className="flex justify-center">
              <span>12 - 8</span>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs text-center text-gray-400">Shots on Target</div>
            <div className="flex justify-center">
              <span>5 - 3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Betting odds */}
      <div className="grid grid-cols-3 gap-2">
        <button className="p-3 text-center rounded bg-[#252525] hover:bg-[#303030]">
          <div className="text-xs text-gray-400">1</div>
          <div className="text-lg font-bold">2.1</div>
        </button>
        <button className="p-3 text-center rounded bg-[#252525] hover:bg-[#303030]">
          <div className="text-xs text-gray-400">X</div>
          <div className="text-lg font-bold">3.2</div>
        </button>
        <button className="p-3 text-center rounded bg-[#252525] hover:bg-[#303030]">
          <div className="text-xs text-gray-400">2</div>
          <div className="text-lg font-bold">3.4</div>
        </button>
      </div>
    </div>
  )
}

