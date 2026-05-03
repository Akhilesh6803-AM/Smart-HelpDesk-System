import { useState, useEffect } from 'react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import Spinner from './Spinner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Calendar, Tag, User, Bot, ShieldCheck, CheckCircle, AlertTriangle, Send, ArrowUpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_AI_ATTEMPTS = 4;

const TicketModal = ({ ticket: initialTicket, isOpen, onClose, onTicketUpdate }) => {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(initialTicket);
  const [followUpMessage, setFollowUpMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(''); // 'resolve' | 'escalate'
  const [staffReply, setStaffReply] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // Sync local ticket state whenever the parent passes a new/updated ticket
  // (e.g. when modal is opened for a different ticket, or parent list is refreshed)
  useEffect(() => {
    if (initialTicket) {
      setTicket(initialTicket);
      setFollowUpMessage('');
      setStaffReply('');
    }
  }, [initialTicket]);

  if (!ticket) return null;

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: 'numeric',
    });

  const isClosed = ticket.status === 'Closed' || ticket.status === 'Escalated';
  // AI can still chat if: aiActive is true AND ticket isn't closed AND attempts are below max
  const attemptsLeft = MAX_AI_ATTEMPTS - (ticket.aiAttempts || 0);
  const canAIChat = ticket.aiActive && !isClosed && attemptsLeft > 0;
  const hasConversation = ticket.conversation && ticket.conversation.length > 0;

  // Always use toString() — ticket.userId._id may be a MongoDB ObjectId object (not a plain string)
  const ticketOwnerId = typeof ticket.userId === 'object'
    ? ticket.userId._id?.toString()
    : ticket.userId?.toString();
  const isOwner = user?._id?.toString() === ticketOwnerId;
  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin';

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleResolve = async () => {
    setActionLoading('resolve');
    try {
      const res = await api.patch(`/tickets/${ticket._id}/resolve`);
      const updated = res.data.ticket;
      setTicket(updated);
      onTicketUpdate?.(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading('');
    }
  };

  const handleEscalate = async () => {
    setActionLoading('escalate');
    try {
      const res = await api.patch(`/tickets/${ticket._id}/escalate`);
      const updated = res.data.ticket;
      setTicket(updated);
      onTicketUpdate?.(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading('');
    }
  };

  const handleFollowUp = async () => {
    if (!followUpMessage.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/tickets/${ticket._id}/chat`, { message: followUpMessage });
      const updated = res.data.ticket;
      setTicket(updated);
      onTicketUpdate?.(updated);
      setFollowUpMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffReply = async () => {
    if (!staffReply.trim()) return;
    setActionLoading('reply');
    try {
      const res = await api.patch(`/tickets/${ticket._id}/reply`, { adminResponse: staffReply });
      const updated = res.data.ticket;
      setTicket(updated);
      onTicketUpdate?.(updated);
      setStaffReply('');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading('');
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusUpdateLoading(true);
    try {
      const res = await api.patch(`/tickets/${ticket._id}/status`, { status: newStatus });
      const updated = res.data.ticket;
      setTicket(updated);
      onTicketUpdate?.(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ticket Details">
      <div className="space-y-5">

        {/* Header */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-3">{ticket.title}</h3>
          <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-4">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
              <Calendar size={13} />
              <span>{formatDate(ticket.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <User size={15} />
            <span>Your Description</span>
          </div>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* ── AI Conversation Thread ── */}
        {hasConversation && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Bot size={16} />
              <span>AI Support Thread</span>
              <span className="ml-auto text-xs text-gray-500 font-normal">
                {ticket.aiAttempts}/{MAX_AI_ATTEMPTS} AI responses used
                {attemptsLeft > 0 && !isClosed && (
                  <span className="ml-1 text-primary">({attemptsLeft} left)</span>
                )}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${(ticket.aiAttempts / MAX_AI_ATTEMPTS) * 100}%` }}
              />
            </div>

            {/* Messages — skip index 0 (initial user description, shown above already) */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {ticket.conversation.slice(1).map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-xl p-3.5 text-sm ${
                    msg.role === 'ai'
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span className={`text-xs font-semibold block mb-1.5 ${msg.role === 'ai' ? 'text-primary' : 'text-gray-400'}`}>
                    {msg.role === 'ai' ? '🤖 AI Assistant' : '👤 You'}
                  </span>
                  <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Resolution Panel (Only for Ticket Owner) ── */}
        <AnimatePresence>
          {!isClosed && isOwner && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-white/10 bg-white/3 p-4 space-y-3"
            >
              <p className="text-sm font-medium text-white text-center">
                Did the AI solution resolve your issue?
              </p>

              <div className="flex gap-3">
                {/* YES → Close ticket */}
                <button
                  onClick={handleResolve}
                  disabled={!!actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {actionLoading === 'resolve' ? <Spinner size="sm" /> : <CheckCircle size={16} />}
                  Yes, Close Ticket
                </button>

                {/* NO → Escalate or Follow Up */}
                <button
                  onClick={handleEscalate}
                  disabled={!!actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {actionLoading === 'escalate' ? <Spinner size="sm" /> : <ArrowUpCircle size={16} />}
                  No, Escalate to Admin
                </button>
              </div>

              {/* Follow-up AI chat input (while AI attempts remain) */}
              {canAIChat && (
                <div className="pt-1">
                  <p className="text-xs text-gray-500 mb-2 text-center">
                    Or ask the AI a follow-up question ({attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left)
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={followUpMessage}
                      onChange={e => setFollowUpMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleFollowUp()}
                      placeholder="Describe what didn't work..."
                      className="flex-1 input-field text-sm py-2"
                      disabled={loading}
                    />
                    <button
                      onClick={handleFollowUp}
                      disabled={loading || !followUpMessage.trim()}
                      className="px-3 py-2 btn-primary text-sm disabled:opacity-50"
                    >
                      {loading ? <Spinner size="sm" /> : <Send size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {/* AI limit reached but not escalated yet */}
              {!canAIChat && !isClosed && (
                <p className="text-xs text-amber-400/80 text-center bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  AI has reached the maximum response limit. Please escalate to an admin for further help.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Staff/Admin Control Panel ── */}
        {isStaffOrAdmin && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-indigo-400">
                <ShieldCheck size={16} />
                <span>Staff Controls</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Update Status:</span>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={statusUpdateLoading}
                  className="bg-black/40 border border-white/10 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                value={staffReply}
                onChange={(e) => setStaffReply(e.target.value)}
                placeholder="Type a response to the student..."
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white placeholder-gray-500 min-h-[80px] focus:outline-none focus:border-indigo-500/50"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleStaffReply}
                  disabled={!!actionLoading || !staffReply.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === 'reply' ? <Spinner size="sm" /> : <Send size={14} />}
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Escalated Status Banner ── */}
        {ticket.status === 'Escalated' && (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Escalated to Admin Team</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Your ticket has been escalated. An admin will review and respond soon.
              </p>
            </div>
          </div>
        )}

        {/* ── Closed Status Banner ── */}
        {ticket.status === 'Closed' && (
          <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">Ticket Resolved & Closed</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">
                Great! We are glad your issue was resolved.
              </p>
            </div>
          </div>
        )}

        {/* Admin Response */}
        {ticket.adminResponse && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-green-400 mb-2">
              <ShieldCheck size={16} />
              <span>Admin Response</span>
            </div>
            <p className="text-gray-200 text-sm whitespace-pre-wrap">{ticket.adminResponse}</p>
          </div>
        )}

        {/* Meta Footer */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-white/5">
          <Tag size={13} />
          <span>Category: {ticket.category}</span>
        </div>
      </div>
    </Modal>
  );
};

export default TicketModal;
