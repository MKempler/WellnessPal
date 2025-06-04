import { Heart, Smile, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: "pain", label: "Pain", icon: Heart },
    { id: "mood", label: "Mood", icon: Smile },
    { id: "ai", label: "AI Pal", icon: Bot },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4 z-50">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-xl transition-all ${
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-gray-500 hover:text-primary hover:bg-primary/5"
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
