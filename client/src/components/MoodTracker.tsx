import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Smile, Heart, TrendingUp, Lightbulb } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";
import type { MoodLog } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

const moodEmojis = [
  { value: 1, emoji: "😢", label: "very-sad" },
  { value: 2, emoji: "😔", label: "sad" },
  { value: 3, emoji: "😐", label: "neutral" },
  { value: 4, emoji: "😊", label: "happy" },
  { value: 5, emoji: "😄", label: "very-happy" },
];

const commonTriggers = ["Work", "Pain", "Family", "Sleep", "Weather"];
const commonHelpers = ["Exercise", "Meditation", "Friends", "Music", "Nature"];

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number>(0);
  const [anxietyLevel, setAnxietyLevel] = useState<number[]>([3]);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [selectedHelpers, setSelectedHelpers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: moodLogs = [] } = useQuery<MoodLog[]>({
    queryKey: ["/api/mood-logs"],
    enabled: !!auth.currentUser,
  });

  const logMoodMutation = useMutation({
    mutationFn: async (data: { 
      mood: number; 
      anxietyLevel: number; 
      triggers: string[];
      helpers: string[];
      notes?: string;
    }) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      return apiRequest("POST", "/api/mood-logs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood-logs"] });
      setSelectedMood(0);
      setAnxietyLevel([3]);
      setSelectedTriggers([]);
      setSelectedHelpers([]);
      setNotes("");
      toast({
        title: "Mood logged successfully",
        description: "Your mood entry has been recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogMood = () => {
    if (selectedMood === 0) {
      toast({
        title: "Please select your mood",
        description: "Choose how you're feeling today before logging.",
        variant: "destructive",
      });
      return;
    }

    logMoodMutation.mutate({
      mood: selectedMood,
      anxietyLevel: anxietyLevel[0],
      triggers: selectedTriggers,
      helpers: selectedHelpers,
      notes: notes.trim() || undefined,
    });
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev => 
      prev.includes(trigger) 
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  const toggleHelper = (helper: string) => {
    setSelectedHelpers(prev => 
      prev.includes(helper) 
        ? prev.filter(h => h !== helper)
        : [...prev, helper]
    );
  };

  const chartData = moodLogs.slice(-7).map((log, index) => ({
    day: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
    mood: log.mood,
    anxiety: log.anxietyLevel,
  }));

  return (
    <div className="space-y-6">
      {/* Today's Mood Log */}
      <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Smile className="text-pink-400 mr-3 h-5 w-5" />
            How are you feeling today?
          </h2>
          
          {/* Mood Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Overall Mood</label>
            <div className="flex gap-4 justify-center">
              {moodEmojis.map((mood) => (
                <Button
                  key={mood.value}
                  variant="ghost"
                  className={`text-4xl p-2 rounded-xl hover:bg-gray-50 transition-all ${
                    selectedMood === mood.value ? "bg-primary/10 scale-110" : ""
                  }`}
                  onClick={() => setSelectedMood(mood.value)}
                >
                  {mood.emoji}
                </Button>
              ))}
            </div>
          </div>

          {/* Anxiety Level */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Anxiety Level: {anxietyLevel[0]}
            </label>
            <Slider
              value={anxietyLevel}
              onValueChange={setAnxietyLevel}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Calm</span>
              <span>Anxious</span>
            </div>
          </div>

          {/* Triggers */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What triggered these feelings? (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {commonTriggers.map((trigger) => (
                <Button
                  key={trigger}
                  variant="outline"
                  size="sm"
                  className={`rounded-full text-sm ${
                    selectedTriggers.includes(trigger)
                      ? "bg-primary text-white border-primary"
                      : "bg-gray-100 text-gray-700 hover:bg-primary hover:text-white"
                  }`}
                  onClick={() => toggleTrigger(trigger)}
                >
                  {trigger}
                </Button>
              ))}
            </div>
          </div>

          {/* What Helped */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">What helped today?</label>
            <div className="flex flex-wrap gap-2">
              {commonHelpers.map((helper) => (
                <Button
                  key={helper}
                  variant="outline"
                  size="sm"
                  className={`rounded-full text-sm ${
                    selectedHelpers.includes(helper)
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-gray-100 text-gray-700 hover:bg-green-500 hover:text-white"
                  }`}
                  onClick={() => toggleHelper(helper)}
                >
                  {helper}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other thoughts or observations about your mood today?"
              rows={3}
              className="w-full border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <Button 
            onClick={handleLogMood}
            disabled={logMoodMutation.isPending}
            className="w-full bg-pink-400 text-white hover:bg-pink-500"
          >
            <Heart className="mr-2 h-4 w-4" />
            {logMoodMutation.isPending ? "Logging..." : "Log Mood Entry"}
          </Button>
        </CardContent>
      </Card>

      {/* Mood History Chart */}
      <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="text-pink-400 mr-3 h-5 w-5" />
            Mood & Anxiety Trends
          </h3>
          <div className="h-48">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#FFB5BA" 
                    strokeWidth={2}
                    name="Mood"
                    dot={{ fill: "#FFB5BA" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="anxiety" 
                    stroke="#9BB5FF" 
                    strokeWidth={2}
                    name="Anxiety"
                    dot={{ fill: "#9BB5FF" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Start logging mood to see your trends
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Insights */}
      <div className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-2xl p-6 border border-pink-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <Lightbulb className="text-pink-400 mr-3 h-5 w-5" />
          Your Insights
        </h3>
        <div className="space-y-3">
          {moodLogs.length < 3 ? (
            <p className="text-gray-600 text-sm">
              Keep logging your mood for a few more days to get personalized insights!
            </p>
          ) : (
            <>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-700 text-sm">
                  You've been consistent with tracking - that's the first step to understanding your patterns!
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-700 text-sm">
                  Consider noting what specific activities or situations correlate with your mood changes.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
