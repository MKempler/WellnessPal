export interface ChatMessage {
  id: number;
  content: string;
  isFromUser: boolean;
  timestamp: Date;
}

export const sendChatMessage = async (content: string, firebaseUid: string): Promise<ChatMessage> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-firebase-uid': firebaseUid,
    },
    body: JSON.stringify({
      content,
      isFromUser: true,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
};

export const getDailySummary = async (firebaseUid: string): Promise<{ summary: string }> => {
  const response = await fetch('/api/summary/daily', {
    headers: {
      'x-firebase-uid': firebaseUid,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get daily summary');
  }

  return response.json();
};
