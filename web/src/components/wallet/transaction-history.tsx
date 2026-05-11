import { getHistory } from "@/services/PaymentService";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// Define the transaction type based on your API response
interface Transaction {
  _id: string;
  userId: string;
  amount: number;
  type: "deposit" | "withdrawal";
  status: "pending" | "completed" | "failed";
  paymentMethod: string;
  metadata: {
    bankName?: string;
    accountHolder?: string;
    iban?: string;
    description?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  reference?: string;
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await getHistory();
      setTransactions(history);
    } catch (err) {
      console.error("Failed to fetch transaction history:", err);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading && transactions.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin">
          <RefreshCw className="h-8 w-8 text-orange-500" />
        </div>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-red-400 mb-3">{error}</p>
        <Button
          onClick={fetchHistory}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center p-6 bg-[#2a2a2a] rounded-md">
        <p className="text-gray-400">No transaction history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 ">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        <Button
          onClick={fetchHistory}
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="overflow-y-auto max-h-[70vh] pr-2">
        {transactions.map((transaction) => (
          <div
            key={transaction._id}
            className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-md hover:bg-[#333333] transition-colors mb-2"
          >
            <div className="flex items-center">
              {transaction.type === "deposit" ? (
                <ArrowDownCircle className="text-green-500 mr-3 h-5 w-5 flex-shrink-0" />
              ) : (
                <ArrowUpCircle className="text-red-500 mr-3 h-5 w-5 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {transaction.type === "deposit" ? "Deposit" : "Withdrawal"}
                  {transaction.paymentMethod && (
                    <span className="text-gray-400 text-xs ml-2">
                      via {transaction.paymentMethod.replace("_", " ")}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(transaction.createdAt).toLocaleString()}
                </p>
                {transaction.reference && (
                  <p className="text-xs text-gray-500 truncate">
                    Ref: {transaction.reference}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p
                className={`font-medium ${
                  transaction.status === "completed"
                    ? "text-green-500"
                    : transaction.status === "failed"
                    ? "text-red-500"
                    : "text-yellow-500"
                }`}
              >
                {transaction.type === "deposit" ? "+" : "-"}$
                {transaction.amount.toFixed(2)}
              </p>
              <p
                className={`text-sm ${
                  transaction.status === "completed"
                    ? "text-green-500"
                    : transaction.status === "failed"
                    ? "text-red-500"
                    : "text-yellow-500"
                }`}
              >
                {transaction.status.charAt(0).toUpperCase() +
                  transaction.status.slice(1)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
