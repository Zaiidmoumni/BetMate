import { useState, useEffect } from "react"
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { resetPassword } from "@/services/AuthService" 
import { toastNotifier } from "@/utils/toastNotifier"

export default function ResetPasswordPage() {
  const location = useLocation()
  const [resetState, setResetState] = useState<"loading" | "form" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  // Password strength indicators
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
  const passwordsMatch = password === confirmPassword

  const passwordStrength = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length

  useEffect(() => {
    // Extract token from query parameters
    const queryParams = new URLSearchParams(location.search)
    const tokenFromQuery = queryParams.get("token")
    
    // console.log("Reset token from query:", tokenFromQuery)
    
    if (!tokenFromQuery) {
      setResetState("error")
      setErrorMessage("Reset token is missing")
      return
    }

    setToken(tokenFromQuery)
    
    setResetState("form")
  }, [location.search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate password
    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      setErrorMessage("Please ensure your password meets all requirements")
      return
    }

    if (!passwordsMatch) {
      setErrorMessage("Passwords do not match")
      return
    }

    try {
      setResetState("loading")

      if (!token) {
        setResetState("error")
        setErrorMessage("Reset token is missing")
        return
      }

      await resetPassword(token, password)
      setResetState("success")

      toastNotifier({
        message: "Password reset successfully",
        type: "success",
        duration: 3000,
      })
      
    } catch (error: any) {
      setResetState("error")
      // Extract error message from Axios error if available
      const errorMsg = error.response?.data?.message || error.message || "An unexpected error occurred"
      setErrorMessage(errorMsg)
      console.error("Password reset error:", error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
      <div className="w-full max-w-md p-8 rounded-lg bg-[#1e1e1e] border border-gray-800">
        {resetState === "loading" && (
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-[#ff7b26] animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Processing Your Request</h1>
            <p className="text-gray-400">Please wait while we verify your reset link...</p>
          </div>
        )}

        {resetState === "success" && (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Password Reset Successfully</h1>
            <p className="text-gray-400 mb-6">
              Your password has been reset successfully. You can now log in with your new password.
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

        {resetState === "error" && (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Password Reset Failed</h1>
            <p className="text-gray-400 mb-2">We couldn't reset your password.</p>
            <p className="text-red-400 mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <Link
                to="/forgot-password"
                className="block w-full py-2 px-4 bg-[#ff7b26] hover:bg-[#e66c1e] text-white rounded-md font-medium transition-colors"
              >
                Request New Reset Link
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

        {resetState === "form" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
            <p className="text-gray-400 mb-6">Create a new password for your account.</p>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md flex items-start">
                <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 rounded-md bg-[#2a2a2a] border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 rounded-md bg-[#2a2a2a] border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-400 mb-2">Password Requirements:</p>
                <ul className="space-y-1 text-sm">
                  <li className={`flex items-center ${hasMinLength ? "text-green-500" : "text-gray-400"}`}>
                    <span className="mr-2">{hasMinLength ? "✓" : "○"}</span>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center ${hasUppercase ? "text-green-500" : "text-gray-400"}`}>
                    <span className="mr-2">{hasUppercase ? "✓" : "○"}</span>
                    At least one uppercase letter
                  </li>
                  <li className={`flex items-center ${hasLowercase ? "text-green-500" : "text-gray-400"}`}>
                    <span className="mr-2">{hasLowercase ? "✓" : "○"}</span>
                    At least one lowercase letter
                  </li>
                  <li className={`flex items-center ${hasNumber ? "text-green-500" : "text-gray-400"}`}>
                    <span className="mr-2">{hasNumber ? "✓" : "○"}</span>
                    At least one number
                  </li>
                  <li className={`flex items-center ${hasSpecialChar ? "text-green-500" : "text-gray-400"}`}>
                    <span className="mr-2">{hasSpecialChar ? "✓" : "○"}</span>
                    At least one special character
                  </li>
                  <li className={`flex items-center ${passwordsMatch && password ? "text-green-500" : "text-gray-400"}`}>
                    <span className="mr-2">{passwordsMatch && password ? "✓" : "○"}</span>
                    Passwords match
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <div className="w-full bg-[#2a2a2a] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      passwordStrength === 0
                        ? "w-0"
                        : passwordStrength === 1
                          ? "w-1/5 bg-red-500"
                          : passwordStrength === 2
                            ? "w-2/5 bg-orange-500"
                            : passwordStrength === 3
                              ? "w-3/5 bg-yellow-500"
                              : passwordStrength === 4
                                ? "w-4/5 bg-blue-500"
                                : "w-full bg-green-500"
                    }`}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {passwordStrength === 0
                    ? "Very Weak"
                    : passwordStrength === 1
                      ? "Weak"
                      : passwordStrength === 2
                        ? "Fair"
                        : passwordStrength === 3
                          ? "Good"
                          : passwordStrength === 4
                            ? "Strong"
                            : "Very Strong"}
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-[#ff7b26] hover:bg-[#e66c1e] text-white rounded-md font-medium transition-colors flex items-center justify-center"
              >
                Reset Password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}