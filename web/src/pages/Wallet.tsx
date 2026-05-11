"use client"

import { useState } from "react"
import { Wallet, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import TransactionHistory from "@/components/wallet/transaction-history" 
import DepositForm from "@/components/wallet/deposit-form"
import WithdrawForm from "@/components/wallet/withdraw-form"
import { useSelector } from "react-redux"
import { RootState } from "@/store/store"

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState("deposit")
  const user = useSelector((state: RootState) => state.auth.user)

  return (
    <div className="flex-1 h-screen pl-[18rem] pt-20 p-6 bg-[#121212] text-white overflow-y-auto">
      <h1 className="mb-6 text-2xl font-bold flex items-center">
        <Wallet className="mr-2" /> My Wallet
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-[#1e1e1e] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Balance</h2>
            <div className="text-4xl font-bold text-[#ff7b26]">$ {user?.balance}</div>
          </div>

          <div className="bg-[#1e1e1e] rounded-lg p-6">
            <div className="flex mb-4">
              <button
                className={`flex-1 py-2 px-4 rounded-tl-md rounded-bl-md border-0 ${
                  activeTab === "deposit" ? "bg-[#ff7b26] text-white" : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                }`}
                onClick={() => setActiveTab("deposit")}
              >
                <ArrowDownCircle className="inline mr-2" /> Deposit
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-tr-md rounded-br-md border-0 ${
                  activeTab === "withdraw" ? "bg-[#ff7b26] text-white" : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                }`}
                onClick={() => setActiveTab("withdraw")}
              >
                <ArrowUpCircle className="inline mr-2" /> Withdraw
              </button>
            </div>
            {activeTab === "deposit" ? <DepositForm /> : <WithdrawForm />}
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-[#1e1e1e] rounded-lg p-6 flex flex-col h-full max-h-[calc(100vh-160px)]">
            <TransactionHistory />
          </div>
        </div>
      </div>
    </div>
  )
}