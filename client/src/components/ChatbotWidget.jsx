import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, TicketCheck } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ── Markdown-aware message renderer ──────────────────────────────────────────
// Handles: numbered lists, bullet lists, bold (**text**), inline code, paragraphs
const MessageContent = ({ text }) => {
  const lines = text.split('\n').filter((l) => l.trim() !== '');

  const renderInline = (str) => {
    // Bold: **text**
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      // Inline code: `code`
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-white/10 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Numbered step: "Step 1:" or "1." or "1)"
    const stepMatch = line.match(/^(?:Step\s+)?(\d+)[.):\s]/i);
    if (stepMatch) {
      // Collect consecutive numbered items
      const items = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        const m = l.match(/^(?:Step\s+)?(\d+)[.):\s]/i);
        if (!m) break;
        items.push(l.replace(/^(?:Step\s+)?\d+[.):\s]+/i, '').trim());
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1.5 my-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 items-start">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/20 border border-primary/40 text-[10px] text-primary font-bold flex items-center justify-center mt-0.5">
                {idx + 1}
              </span>
              <span className="text-[12.5px] leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet: "- " or "• " or "* "
    if (/^[-•*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-•*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•*]\s/, '').trim());
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1 my-2 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 items-start">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60 mt-[6px]" />
              <span className="text-[12.5px] leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Heading-like line (all caps or ends with colon and short)
    if ((line === line.toUpperCase() && line.length < 60) || (line.endsWith(':') && line.length < 50 && !line.includes('.'))) {
      elements.push(
        <p key={`h-${i}`} className="text-[11px] font-bold text-primary/80 uppercase tracking-wider mt-2 mb-0.5">
          {line.replace(/:$/, '')}
        </p>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="text-[12.5px] leading-relaxed my-1">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
};

// ── Quick suggestion chips ────────────────────────────────────────────────────
const QUICK_CHIPS = [
  { label: 'My tickets', msg: 'How many tickets have I raised and what is their status?' },
  { label: 'Raise ticket', msg: 'How do I raise a support ticket?' },
  { label: 'Wi-Fi help', msg: 'My college Wi-Fi is not connecting, what should I do?' },
  { label: 'My profile', msg: 'What is my name, email and USN?' },
];

// ── Main Widget ───────────────────────────────────────────────────────────────
const ChatbotWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: user
        ? `Hi ${user.name?.split(' ')[0]}! 👋 I'm your AI HelpDesk assistant. I can help with technical issues, college queries, and answer questions about your account. What do you need help with?`
        : `Hi! 👋 I'm the Smart Helpdesk AI assistant. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ticketStats, setTicketStats] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch ticket stats when user is logged in
  useEffect(() => {
    if (user && isOpen && !ticketStats) {
      api.get('/tickets?limit=100').then((res) => {
        const tickets = res.data.tickets || [];
        setTicketStats({
          total: tickets.length,
          open: tickets.filter((t) => t.status === 'Open').length,
          inProgress: tickets.filter((t) => t.status === 'In Progress').length,
          escalated: tickets.filter((t) => t.status === 'Escalated').length,
          closed: tickets.filter((t) => t.status === 'Closed').length,
        });
      }).catch(() => {});
    }
  }, [user, isOpen, ticketStats]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const buildUserContext = () => {
    if (!user) return '';
    let ctx = `\n\n[LOGGED-IN USER CONTEXT]\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}`;
    if (user.usn) ctx += `\nUSN: ${user.usn}`;
    if (user.employeeId) ctx += `\nEmployee ID: ${user.employeeId}`;
    if (ticketStats) {
      ctx += `\nTicket Summary: Total=${ticketStats.total}, Open=${ticketStats.open}, In Progress=${ticketStats.inProgress}, Escalated=${ticketStats.escalated}, Closed=${ticketStats.closed}`;
    }
    ctx += `\n\nIf the user asks about their personal details (name, email, USN, employeeId), answer directly from the context above. If the user asks about ticket counts or statuses, use the Ticket Summary. Do NOT say you don't have access to this info — you do.`;
    return ctx;
  };

  const handleSend = async (msgOverride) => {
    const text = (msgOverride || input).trim();
    if (!text || isLoading) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await api.post('/ai/ask', {
        messages: newMessages,
        userContext: buildUserContext(),
      });
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting right now. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Show for everyone (guest gets limited info, logged-in gets full context)
  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-shadow flex items-center gap-2 pr-5"
          >
            <Bot size={22} />
            <span className="text-sm font-semibold">AI Help</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.92 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 w-full h-[92vh] md:h-[560px] md:w-[380px] flex flex-col overflow-hidden rounded-t-2xl md:rounded-2xl shadow-2xl border border-white/10 bg-[#0d0d18]"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight">AI HelpDesk Assistant</p>
                  <p className="text-[10px] text-blue-200">
                    {user ? `Logged in as ${user.name?.split(' ')[0]}` : 'SmartDesk AI'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mb-0.5">
                      <Bot size={12} />
                    </div>
                  )}
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-md'
                        : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <MessageContent text={msg.content} />
                    ) : (
                      <p className="text-[13px] leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading dots */}
              {isLoading && (
                <div className="flex justify-start items-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Bot size={12} />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick chips — only show on first message */}
            {messages.length === 1 && !isLoading && (
              <div className="px-3 pb-1 flex gap-2 flex-wrap">
                {QUICK_CHIPS.filter((c) => {
                  // hide personal chips for guests
                  if (!user && (c.msg.includes('tickets') || c.msg.includes('profile') || c.msg.includes('name'))) return false;
                  return true;
                }).map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleSend(chip.msg)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-gray-300 hover:bg-primary/15 hover:border-primary/40 hover:text-white transition-all"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Raise ticket shortcut for non-logged-in */}
            {!user && (
              <div className="px-4 pb-2">
                <a
                  href="/auth"
                  className="flex items-center gap-2 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <TicketCheck size={13} />
                  Login to raise a support ticket
                </a>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/10 bg-[#0a0a0f]/80 shrink-0">
              <div className="relative flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 pl-4 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white disabled:opacity-40 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-600 mt-1.5">
                Powered by Gemini AI • {user ? 'Personalized' : 'Guest'} mode
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
