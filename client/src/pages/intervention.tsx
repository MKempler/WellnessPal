import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, ArrowLeft, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";
import type { Intervention, InterventionLog } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function InterventionPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [pain, setPain] = useState(0);
  const [notes, setNotes] = useState("");

  const { data: interventions = [] } = useQuery<Intervention[]>({
    queryKey: ["/api/interventions"],
    enabled: !!auth.currentUser,
  });
  const intervention = interventions.find((i) => i.id === Number(id));

  const { data: logs = [] } = useQuery<InterventionLog[]>({
    queryKey: [`/api/interventions/${id}/logs`],
    enabled: !!auth.currentUser,
  });

  const logMutation = useMutation({
    mutationFn: async (data: { painLevel: number; notes?: string }) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      return apiRequest("POST", `/api/interventions/${id}/logs`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/interventions/${id}/logs`] });
      queryClient.invalidateQueries({ queryKey: ["/api/interventions"] });
      setPain(0);
      setNotes("");
    },
  });

  const chartData = logs.slice(-7).map((log) => ({
    day: new Date(log.date).toLocaleDateString("en-US", { weekday: "short" }),
    pain: log.painLevel,
  }));

  return (
    <motion.div
      className="max-w-md mx-auto p-4 pb-24 space-y-6 bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-2 mb-2">
        <Link href="/" className="text-sm text-primary flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>
        <h2 className="text-lg font-semibold text-gray-800 flex-1 text-center">
          {intervention?.name || "Intervention"}
        </h2>
      </div>

      {intervention && (
        <div className="flex justify-between items-center px-2 text-sm text-gray-600">
          <div>{intervention.frequency}</div>
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-primary" />
            <span className="font-semibold text-gray-800">{intervention.currentStreak}</span>
            <span>day streak</span>
          </div>
        </div>
      )}

      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pain Level (1-10)
            </label>
            <div className="flex gap-2 justify-between">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <Button
                  key={num}
                  variant={pain === num ? "default" : "outline"}
                  size="sm"
                  className={`w-8 h-8 rounded-full text-sm font-medium ${
                    pain === num
                      ? "bg-primary text-white border-primary"
                      : "border-gray-200 hover:border-primary hover:bg-primary hover:text-white"
                  }`}
                  onClick={() => setPain(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <Button
            onClick={() => logMutation.mutate({ painLevel: pain, notes: notes.trim() || undefined })}
            disabled={logMutation.isPending}
            className="w-full bg-primary text-white hover:bg-primary/90"
          >
            <Heart className="mr-2 h-4 w-4" />
            {logMutation.isPending ? "Logging..." : "Log Entry"}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-4">
          <h3 className="text-md font-semibold mb-2">Recent Logs</h3>
          <div className="h-48">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="pain" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No logs yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-md font-semibold">Log History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="p-2 bg-white rounded-xl border border-gray-100">
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>{new Date(log.date).toLocaleDateString()}</span>
                    <span>{log.painLevel}/10</span>
                  </div>
                  {log.notes && <div className="text-xs text-gray-500 mt-1">{log.notes}</div>}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No entries yet. Start logging!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
