import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Mic, Sparkles, Calendar, Target, TrendingUp, Heart } from "lucide-react";
import { auth } from "@/lib/firebase";
import { sendChatMessage, getDailySummary, type ChatMessage } from "@/lib/openai";
import { apiRequest } from "@/lib/queryClient";

const suggestedTopics = [
  { icon: Heart, title: "💪 Pain Management", subtitle: "Tips and strategies", prompt: "Can you help me with some pain management strategies?" },
  { icon: Target, title: "🧘 Mindfulness", subtitle: "Stress relief techniques", prompt: "I'd like to learn some mindfulness techniques for stress relief." },
  { icon: TrendingUp, title: "📊 Progress Review", subtitle: "Analyze your data", prompt: "Can you review my recent progress and give me insights?" },
  { icon: Calendar, title: "🎯 Goal Setting", subtitle: "Plan your journey", prompt: "Help me set some wellness goals for the coming week." },
];

export default function AICompanion() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    enabled: !!auth.currentUser,
  });

  const { data: dailySummary } = useQuery({
    queryKey: ["/api/summary/daily"],
    enabled: !!auth.currentUser,
    refetchInterval: 60000 * 60, // Refetch every hour
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      
      setIsTyping(true);
      
      // First save the user message
      await apiRequest("POST", "/api/chat", {
        content,
        isFromUser: true,
      });

      // Then get AI response  
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="space-y-6">
      {/* Mascot & Welcome */}
      <div className="bg-gradient-to-br from-primary/10 to-blue-100 rounded-2xl p-6 text-center border border-primary/20">
        <div className="w-24 h-24 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center animate-bounce">
          <Bot className="text-4xl text-primary h-12 w-12" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Meet Pal! 🤖</h2>
        <p className="text-gray-600 text-sm">
          Your personal wellness companion is here to listen, support, and help you on your journey.
        </p>
      </div>

      {/* Chat Interface */}
      <Card className="shadow-sm border-gray-100 overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-primary to-blue-500 text-white p-4 flex items-center">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
            <Bot className="text-white h-6 w-6" />
          </div>
          <div>
            <div className="font-medium">Pal</div>
            <div className="text-xs text-blue-100">Always here to help</div>
          </div>
          <div className="ml-auto">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <Bot className="text-primary h-4 w-4" />
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-3 max-w-xs">
                <p className="text-gray-800 text-sm">
                  Hi there! I'm Pal, your wellness companion. I'm here to help you track your pain and mood, and provide support along your wellness journey. How are you feeling today?
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start ${msg.isFromUser ? "justify-end" : ""}`}>
              {!msg.isFromUser && (
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <Bot className="text-primary h-4 w-4" />
                </div>
              )}
              <div className={`rounded-2xl p-3 max-w-xs ${
                msg.isFromUser 
                  ? "bg-primary text-white rounded-tr-sm" 
                  : "bg-gray-50 rounded-tl-sm"
              }`}>
                <p className={`text-sm ${msg.isFromUser ? "text-white" : "text-gray-800"}`}>
                  {msg.content}
                </p>
                <div className={`text-xs mt-1 ${
                  msg.isFromUser ? "text-blue-100" : "text-gray-500"
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <Bot className="text-primary h-4 w-4" />
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-end space-x-3">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 bg-blue-50 text-blue-400 border-blue-200 hover:bg-blue-100"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                rows={1}
                className="resize-none text-sm border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="icon"
              className="w-10 h-10 bg-primary text-white hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* AI Suggestions */}
      <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Sparkles className="text-primary mr-3 h-5 w-5" />
            Suggested Topics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {suggestedTopics.map((topic, index) => (
              <Button
                key={index}
                variant="outline"
                className="p-3 h-auto text-left hover:bg-primary/5 group border-gray-200"
                onClick={() => handleSuggestedTopic(topic.prompt)}
              >
                <div>
                  <div className="text-primary text-sm font-medium group-hover:text-primary">
                    {topic.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{topic.subtitle}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      {dailySummary?.summary && (
        <div className="bg-gradient-to-r from-green-50 to-primary/10 rounded-2xl p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Calendar className="text-green-500 mr-3 h-5 w-5" />
            Today's Summary
          </h3>
          <div className="text-sm text-gray-700 leading-relaxed">
            <p>{dailySummary.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
