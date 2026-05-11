import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { verifyEmail } from "@/services/AuthService"

export default function EmailVerificationPage() {
  const location = useLocation()
  const [verificationState, setVerificationState] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const verify = async () => {
      try {
        // Extract token from query parameters
        const queryParams = new URLSearchParams(location.search)
        const token = queryParams.get("token")
        
        console.log("Token from query:", token)
        
        if (!token) {
          setVerificationState("error")
          setErrorMessage("Verification token is missing")
          return
        }

        // The verifyEmail function now returns the data directly, not a Response object
        await verifyEmail(token)
        
        // If we get here, it means the verification was successful
        setVerificationState("success")
        
      } catch (error: any) {
        setVerificationState("error")
        // Extract error message from Axios error if available
        const errorMsg = error.response?.data?.message || error.message || "An unexpected error occurred"
        setErrorMessage(errorMsg)
        console.error("Verification error:", error)
      }
    }

    verify()
  }, [location.search])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
      <div className="w-full max-w-md p-8 rounded-lg bg-[#1e1e1e] border border-gray-800">
        {verificationState === "loading" && (
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-[#ff7b26] animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Verifying your email</h1>
            <p className="text-gray-400">Please wait while we verify your email address...</p>
          </div>
        )}

        {verificationState === "success" && (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-gray-400 mb-6">
              Your email has been successfully verified. You can now access all features of your account.
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="w-full py-2 px-4 bg-[#ff7b26] hover:bg-[#e66c1e] text-white rounded-md font-medium transition-colors flex items-center justify-center"
              >
                Log in to your account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/"
                className="block w-full py-2 px-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-md font-medium transition-colors"
              >
                Return to home page
              </Link>
            </div>
          </div>
        )}

        {verificationState === "error" && (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-gray-400 mb-2">We couldn't verify your email address.</p>
            <p className="text-red-400 mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <Link
                to="/resend-verification"
                className="block w-full py-2 px-4 bg-[#ff7b26] hover:bg-[#e66c1e] text-white rounded-md font-medium transition-colors"
              >
                Resend verification email
              </Link>
              <Link
                to="/support"
                className="block w-full py-2 px-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-md font-medium transition-colors"
              >
                Contact support
              </Link>
              <Link to="/" className="block text-gray-400 hover:text-white transition-colors">
                Return to home page
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}