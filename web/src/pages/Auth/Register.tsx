import { Link } from "react-router-dom";
import RegisterForm from "@/components/auth/RegisterForm";


export default function Login() {
  return (
    <div className="h-screen flex items-center justify-center bg-black p-4 w-screen">
      <div className="w-full max-w-md space-y-8 p-8 rounded-xl shadow-lg sm:max-w-[425px] md:max-w-screen-md md:mx-auto backdrop-filter backdrop-blur-xl bg-[#181818] ">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            Get started now
          </h2>
          <p className="mt-2 text-sm text-gray-200">
          Join the community and start your adventure today!
          </p>
        </div>
        <RegisterForm/>
        <div className="mt-4 text-center">
          <span className="text-sm text-white">
            Already have an account?{' '}
          </span>
          <Link 
            to="/login" 
            className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
          >
            Login now
          </Link>
        </div>
      </div>
    </div>
  );
}
