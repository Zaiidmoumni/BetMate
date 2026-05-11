import { TrendingUp, DollarSign, Percent } from "lucide-react"

export default function BetHistoryStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-[#1e1e1e] rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-400">Total Bets</p>
            <p className="text-2xl font-bold">42</p>
          </div>
          <div className="p-2 rounded-full bg-[#2a2a2a]">
            <DollarSign className="w-5 h-5 text-[#ff7b26]" />
          </div>
        </div>
      </div>

      <div className="bg-[#1e1e1e] rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-400">Win Rate</p>
            <p className="text-2xl font-bold">58%</p>
          </div>
          <div className="p-2 rounded-full bg-[#2a2a2a]">
            <Percent className="w-5 h-5 text-[#ff7b26]" />
          </div>
        </div>
      </div>

      <div className="bg-[#1e1e1e] rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-400">Total Wagered</p>
            <p className="text-2xl font-bold">$1,245</p>
          </div>
          <div className="p-2 rounded-full bg-[#2a2a2a]">
            <DollarSign className="w-5 h-5 text-[#ff7b26]" />
          </div>
        </div>
      </div>

      <div className="bg-[#1e1e1e] rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-400">Net Profit</p>
            <p className="text-2xl font-bold text-green-500">+$320</p>
          </div>
          <div className="p-2 rounded-full bg-[#2a2a2a]">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

