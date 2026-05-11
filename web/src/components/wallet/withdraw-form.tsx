import { useState } from "react";
import { DollarSign, Loader } from "lucide-react";
import { withdraw } from "@/services/PaymentService";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function WithdrawForm() {
  const [formData, setFormData] = useState({
    amount: "",
    withdrawalMethod: "bank_transfer",
    bankName: "",
    accountHolder: "",
    iban: "",
    bic: "",
    description: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type?: string; text?: string } | null>(null);
  
  const user = useSelector((state: RootState) => state.auth.user);
  const userBalance = user?.balance || 0; 

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const validateForm = () => {
    // Validate amount (min 10, max 10000)
    const amountNum = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amountNum) || amountNum < 10) {
      setMessage({ type: "error", text: "Amount must be at least $10" });
      return false;
    }
    
    if (amountNum > 10000) {
      setMessage({ type: "error", text: "Amount cannot exceed $10,000" });
      return false;
    }
    
    if (amountNum > userBalance) {
      setMessage({ type: "error", text: "Amount exceeds available balance" });
      return false;
    }
    
    // For bank transfer, validate required fields
    if (formData.withdrawalMethod === "bank_transfer") {
      if (!formData.bankName) {
        setMessage({ type: "error", text: "Bank name is required" });
        return false;
      }
      
      if (!formData.accountHolder) {
        setMessage({ type: "error", text: "Account holder name is required" });
        return false;
      }
      
      if (!formData.iban) {
        setMessage({ type: "error", text: "IBAN is required" });
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMessage(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data for API
      const withdrawalData = {
        amount: parseFloat(formData.amount),
        withdrawalMethod: formData.withdrawalMethod,
        ...(formData.withdrawalMethod === "bank_transfer" && {
          bankName: formData.bankName,
          accountHolder: formData.accountHolder,
          iban: formData.iban,
          bic: formData.bic || undefined, // Optional
          description: formData.description || undefined // Optional
        })
      };
      
      // Call the withdraw service function
      const response = await withdraw(
        withdrawalData.amount, 
        withdrawalData.withdrawalMethod
      );
      
      setMessage({ 
        type: "success", 
        text: `Withdrawal request submitted successfully! Transaction ID: ${response.transactionId}` 
      });
      
      // Reset form
      setFormData({
        amount: "",
        withdrawalMethod: "bank_transfer",
        bankName: "",
        accountHolder: "",
        iban: "",
        bic: "",
        description: ""
      });
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Error processing withdrawal" 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Withdraw Funds</h2>
        <div className="text-sm text-gray-400">
          Available Balance: <span className="text-white font-semibold">${userBalance.toFixed(2)}</span>
        </div>
      </div>
      
      {message && (
        <div className={`${message.type === 'error' ? 'bg-red-900/30 border-red-800' : 'bg-green-900/30 border-green-800'} border rounded-md p-4 mb-6`}>
          <p className={message.type === 'error' ? 'text-red-400' : 'text-green-400'}>{message.text}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
            Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              name="amount"
              id="amount"
              value={formData.amount}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-2 rounded-md bg-[#2a2a2a] border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
              placeholder="0.00"
              step="0.01"
              min="10"
              max="10000"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Min: $10 - Max: $10,000</p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="withdrawalMethod" className="block text-sm font-medium text-gray-400 mb-1">
            Withdrawal Method
          </label>
          <select
            id="withdrawalMethod"
            name="withdrawalMethod"
            value={formData.withdrawalMethod}
            onChange={handleChange}
            className="block w-full px-3 py-2 rounded-md bg-[#2a2a2a] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="paypal">PayPal</option>
            <option value="crypto">Crypto Wallet</option>
          </select>
        </div>
        
        {formData.withdrawalMethod === 'bank_transfer' && (
          <div className="space-y-4 mb-6">
            <h3 className="text-md font-medium text-white">Bank Details</h3>
            
            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-400 mb-1">
                Bank Name*
              </label>
              <input
                type="text"
                name="bankName"
                id="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="block w-full px-3 py-2 rounded-md bg-[#2a2a2a] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-400 mb-1">
                Account Holder Name*
              </label>
              <input
                type="text"
                name="accountHolder"
                id="accountHolder"
                value={formData.accountHolder}
                onChange={handleChange}
                className="block w-full px-3 py-2 rounded-md bg-[#2a2a2a] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="iban" className="block text-sm font-medium text-gray-400 mb-1">
                IBAN*
              </label>
              <input
                type="text"
                name="iban"
                id="iban"
                value={formData.iban}
                onChange={handleChange}
                className="block w-full px-3 py-2 rounded-md bg-[#2a2a2a] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="bic" className="block text-sm font-medium text-gray-400 mb-1">
                BIC/SWIFT (Optional)
              </label>
              <input
                type="text"
                name="bic"
                id="bic"
                value={formData.bic}
                onChange={handleChange}
                className="block w-full px-3 py-2 rounded-md bg-[#2a2a2a] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                className="block w-full px-3 py-2 rounded-md bg-[#2a2a2a] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
                rows={2}
              />
            </div>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center items-center py-2 px-4 rounded-md transition duration-300 ${
            isLoading 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'bg-[#ff7b26] hover:bg-[#e66c1e] text-white'
          }`}
        >
          {isLoading ? (
            <>
              <Loader className="animate-spin h-5 w-5 mr-2" />
              Processing...
            </>
          ) : (
            "Withdraw"
          )}
        </button>
      </form>
    </div>
  );
}