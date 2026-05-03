import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../utils/api';
import TicketCard from '../components/TicketCard';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';
import CreateTicketForm from '../components/CreateTicketForm';
import TicketModal from '../components/TicketModal';
import AnimatedCounter from '../components/AnimatedCounter';
import TypewriterText from '../components/TypewriterText';
import ParticleBackground from '../components/ParticleBackground';
import { Plus, Ticket, Clock, CheckCircle, AlertCircle, Bell } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, notifsRes] = await Promise.all([
        api.get('/tickets'),
        api.get('/notifications')
      ]);
      setTickets(ticketsRes.data.tickets || []);
      setNotifications(notifsRes.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
  };

  const recentTickets = tickets.slice(0, 5);
  const unreadNotifications = notifications.filter(n => !n.readStatus).slice(0, 3);

  const handleTicketCreated = () => {
    setIsCreateModalOpen(false);
    fetchDashboardData();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="relative min-h-screen">
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <TypewriterText text={`Welcome back, ${user?.name.split(' ')[0]}`} delay={60} />
              <span className="badge bg-primary/10 text-primary border border-primary/30 capitalize">
                {user?.role}
              </span>
            </h1>
            <p className="text-gray-400 mt-2">Here's what's happening with your support requests.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <Plus size={18} />
            Create New Ticket
          </motion.button>
        </div>

        {/* Stats Row */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard icon={<Ticket className="text-primary" />} label="Total Tickets" value={stats.total} variants={itemVariants} />
          <StatCard icon={<AlertCircle className="text-accent-warm" />} label="Open Tickets" value={stats.open} variants={itemVariants} />
          <StatCard icon={<Clock className="text-yellow-500" />} label="In Progress" value={stats.inProgress} variants={itemVariants} />
          <StatCard icon={<CheckCircle className="text-accent-success" />} label="Closed" value={stats.closed} variants={itemVariants} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tickets */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Tickets</h2>
              <Link to="/tickets" className="text-sm font-medium text-primary hover:text-secondary transition-colors">
                View all
              </Link>
            </div>
            
            {loading ? (
              <SkeletonLoader count={3} />
            ) : recentTickets.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                {recentTickets.map(ticket => (
                  <motion.div key={ticket._id} variants={itemVariants}>
                    <TicketCard 
                      ticket={ticket} 
                      onClick={() => setSelectedTicket(ticket)} 
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 glass-card rounded-2xl"
              >
                <Ticket className="mx-auto h-12 w-12 text-gray-400 mb-3 opacity-50" />
                <h3 className="text-lg font-medium text-white">No tickets yet</h3>
                <p className="text-gray-400 mt-1">Create your first support ticket to get started.</p>
              </motion.div>
            )}
          </div>

          {/* Notifications Preview */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell size={18} className="text-primary" />
                Recent Updates
              </h2>
              <Link to="/tickets" className="text-sm font-medium text-primary hover:text-secondary transition-colors">
                View all
              </Link>
            </div>

            <div className="glass-card rounded-2xl p-5">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-white/5 shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-white/5 rounded w-full"></div>
                        <div className="h-3 bg-white/5 rounded w-1/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : unreadNotifications.length > 0 ? (
                <div className="space-y-4">
                  {unreadNotifications.map(notification => (
                    <div key={notification._id} className="flex gap-3 border-b border-white/5 last:border-0 pb-4 last:pb-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Bell size={14} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-200">{notification.message}</p>
                        <span className="text-xs text-gray-400 mt-1 block">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400">No new notifications</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Modals */}
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Ticket">
          <CreateTicketForm onSuccess={handleTicketCreated} />
        </Modal>

        <TicketModal 
          ticket={selectedTicket} 
          isOpen={!!selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, variants }) => (
  <motion.div variants={variants} className="glass-card p-5 flex items-center gap-4">
    <div className="p-3 bg-primary/10 rounded-xl shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white">
        <AnimatedCounter value={value} />
      </p>
    </div>
  </motion.div>
);

export default Dashboard;
