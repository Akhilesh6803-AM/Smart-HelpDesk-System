import { motion } from 'framer-motion';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { Calendar, Tag } from 'lucide-react';

const TicketCard = ({ ticket, onClick }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="glass-card-hover glass-card p-5 cursor-pointer transition-shadow"
    >
      <div className="flex justify-between items-start mb-3 gap-4">
        <h3 className="text-lg font-semibold text-white line-clamp-1 flex-1">
          {ticket.title}
        </h3>
        <div className="flex gap-2 shrink-0">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>
      
      <p className="text-sm text-gray-400 line-clamp-2 mb-4 h-10">
        {ticket.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-400 border-t border-white/5 pt-3">
        <div className="flex items-center gap-1.5">
          <Tag size={14} />
          <span>{ticket.category}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={14} />
          <span>{formatDate(ticket.createdAt)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TicketCard;
