import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { logOut } from "@/lib/firebase";
import { User, LogOut, Sun, Heart, Sparkles } from "lucide-react";
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
  const calculateStreak = () => {
    if (painLogs.length === 0) return 0;
    const dates = new Set(
      painLogs.map((log) => new Date(log.date).toDateString())
    );
    let streak = 0;
    const day = new Date();
    // iterate backwards from today
    while (dates.has(day.toDateString())) {
      streak += 1;
      day.setDate(day.getDate() - 1);
    }
    return streak;
  };
  const currentStreak = calculateStreak();
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
    <div className="max-w-md mx-auto bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen shadow-2xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-orange-200 to-amber-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-32 right-8 w-12 h-12 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full opacity-30 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-6 w-16 h-16 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 text-white p-6 rounded-b-3xl shadow-lg"
      >
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse-gentle"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className="text-white h-6 w-6" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                  PainPal
                </h1>
                <p className="text-orange-100 text-sm">
                  Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'friend'}!
                </p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 bg-white/20 rounded-full hover:bg-white/30 transition-all duration-300 warm-glow"
              onClick={handleLogout}
            >
              <LogOut className="text-white h-5 w-5" />
            </Button>
          </motion.div>
        </div>
        
        {/* Enhanced Stats Cards */}
        <motion.div 
          className="flex gap-3 mt-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <motion.div 
            className="flex-1 glass-morphism rounded-2xl p-4 backdrop-blur-sm"
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
              <div className="text-2xl font-bold text-white">{currentStreak}</div>
            </div>
            <div className="text-xs text-orange-100 mt-1">Day Streak</div>
          </motion.div>
          
          <motion.div 
            className="flex-1 glass-morphism rounded-2xl p-4 backdrop-blur-sm"
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-white animate-pulse" />
              <div className="text-2xl font-bold text-white">{avgPain}</div>
            </div>
            <div className="text-xs text-orange-100 mt-1">Avg Pain</div>
          </motion.div>
          
          <motion.div 
            className="flex-1 glass-morphism rounded-2xl p-4 backdrop-blur-sm"
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4 text-white animate-pulse" />
              <div className="text-2xl font-bold text-white">{todayMood}</div>
            </div>
            <div className="text-xs text-orange-100 mt-1">Mood</div>
          </motion.div>
        </motion.div>
      </motion.header>

      {/* Main Content */}
      <motion.main 
        className="relative z-10 p-6 pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        {renderTabContent()}
      </motion.main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
