import { Link } from "react-router-dom";

export default function BonusSection() {
  return (
    <div className="w-full relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-r from-orange-500 to-orange-600 min-h-[200px]">
      {" "}
      <div className="relative z-10 p-8">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome Bonus</h2>
        <p className="text-orange-100 mb-4">
          Get 100% bonus on your first deposit!
        </p>
        <Link to={"/register"}>
          <button className="bg-white text-orange-600 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors">
            Claim Now
          </button>
        </Link>
      </div>
      <div className="absolute right-0 top-0 h-full w-1/3 bg-orange-400/20" />
    </div>
  );
}
