import { Heart, Smile, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DesktopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DesktopNavigation({ activeTab, onTabChange }: DesktopNavigationProps) {
  const tabs = [
    { id: "pain", label: "Pain", icon: Heart },
    { id: "mood", label: "Mood", icon: Smile },
    { id: "ai", label: "AI Pal", icon: Bot },
  ];

  return (
    <nav className="hidden md:flex flex-col w-56 p-4 bg-white border-r border-gray-200 space-y-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <Button
            key={tab.id}
            variant="ghost"
            className={`justify-start px-4 py-3 rounded-xl text-sm transition-all ${
              isActive
                ? "text-primary bg-primary/10"
                : "text-gray-600 hover:text-primary hover:bg-primary/5"
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon className="h-5 w-5 mr-3" />
            {tab.label}
          </Button>
        );
      })}
    </nav>
  );
}
