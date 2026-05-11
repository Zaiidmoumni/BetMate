import "../App.css";
import BonusSection from "@/components/home/BonusSection";
import UpcomingMatches from "@/components/home/Upcoming";
import { useSelector } from "react-redux";

function Home() {
  const isAuth  = useSelector((state: any) => state.auth.isAuthenticated);
  return (
    <>
      <div className="w-full pl-[18rem] mt-16 p-6 ">
        {!isAuth && (<BonusSection />)}
        <UpcomingMatches />
      </div>
    </>
  );
}

export default Home;
