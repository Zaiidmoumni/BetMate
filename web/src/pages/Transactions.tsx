import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader, AlertCircle, Clock, ChevronDown, ChevronUp, Filter, RefreshCw } from "lucide-react";
import { getAllTransactions, processWithdrawal, cancelWithdrawal } from "@/services/PaymentService";

// Define TypeScript interfaces
interface Transaction {
  _id: string;
  type: string;
  status: string;
  amount: number;
  userId: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

interface StatusBadgeProps {
  status: string;
}

interface StatusIconProps {
  status: string;
}

interface TransactionDetailsProps {
  transaction: Transaction;
  formatDate: (date: string) => string;
}

interface FilterPanelProps {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  clearFilters: () => void;
}

// Transaction Status Badge Component
const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getBadgeStyles = () => {
    switch (status.toLowerCase()) {
      case "completed": return "bg-green-900/30 text-green-400 border-green-800";
      case "pending": return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
      case "initiated": return "bg-blue-900/30 text-blue-400 border-blue-800";
      case "failed": return "bg-red-900/30 text-red-400 border-red-800";
      case "canceled": return "bg-gray-900/30 text-gray-400 border-gray-800";
      default: return "bg-gray-900/30 text-gray-400 border-gray-800";
    }
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${getBadgeStyles()}`}>
      {status.toLowerCase()}
    </span>
  );
};

// Transaction Status Icon Component
const StatusIcon = ({ status }: StatusIconProps) => {
  switch (status.toLowerCase()) {
    case "completed": return <CheckCircle className="h-5 w-5 text-green-400" />;
    case "pending": return <Clock className="h-5 w-5 text-yellow-400" />;
    case "initiated": return <Clock className="h-5 w-5 text-blue-400" />;
    case "failed": return <XCircle className="h-5 w-5 text-red-400" />;
    case "canceled": return <XCircle className="h-5 w-5 text-gray-400" />;
    default: return <AlertCircle className="h-5 w-5 text-gray-400" />;
  }
};

// Transaction Details Component
const TransactionDetails = ({ transaction, formatDate }: TransactionDetailsProps) => (
  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <h3 className="text-sm font-medium text-gray-400 mb-2">Transaction Details</h3>
      <div className="bg-[#1f1f1f] rounded-md p-3 space-y-2">
        <div className="grid grid-cols-2">
          <span className="text-sm text-gray-500">Payment Method</span>
          <span className="text-sm text-white">{transaction.paymentMethod}</span>
        </div>
        <div className="grid grid-cols-2">
          <span className="text-sm text-gray-500">Created</span>
          <span className="text-sm text-white">{formatDate(transaction.createdAt)}</span>
        </div>
        <div className="grid grid-cols-2">
          <span className="text-sm text-gray-500">Updated</span>
          <span className="text-sm text-white">{formatDate(transaction.updatedAt)}</span>
        </div>
      </div>
    </div>

    {transaction.metadata && (
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Additional Information</h3>
        <div className="bg-[#1f1f1f] rounded-md p-3 space-y-2">
          {Object.entries(transaction.metadata).map(([key, value]) => (
            <div key={key} className="grid grid-cols-2">
              <span className="text-sm text-gray-500">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
              <span className="text-sm text-white break-words">{value?.toString() || ""}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Filter Panel Component
const FilterPanel = ({ filterStatus, setFilterStatus, filterType, setFilterType, sortOrder, setSortOrder, clearFilters }: FilterPanelProps) => (
  <div className="p-4 bg-[#2a2a2a] rounded-md space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Status
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="block w-full px-3 py-2 rounded-md bg-[#1f1f1f] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="initiated">Initiated</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Transaction Type
        </label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="block w-full px-3 py-2 rounded-md bg-[#1f1f1f] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
          <option value="refund">Refund</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Sort Order
        </label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="block w-full px-3 py-2 rounded-md bg-[#1f1f1f] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>
    </div>
    
    <div className="flex justify-end">
      <button
        onClick={clearFilters}
        className="px-3 py-2 rounded-md bg-[#1f1f1f] text-gray-200 hover:bg-[#3a3a3a] transition duration-200 text-sm"
      >
        Clear Filters
      </button>
    </div>
  </div>
);

// Main Page Component
export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("desc"); 
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Fetch all transactions
  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllTransactions();
      setTransactions(data);
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Process withdrawal
  const handleProcessWithdrawal = async (transactionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(transactionId);
    try {
      await processWithdrawal(transactionId);
      // Refresh transactions after successful processing
      await fetchTransactions();
    } catch (err: any) {
      console.error("Error processing withdrawal:", err);
      setError(`Failed to process withdrawal: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Cancel withdrawal
  const handleCancelWithdrawal = async (transactionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(transactionId);
    try {
      await cancelWithdrawal(transactionId);
      // Refresh transactions after successful cancellation
      await fetchTransactions();
    } catch (err: any) {
      console.error("Error cancelling withdrawal:", err);
      setError(`Failed to cancel withdrawal: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterStatus("all");
    setFilterType("all");
    setSortOrder("desc");
  };

  // Apply filters and sort
  useEffect(() => {
    if (transactions.length > 0) {
      let filtered = [...transactions];
      
      // Apply status filter
      if (filterStatus !== "all") {
        filtered = filtered.filter(transaction => 
          transaction.status.toLowerCase() === filterStatus.toLowerCase()
        );
      }
      
      // Apply type filter
      if (filterType !== "all") {
        filtered = filtered.filter(transaction => 
          transaction.type.toLowerCase() === filterType.toLowerCase()
        );
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      });
      
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions([]);
    }
  }, [transactions, filterStatus, filterType, sortOrder]);

  // Load transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Toggle transaction details
  const toggleTransactionDetails = (transactionId: string) => {
    setExpandedTransactionId(prevId => 
      prevId === transactionId ? null : transactionId
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get human-readable transaction type
  const getTransactionTypeText = (type: string) => {
    switch (type.toLowerCase()) {
      case "withdrawal": return "Withdrawal";
      case "deposit": return "Deposit";
      case "refund": return "Refund";
      default: return type;
    }
  };

  return (
    <div className="px-4 py-6 w-full pl-[18rem] mt-16 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-white">Transaction Management</h1>
        <button
          onClick={fetchTransactions}
          className="flex items-center px-3 py-2 rounded-md bg-[#2a2a2a] text-gray-200 hover:bg-[#3a3a3a] transition duration-200"
          disabled={isLoading}
        >
          {isLoading ? 
            <Loader className="h-4 w-4 mr-2 animate-spin" /> : 
            <RefreshCw className="h-4 w-4 mr-2" />
          }
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-md p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center px-3 py-2 rounded-md bg-[#2a2a2a] text-gray-200 hover:bg-[#3a3a3a] transition duration-200 mb-2"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters & Sorting
          {isFilterOpen ? 
            <ChevronUp className="h-4 w-4 ml-2" /> : 
            <ChevronDown className="h-4 w-4 ml-2" />
          }
        </button>
        
        {isFilterOpen && (
          <FilterPanel 
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterType={filterType}
            setFilterType={setFilterType}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            clearFilters={clearFilters}
          />
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader className="h-8 w-8 text-[#ff7b26] animate-spin" />
        </div>
      )}

      {!isLoading && filteredTransactions.length === 0 && (
        <div className="bg-[#2a2a2a] rounded-md p-8 text-center">
          <p className="text-gray-400">No transactions found</p>
        </div>
      )}

      {!isLoading && filteredTransactions.length > 0 && (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <div key={transaction._id} className="bg-[#2a2a2a] rounded-md overflow-hidden">
              {/* Transaction header */}
              <div 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer"
                onClick={() => toggleTransactionDetails(transaction._id)}
              >
                <div className="flex items-start md:items-center space-x-3">
                  <StatusIcon status={transaction.status} />
                  <div>
                    <div className="flex items-center">
                      <span className="text-white font-medium">
                        {getTransactionTypeText(transaction.type)}
                      </span>
                      <span className="ml-2">
                        <StatusBadge status={transaction.status} />
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <span>ID: {transaction._id}</span>
                      <span className="mx-2">•</span>
                      <span>User ID: {transaction.userId}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center mt-2 md:mt-0">
                  <div className="text-right mr-4">
                    <div className="text-lg font-semibold text-white">
                      ${transaction.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>
                  {expandedTransactionId === transaction._id ? 
                    <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  }
                </div>
              </div>

              {/* Transaction details */}
              {expandedTransactionId === transaction._id && (
                <div className="px-4 pb-4 border-t border-gray-700">
                  <TransactionDetails transaction={transaction} formatDate={formatDate} />

                  {/* Action buttons for pending withdrawals */}
                  {transaction.type.toLowerCase() === "withdrawal" && transaction.status.toLowerCase() === "pending" && (
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        onClick={(e) => handleCancelWithdrawal(transaction._id, e)}
                        disabled={processingId === transaction._id}
                        className="px-4 py-2 rounded-md bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-800/30 transition duration-200"
                      >
                        {processingId === transaction._id ? "Processing..." : "Reject"}
                      </button>
                      <button
                        onClick={(e) => handleProcessWithdrawal(transaction._id, e)}
                        disabled={processingId === transaction._id}
                        className="px-4 py-2 rounded-md bg-green-900/30 text-green-400 border border-green-800 hover:bg-green-800/30 transition duration-200"
                      >
                        {processingId === transaction._id ? (
                          <div className="flex items-center">
                            <Loader className="animate-spin h-4 w-4 mr-2" />
                            Processing...
                          </div>
                        ) : (
                          "Approve"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}