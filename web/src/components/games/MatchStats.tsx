// src/components/games/MatchStats.tsx

interface StatsProps {
    stats: {
      possession: { home: number; away: number }
      shots: { home: number; away: number }
      shotsOnTarget: { home: number; away: number }
    }
  }
  
  export default function MatchStats({ stats }: StatsProps) {
    return (
      <div className="p-3 mb-4 rounded bg-[#252525]">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="mb-1 text-xs text-center text-gray-400">Possession</div>
            <div className="flex items-center">
              <span className="w-8 text-right">{stats.possession.home}%</span>
              <div className="flex-1 h-2 mx-2 overflow-hidden rounded-full bg-[#3a3a3a]">
                <div
                  className="h-full bg-[#ff7b26]"
                  style={{ width: `${stats.possession.home}%` }}
                ></div>
              </div>
              <span className="w-8">{stats.possession.away}%</span>
            </div>
          </div>
  
          <div>
            <div className="mb-1 text-xs text-center text-gray-400">Shots</div>
            <div className="flex justify-center">
              <span>
                {stats.shots.home} - {stats.shots.away}
              </span>
            </div>
          </div>
  
          <div>
            <div className="mb-1 text-xs text-center text-gray-400">Shots on Target</div>
            <div className="flex justify-center">
              <span>
                {stats.shotsOnTarget.home} - {stats.shotsOnTarget.away}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }