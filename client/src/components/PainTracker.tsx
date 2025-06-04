import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Heart, Plus, TrendingUp, Activity, Zap, Star, Sun, Coffee, Flower } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";
import type { PainLog, Intervention } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function PainTracker() {
  const [selectedPain, setSelectedPain] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: painLogs = [] } = useQuery<PainLog[]>({
    queryKey: ["/api/pain-logs"],
    enabled: !!auth.currentUser,
  });

  const { data: interventions = [] } = useQuery<Intervention[]>({
    queryKey: ["/api/interventions"],
    enabled: !!auth.currentUser,
  });

  const logPainMutation = useMutation({
    mutationFn: async (data: { painLevel: number; notes?: string }) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      return apiRequest("POST", "/api/pain-logs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pain-logs"] });
      setSelectedPain(0);
      setNotes("");
      toast({
        title: "Pain logged successfully",
        description: "Your pain entry has been recorded.",
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

  const addInterventionMutation = useMutation({
    mutationFn: async (data: { name: string; frequency: string }) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      return apiRequest("POST", "/api/interventions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
      toast({
        title: "Intervention added",
        description: "New intervention has been added to your tracker.",
      });
    },
  });

  const handleLogPain = () => {
    if (selectedPain === 0) {
      toast({
        title: "Please select pain level",
        description: "Choose a pain level from 1-10 before logging.",
        variant: "destructive",
      });
      return;
    }

    logPainMutation.mutate({
      painLevel: selectedPain,
      notes: notes.trim() || undefined,
    });
  };

  const handleAddIntervention = () => {
    const name = prompt("Enter intervention name:");
    const frequency = prompt("Enter frequency (e.g., 'Daily', '3x per week'):");
    
    if (name && frequency) {
      addInterventionMutation.mutate({ name, frequency });
    }
  };

  const chartData = painLogs.slice(-7).map((log, index) => ({
    day: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
    pain: log.painLevel,
  }));

  return (
    <div className="space-y-6">
      {/* Today's Pain Log */}
      <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Heart className="text-primary mr-3 h-5 w-5" />
            Log Today's Pain
          </h2>
          
          {/* Pain Scale */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Pain Level (1-10)</label>
            <div className="flex gap-2 justify-between">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <Button
                  key={num}
                  variant={selectedPain === num ? "default" : "outline"}
                  size="sm"
                  className={`w-8 h-8 rounded-full text-sm font-medium ${
                    selectedPain === num 
                      ? "bg-primary text-white border-primary" 
                      : "border-gray-200 hover:border-primary hover:bg-primary hover:text-white"
                  }`}
                  onClick={() => setSelectedPain(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>No pain</span>
              <span>Severe</span>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling? What's different today?"
              rows={3}
              className="w-full border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <Button 
            onClick={handleLogPain}
            disabled={logPainMutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {logPainMutation.isPending ? "Logging..." : "Log Pain Entry"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Interventions */}
      <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Activity className="text-green-500 mr-3 h-5 w-5" />
              Active Interventions
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="w-8 h-8 rounded-full p-0 border-primary text-primary hover:bg-primary hover:text-white"
              onClick={handleAddIntervention}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {interventions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No interventions yet. Add one to start tracking!
              </p>
            ) : (
              interventions.map((intervention) => (
                <div key={intervention.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <div className="font-medium text-gray-800">{intervention.name}</div>
                      <div className="text-sm text-gray-500">{intervention.frequency}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-800">{intervention.currentStreak} days</div>
                    <div className="text-xs text-gray-500">streak</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pain History Chart */}
      <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="text-primary mr-3 h-5 w-5" />
            Pain Trends (Last 7 Days)
          </h3>
          <div className="h-48">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="pain" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Start logging pain to see your trends
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
