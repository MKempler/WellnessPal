import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Mic, Sparkles, Calendar, Target, TrendingUp, Heart, Star, Zap, Coffee, Sun } from "lucide-react";
import { auth } from "@/lib/firebase";
import type { ChatMessage } from "@/lib/openai";
import { apiRequest } from "@/lib/queryClient";

const suggestedTopics = [
  { icon: Heart, title: "Pain Relief", subtitle: "Gentle strategies", prompt: "Can you help me with some pain management strategies?", color: "from-red-300 to-pink-300" },
  { icon: Coffee, title: "Mindfulness", subtitle: "Peaceful moments", prompt: "I'd like to learn some mindfulness techniques for stress relief.", color: "from-green-300 to-emerald-300" },
  { icon: TrendingUp, title: "Progress Check", subtitle: "Your journey", prompt: "Can you review my recent progress and give me insights?", color: "from-blue-300 to-indigo-300" },
  { icon: Star, title: "Goal Setting", subtitle: "Dream big", prompt: "Help me set some wellness goals for the coming week.", color: "from-purple-300 to-violet-300" },
];

export default function AICompanion() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    enabled: !!auth.currentUser,
  });

  const { data: dailySummary } = useQuery<{ summary: string }>({
    queryKey: ["/api/summary/daily"],
    enabled: !!auth.currentUser,
    refetchInterval: 60000 * 60,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      
      setIsTyping(true);
      
      const response = await apiRequest("POST", "/api/chat", {
        content,
        isFromUser: true,
      });

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setMessage("");
      setIsTyping(false);
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleSuggestedTopic = (prompt: string) => {
    setMessage(prompt);
    sendMessageMutation.mutate(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMicClick = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      toast({ title: "Voice input not supported", variant: "destructive" });
      return;
    }
    if (isListening) {
      rec.stop();
      setIsListening(false);
    } else {
      try {
        rec.start();
        setIsListening(true);
      } catch {
        // ignore errors when starting twice
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Mascot & Welcome */}
      <motion.div 
        className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl p-8 text-center border-2 border-orange-200 shadow-xl relative overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* Background decorations */}
        <div className="absolute top-4 left-4 w-6 h-6 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute top-8 right-6 w-4 h-4 bg-gradient-to-br from-pink-300 to-red-300 rounded-full opacity-50 animate-bounce"></div>
        <div className="absolute bottom-6 left-8 w-5 h-5 bg-gradient-to-br from-green-300 to-emerald-300 rounded-full opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>

        {/* Cute Mascot */}
        <motion.div 
          className="relative mx-auto mb-6"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-orange-300 to-amber-400 rounded-full flex items-center justify-center mascot-shadow animate-float relative">
            {/* Mascot face */}
            <div className="relative">
              <Bot className="text-white h-16 w-16 animate-pulse-gentle" />
              
              {/* Eyes */}
              <div className="absolute -top-1 left-3 flex space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              </div>
              
              {/* Sparkles around mascot */}
              <Sparkles className="absolute -top-4 -right-4 h-4 w-4 text-yellow-400 animate-bounce" />
              <Zap className="absolute -bottom-2 -left-4 h-3 w-3 text-blue-400 animate-pulse" />
            </div>
          </div>
          
          {/* Floating hearts */}
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ y: [-5, -15, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Heart className="h-6 w-6 text-pink-400" />
          </motion.div>
        </motion.div>

        <motion.h2 
          className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Meet Pal!
        </motion.h2>
        
        <motion.p 
          className="text-orange-700 text-base leading-relaxed font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Your cheerful wellness companion is here to brighten your day, listen with care, and support you every step of the way!
        </motion.p>
      </motion.div>

      {/* Chat Interface */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <Card className="shadow-2xl border-2 border-orange-200 overflow-hidden rounded-3xl">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 text-white p-6 flex items-center">
            <motion.div 
              className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 animate-pulse-gentle"
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              <Bot className="text-white h-7 w-7" />
            </motion.div>
            <div className="flex-1">
              <div className="font-bold text-lg">Pal</div>
              <div className="text-sm text-orange-100 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Ready to chat
              </div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="h-6 w-6 text-yellow-200" />
            </motion.div>
          </div>

          {/* Chat Messages */}
          <div className="max-h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-orange-25 to-amber-25">
            <AnimatePresence>
              {messages.length === 0 && (
                <motion.div 
                  className="flex items-start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-br from-orange-300 to-amber-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0 mascot-shadow"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Bot className="text-white h-5 w-5" />
                  </motion.div>
                  <div className="bg-white rounded-3xl rounded-tl-lg p-4 max-w-xs shadow-lg border-2 border-orange-100">
                    <p className="text-orange-800 text-sm font-medium leading-relaxed">
                      Hi there! I'm Pal, your cheerful wellness companion! I'm here to brighten your day, listen to your concerns, and provide warm support on your wellness journey. How are you feeling today?
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.map((msg) => (
              <motion.div 
                key={msg.id} 
                className={`flex items-start ${msg.isFromUser ? "justify-end" : ""}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {!msg.isFromUser && (
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-300 to-amber-400 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mascot-shadow">
                    <Bot className="text-white h-4 w-4" />
                  </div>
                )}
                <div className={`rounded-3xl p-4 max-w-xs shadow-lg ${
                  msg.isFromUser 
                    ? "bg-gradient-to-br from-orange-400 to-amber-400 text-white rounded-tr-lg border-2 border-orange-300" 
                    : "bg-white rounded-tl-lg border-2 border-orange-100"
                }`}>
                  <p className={`text-sm font-medium ${msg.isFromUser ? "text-white" : "text-orange-800"}`}>
                    {msg.content}
                  </p>
                  <div className={`text-xs mt-2 ${
                    msg.isFromUser ? "text-orange-100" : "text-orange-500"
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div 
                className="flex items-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-300 to-amber-400 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mascot-shadow">
                  <Bot className="text-white h-4 w-4" />
                </div>
                <div className="bg-white rounded-3xl rounded-tl-lg p-4 shadow-lg border-2 border-orange-100">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-6 border-t-2 border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-end space-x-4">
              <Button
                onClick={handleMicClick}
                variant="outline"
                size="icon"
                className={`w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-500 border-2 border-blue-200 rounded-2xl ${isListening ? "animate-pulse" : "hover:from-blue-200 hover:to-indigo-200"}`}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share what's on your mind..."
                  rows={1}
                  className="resize-none text-sm border-2 border-orange-200 focus:ring-2 focus:ring-orange-300 focus:border-orange-300 rounded-2xl bg-white"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="icon"
                className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 text-white hover:from-orange-500 hover:to-amber-500 rounded-2xl shadow-lg"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* AI Suggestions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <Card className="shadow-xl border-2 border-orange-200 rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-6 flex items-center">
              <Sparkles className="text-orange-400 mr-3 h-6 w-6 animate-pulse" />
              Chat Starters
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {suggestedTopics.map((topic, index) => {
                const Icon = topic.icon;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className={`p-4 h-auto text-left hover:shadow-lg group border-2 border-orange-200 bg-gradient-to-br ${topic.color} hover:from-orange-100 hover:to-amber-100 rounded-2xl transition-all duration-300`}
                      onClick={() => handleSuggestedTopic(topic.prompt)}
                    >
                      <div className="w-full">
                        <div className="flex items-center mb-2">
                          <Icon className="h-5 w-5 text-orange-600 mr-2" />
                          <div className="text-orange-800 font-bold text-sm">
                            {topic.title}
                          </div>
                        </div>
                        <div className="text-xs text-orange-600 opacity-80">{topic.subtitle}</div>
                      </div>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Summary */}
      {dailySummary && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl p-6 border-2 border-green-200 shadow-xl"
        >
          <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4 flex items-center">
            <Sun className="text-green-500 mr-3 h-6 w-6 animate-pulse" />
            Today's Wellness Summary
          </h3>
          <div className="text-base text-green-800 leading-relaxed font-medium">
            <p>{dailySummary.summary}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}