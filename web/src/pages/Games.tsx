import FilterBar from "@/components/games/FilterBar";
import { useState } from "react";
import MatchCardUpcoming from "@/components/games/UpcomingMatchCard";

function GamesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  
  return (
    <div className="w-full pl-[18rem] mt-16 p-6">
      <FilterBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedLeague={selectedLeague}
        setSelectedLeague={setSelectedLeague}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      
      <div className="space-y-4">
        <MatchCardUpcoming 
          activeTab={activeTab}
          selectedLeague={selectedLeague}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}

export default GamesPage;