export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
}

export const initialChatMessages: ChatMessage[] = [
  {
    id: '1',
    sender: 'bot',
    message: 'Hi User 👋',
    timestamp: '11:31 AM',
  },
  {
    id: '2',
    sender: 'bot',
    message: 'How may I help you today?',
    timestamp: '11:31 AM',
  },
  {
    id: '3',
    sender: 'user',
    message: 'Can you help me connect my CGM?',
    timestamp: '11:35 AM',
  },
  {
    id: '4',
    sender: 'bot',
    message: 'Sure, I would love to! Please follow my instructions.',
    timestamp: '11:31 AM',
  },
];

export const botResponses = [
  'I understand. Let me help you with that.',
  'That\'s a great question! Here\'s what I can tell you...',
  'I\'m here to assist you with your diabetes management.',
  'Based on your question, I recommend consulting with your healthcare provider.',
  'Let me provide you with some information about that.',
  'I can help you track your glucose levels and provide insights.',
  'That\'s important for managing your health. Here\'s what you should know...',
  'I\'m processing your request. One moment please.',
];
