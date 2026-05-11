import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { verifyPayment } from '@/services/PaymentService';

export default function PaymentReturn() {
  const { transactionId } = useParams();
  const [status, setStatus] = useState('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkPayment = async () => {
      try {
        const response = await verifyPayment(transactionId);
        setStatus(response.status.toLowerCase());
        
        // Optional: Auto-redirect after successful payment
        if (response.status.toLowerCase() === 'completed') {
          setTimeout(() => navigate('/my-wallet'), 3000);
        }
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.message || 'An error occurred while verifying your payment');
      }
    };

    checkPayment();
  }, [transactionId, navigate]);

  return (
    <div className="flex min-h-screen bg-gray-900">
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
          <button 
            onClick={() => navigate('/my-wallet')} 
            className="flex items-center text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to wallet
          </button>
          
          <div className="text-center">
            {status === 'checking' && (
              <>
                <div className="flex justify-center mb-4">
                  <Loader size={64} className="text-primary animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Processing Payment</h2>
                <p className="text-gray-400">
                  Please wait while we verify your transaction.
                </p>
              </>
            )}
            
            {status === 'completed' && (
              <>
                <div className="flex justify-center mb-4">
                  <CheckCircle size={64} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                <p className="text-gray-400 mb-4">
                  Your deposit has been processed successfully.
                </p>
                <p className="text-gray-500">
                  Redirecting to your wallet...
                </p>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <div className="flex justify-center mb-4">
                  <XCircle size={64} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
                <p className="text-gray-400 mb-4">
                  We couldn't process your payment. Please try again.
                </p>
                <button 
                  onClick={() => navigate('/deposit')}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
                >
                  Try Again
                </button>
              </>
            )}
            
            {status === 'cancelled' && (
              <>
                <div className="flex justify-center mb-4">
                  <XCircle size={64} className="text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h2>
                <p className="text-gray-400 mb-4">
                  Your payment was cancelled.
                </p>
                <button 
                  onClick={() => navigate('/deposit')}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
                >
                  Try Again
                </button>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="flex justify-center mb-4">
                  <AlertCircle size={64} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verification Error</h2>
                <p className="text-gray-400 mb-4">
                  {errorMessage || 'An error occurred while verifying your payment'}
                </p>
                <button 
                  onClick={() => navigate('/my-wallet')}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
                >
                  Go to Wallet
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}