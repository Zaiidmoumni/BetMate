import { deposit } from "@/services/PaymentService";
import { DollarSign, Loader } from "lucide-react"
import { useState } from "react";

export default function DepositForm() {
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "creditcard",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ transactionId?: string; checkoutUrl?: string } | null>(null);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData, [name]: value
    });
  };

  const handleSubmit = async(e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate amount 
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      setIsLoading(false);
      return;
    }

    try {
      const response = await deposit(amount, formData.paymentMethod);
      console.log(response);
      
      setSuccess({
        transactionId: response.transactionId,
        checkoutUrl: response.checkoutUrl,
      });
      // Redirect to the payment provider's checkout page
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("An error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }

  }


  return (
    <div>
    {error && (
      <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
        {error}
      </div>
    )}

    {success && !success.checkoutUrl && (
      <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-500 px-4 py-3 rounded mb-4">
        Your deposit is being processed. Transaction ID: {success.transactionId}
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
            min="10"
            step="0.01"
            className="block w-full pl-10 pr-3 py-2 rounded-md bg-[#2a2a2a] border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
            placeholder="0.00"
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Minimum deposit amount: $10.00</p>
      </div>
      
      <div className="mb-4">
        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-400 mb-1">
          Payment Method
        </label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          className="block w-full px-3 py-2 rounded-md bg-[#2a2a2a] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
        >
          <option value="creditcard">Credit Card</option>
          <option value="ideal">iDEAL</option>
          <option value="bancontact">Bancontact</option>
          <option value="paypal">PayPal</option>
        </select>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#ff7b26] border-0 text-white py-2 px-4 rounded-md hover:bg-[#e66c1e] transition duration-300 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader className="animate-spin h-5 w-5 mr-2" />
            Processing...
          </>
        ) : (
          "Deposit"
        )}
      </button>
    </form>
  </div>
);
}