import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../utils/api';
import TicketCard from '../components/TicketCard';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import CreateTicketForm from '../components/CreateTicketForm';
import TicketModal from '../components/TicketModal';
import { Plus, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const categories = [
  'All',
  'Technical Issues',
  'Academic Issues',
  'Project & Documentation',
  'Administrative Issues',
  'Facility & Campus Issues',
  'Student Welfare & Complaints',
];

const statuses = ['All', 'Open', 'In Progress', 'Escalated', 'Closed'];
const priorities = ['All', 'Low', 'Medium', 'High', 'Critical'];

const TicketsPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Filters & Pagination
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets');
      setTickets(res.data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleTicketCreated = () => {
    setIsCreateModalOpen(false);
    fetchTickets();
  };

  // Called from TicketModal when user resolves, escalates, or chats
  const handleTicketUpdate = (updatedTicket) => {
    setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
  };

  // Fetch fresh ticket data before opening modal to avoid stale AI state
  const handleOpenTicket = async (ticket) => {
    try {
      const res = await api.get(`/tickets/${ticket._id}`);
      setSelectedTicket(res.data.ticket || ticket);
    } catch {
      // Fallback to card data if fetch fails
      setSelectedTicket(ticket);
    }
  };

  // Apply filters
  const filteredTickets = tickets.filter((t) => {
    const matchStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchCategory = filterCategory === 'All' || t.category === filterCategory;
    const matchPriority = filterPriority === 'All' || t.priority === filterPriority;
    return matchStatus && matchCategory && matchPriority;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
  const startIndex = (currentPage - 1) * ticketsPerPage;
  const currentTickets = filteredTickets.slice(startIndex, startIndex + ticketsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterCategory, filterPriority]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">
          {user?.role === 'student' ? 'My Tickets' : 'All Tickets'}
        </h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 btn-primary"
        >
          <Plus size={18} />
          Create Ticket
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div className="flex items-center gap-2 text-gray-400 md:mr-2">
          <Filter size={18} />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto flex-1">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-white w-full"
          >
            {statuses.map(s => <option key={s} value={s} className="bg-[#0a0a0f]">{s}</option>)}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-white w-full"
          >
            {priorities.map(p => <option key={p} value={p} className="bg-[#0a0a0f]">{p}</option>)}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-white w-full"
          >
            {categories.map(c => <option key={c} value={c} className="bg-[#0a0a0f]">{c}</option>)}
          </select>
        </div>
      </div>

      {/* Ticket List */}
      <div>
        {loading ? (
          <SkeletonLoader count={5} />
        ) : currentTickets.length > 0 ? (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {currentTickets.map(ticket => (
              <motion.div 
                key={ticket._id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
                }}
              >
                <TicketCard 
                  ticket={ticket} 
                  onClick={() => handleOpenTicket(ticket)} 
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 glass-card rounded-2xl"
          >
            <Search className="mx-auto h-12 w-12 text-gray-500 mb-3 opacity-50" />
            <h3 className="text-lg font-medium text-white">No tickets found</h3>
            <p className="text-gray-400 mt-1">Try adjusting your filters or create a new ticket.</p>
          </motion.div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <p className="text-sm text-gray-400">
            Showing <span className="font-medium text-white">{startIndex + 1}</span> to <span className="font-medium text-white">{Math.min(startIndex + ticketsPerPage, filteredTickets.length)}</span> of <span className="font-medium text-white">{filteredTickets.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Ticket">
        <CreateTicketForm onSuccess={handleTicketCreated} />
      </Modal>

      <TicketModal 
        ticket={selectedTicket} 
        isOpen={!!selectedTicket} 
        onClose={() => setSelectedTicket(null)}
        onTicketUpdate={handleTicketUpdate}
      />
    </div>
  );
};

export default TicketsPage;
