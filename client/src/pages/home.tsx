import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { logOut } from "@/lib/firebase";
import { User, LogOut } from "lucide-react";
import PainTracker from "@/components/PainTracker";
import MoodTracker from "@/components/MoodTracker";
import AICompanion from "@/components/AICompanion";
import BottomNavigation from "@/components/BottomNavigation";
import type { PainLog, MoodLog } from "@shared/schema";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("pain");
  const { user } = useAuth();

  const { data: painLogs = [] } = useQuery<PainLog[]>({
    queryKey: ["/api/pain-logs"],
    enabled: !!user,
  });

  const { data: moodLogs = [] } = useQuery<MoodLog[]>({
    queryKey: ["/api/mood-logs"],
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Calculate stats
  const currentStreak = 7; // TODO: Calculate actual streak
  const avgPain = painLogs.length > 0 
    ? (painLogs.slice(0, 7).reduce((sum, log) => sum + log.painLevel, 0) / Math.min(painLogs.length, 7)).toFixed(1)
    : "0";
  const todayMood = moodLogs.length > 0 
    ? ["😢", "😔", "😐", "😊", "😄"][moodLogs[0].mood - 1] || "😐"
    : "😐";

  const renderTabContent = () => {
    switch (activeTab) {
      case "pain":
        return <PainTracker />;
      case "mood":
        return <MoodTracker />;
      case "ai":
        return <AICompanion />;
      default:
        return <PainTracker />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-blue-500 text-white p-6 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">PainPal</h1>
            <p className="text-blue-100">
              Hi, {user?.displayName || user?.email?.split('@')[0] || 'there'}! 👋
            </p>
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 bg-white/20 rounded-full hover:bg-white/30"
              onClick={handleLogout}
            >
              <LogOut className="text-white h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-4 mt-6">
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-2xl font-bold">{currentStreak}</div>
            <div className="text-xs text-blue-100">Day Streak</div>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-2xl font-bold">{avgPain}</div>
            <div className="text-xs text-blue-100">Avg Pain</div>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-2xl font-bold">{todayMood}</div>
            <div className="text-xs text-blue-100">Today</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 pb-24">
        {renderTabContent()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
