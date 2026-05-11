import { Link } from 'react-router-dom'
import LoginForm from '@/components/auth/LoginForm'



export default function Login() {
  return (
    <div className="h-screen flex items-center justify-center bg-black p-4 w-screen">
      <div className="w-full max-w-md space-y-8 p-8 rounded-xl shadow-lg sm:max-w-[425px] md:max-w-screen-md md:mx-auto backdrop-filter backdrop-blur-xl bg-[#181818]">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
          Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-200">
            Enter your credentials to access your account
          </p>
        </div>
        <LoginForm/>
        <div className="mt-4 text-center">
          <Link 
            to="/forgot-password" 
            className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
          >
            Forgot your password?
          </Link>
        </div>
        <div className="mt-4 text-center">
          <span className="text-sm text-white">
            Don't have an account?{' '}
          </span>
          <Link 
            to="/register" 
            className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}