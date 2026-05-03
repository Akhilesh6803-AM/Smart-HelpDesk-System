import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, AlertTriangle, Search, Filter, Trash2, Edit, Plus, CheckCircle, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

// ==========================================
// TICKET SECTION
// ==========================================
const AllTicketsSection = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;

  // Reply Modal
  const [replyTicket, setReplyTicket] = useState(null);
  const [adminReply, setAdminReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets');
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/tickets/${id}/status`, { status });
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePriority = async (id, priority) => {
    try {
      await api.patch(`/tickets/${id}/priority`, { priority });
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const submitReply = async () => {
    if (!adminReply) return;
    try {
      setSubmittingReply(true);
      await api.patch(`/tickets/${replyTicket._id}/reply`, { adminResponse: adminReply });
      setReplyTicket(null);
      setAdminReply('');
      fetchTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  let filtered = tickets.filter(t => {
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
    return true;
  });

  if (sortBy === 'priority') {
    const pMap = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    filtered.sort((a, b) => pMap[b.priority] - pMap[a.priority]);
  } else {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const totalPages = Math.ceil(filtered.length / ticketsPerPage);
  const currentTickets = filtered.slice((currentPage - 1) * ticketsPerPage, currentPage * ticketsPerPage);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-white">All Tickets</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field max-w-[150px]">
            <option value="All" className="bg-[#0a0a0f]">All Statuses</option>
            <option value="Open" className="bg-[#0a0a0f]">Open</option>
            <option value="In Progress" className="bg-[#0a0a0f]">In Progress</option>
            <option value="Escalated" className="bg-[#0a0a0f]">Escalated</option>
            <option value="Closed" className="bg-[#0a0a0f]">Closed</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="input-field max-w-[150px]">
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field max-w-[150px]">
            <option value="date">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 glass-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="px-4 py-3 font-medium">Ticket info</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">User</th>
              <th className="px-4 py-3 font-medium">Status / Priority</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {currentTickets.map((t) => (
              <tr key={t._id} className={`${t.isSensitive ? 'bg-red-900/10 border-l-4 border-l-red-500' : 'hover:bg-white/5'} transition-colors`}>
                <td className="px-4 py-4">
                  <p className="font-semibold text-white line-clamp-1">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.category} • {new Date(t.createdAt).toLocaleDateString()}</p>
                  {t.isSensitive && <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-red-400"><AlertTriangle size={12}/> Sensitive</span>}
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <p className="text-white">{t.userId?.name}</p>
                  <p className="text-xs text-gray-400">{t.userId?.email}</p>
                </td>
                <td className="px-4 py-4 space-y-2">
                  <select 
                    value={t.status} 
                    onChange={e => handleUpdateStatus(t._id, e.target.value)}
                    className="block w-full text-xs p-1 rounded bg-white/10 border-0 focus:ring-2 focus:ring-primary text-white"
                  >
                    <option value="Open" className="bg-[#0a0a0f]">Open</option>
                    <option value="In Progress" className="bg-[#0a0a0f]">In Progress</option>
                    <option value="Escalated" className="bg-[#0a0a0f]">Escalated</option>
                    <option value="Closed" className="bg-[#0a0a0f]">Closed</option>
                  </select>
                  <select 
                    value={t.priority} 
                    onChange={e => handleUpdatePriority(t._id, e.target.value)}
                    className="block w-full text-xs p-1 rounded bg-white/10 border-0 focus:ring-2 focus:ring-primary text-white"
                  >
                    <option value="Low" className="bg-[#0a0a0f]">Low</option>
                    <option value="Medium" className="bg-[#0a0a0f]">Medium</option>
                    <option value="High" className="bg-[#0a0a0f]">High</option>
                    <option value="Critical" className="bg-[#0a0a0f]">Critical</option>
                  </select>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => setReplyTicket(t)}
                    className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <MessageSquare size={14} />
                    Reply
                  </button>
                </td>
              </tr>
            ))}
            {currentTickets.length === 0 && (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">No tickets found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage===1} className="p-1 rounded bg-white/10 disabled:opacity-50"><ChevronLeft size={16}/></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage===totalPages} className="p-1 rounded bg-white/10 disabled:opacity-50"><ChevronRight size={16}/></button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      <Modal isOpen={!!replyTicket} onClose={() => {setReplyTicket(null); setAdminReply('');}} title="Reply to Ticket">
        {replyTicket && (
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-xl">
              <h3 className="font-semibold text-white">{replyTicket.title}</h3>
              <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{replyTicket.description}</p>
            </div>
            
            {replyTicket.aiResponse && (
              <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                <span className="text-xs font-semibold text-primary block mb-1">Existing AI Suggestion:</span>
                <p className="text-sm text-gray-200">{replyTicket.aiResponse}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Your Reply</label>
              <textarea 
                value={adminReply}
                onChange={e => setAdminReply(e.target.value)}
                rows="4"
                className="input-field resize-none w-full"
                placeholder="Type your response to the user..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => {setReplyTicket(null); setAdminReply('');}} className="px-4 py-2 text-gray-300 hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
              <button onClick={submitReply} disabled={!adminReply || submittingReply} className="btn-primary px-4 py-2 disabled:opacity-50 flex items-center gap-2">
                {submittingReply && <Spinner size="sm"/>}
                Send Reply
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ==========================================
// USER MANAGEMENT SECTION
// ==========================================
const UsersSection = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/users/${deleteConfirm._id}`);
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filterRole === 'All' ? users : users.filter(u => u.role === filterRole);
  const usersPerPage = 10;
  const totalPages = Math.ceil(filtered.length / usersPerPage);
  const currentUsers = filtered.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <select value={filterRole} onChange={e => {setFilterRole(e.target.value); setCurrentPage(1);}} className="input-field w-auto">
          <option value="All" className="bg-[#0a0a0f]">All Roles</option>
          <option value="student" className="bg-[#0a0a0f]">Student</option>
          <option value="staff" className="bg-[#0a0a0f]">Staff</option>
          <option value="admin" className="bg-[#0a0a0f]">Admin</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 glass-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="px-4 py-3 font-medium">Name & Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">ID (USN/Emp)</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {currentUsers.map(u => {
              const isSelf = u._id === currentUser?._id;
              const isAdmin = u.role === 'admin';
              const canDelete = !isSelf && !isAdmin;

              return (
                <tr key={u._id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3 text-gray-400">{u.usn || u.employeeId || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {canDelete ? (
                      <button onClick={() => setDeleteConfirm(u)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 pr-2">Restricted</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-gray-300">Are you sure you want to delete user <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-300 hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors">Delete User</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==========================================
// NOTICES SECTION
// ==========================================
const NoticesSection = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null); // 'create' | notice object
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notices');
      setNotices(res.data.notices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleSave = async () => {
    if (!formData.title || !formData.description) return;
    try {
      if (modalMode === 'create') {
        await api.post('/notices', formData);
      } else {
        await api.patch(`/notices/${modalMode._id}`, formData);
      }
      setModalMode(null);
      fetchNotices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/notices/${deleteConfirm}`);
      setDeleteConfirm(null);
      fetchNotices();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Notices</h2>
        <button onClick={() => {setFormData({title:'', description:''}); setModalMode('create');}} className="flex items-center gap-2 btn-primary">
          <Plus size={16} /> Add Notice
        </button>
      </div>

      <div className="grid gap-4">
        {notices.map(notice => (
          <div key={notice._id} className="glass-card p-5 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h3 className="font-semibold text-white text-lg">{notice.title}</h3>
              <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">{notice.description}</p>
              <p className="text-xs text-gray-500 mt-3">{new Date(notice.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-2 shrink-0 md:flex-col justify-center">
              <button onClick={() => {setFormData({title: notice.title, description: notice.description}); setModalMode(notice);}} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg">
                <Edit size={16} />
              </button>
              <button onClick={() => setDeleteConfirm(notice._id)} className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {notices.length === 0 && <p className="text-center text-gray-500 py-10">No notices found.</p>}
      </div>

      <Modal isOpen={!!modalMode} onClose={() => setModalMode(null)} title={modalMode === 'create' ? "Add Notice" : "Edit Notice"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="4" className="input-field w-full resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-300 hover:bg-white/10 rounded-xl">Cancel</button>
            <button onClick={handleSave} className="btn-primary px-4 py-2">Save</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-gray-300">Delete this notice permanently?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-300 hover:bg-white/10 rounded-xl">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==========================================
// FAQS SECTION
// ==========================================
const FAQsSection = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [formData, setFormData] = useState({ question: '', answer: '', category: 'General' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const categories = [
    'General', 'Technical Issues', 'Academic Issues', 
    'Project & Documentation', 'Administrative Issues', 
    'Facility & Campus Issues', 'Student Welfare & Complaints'
  ];

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faqs?admin=true'); // we assume backend respects admin fetching all
      setFaqs(res.data.faqs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  const handleSave = async () => {
    if (!formData.question || !formData.answer) return;
    try {
      if (modalMode === 'create') {
        await api.post('/faqs', formData);
      } else {
        await api.patch(`/faqs/${modalMode._id}`, formData);
      }
      setModalMode(null);
      fetchFaqs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/faqs/${deleteConfirm}`);
      setDeleteConfirm(null);
      fetchFaqs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/faqs/${id}`, { status: 'published' });
      fetchFaqs();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">FAQs</h2>
        <button onClick={() => {setFormData({question:'', answer:'', category: categories[0]}); setModalMode('create');}} className="flex items-center gap-2 btn-primary">
          <Plus size={16} /> Add FAQ
        </button>
      </div>

      <div className="grid gap-4">
        {faqs.map(faq => (
          <div key={faq._id} className="glass-card p-5 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 text-xs rounded-full ${faq.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {faq.status}
                </span>
                <span className="text-xs text-gray-500">{faq.category}</span>
              </div>
              <h3 className="font-semibold text-white">{faq.question}</h3>
              <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">{faq.answer}</p>
            </div>
            <div className="flex gap-2 shrink-0 items-start">
              {faq.status === 'pending' && (
                <button onClick={() => handleApprove(faq._id)} title="Approve & Publish" className="p-2 text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-lg">
                  <CheckCircle size={16} />
                </button>
              )}
              <button onClick={() => {setFormData({question: faq.question, answer: faq.answer, category: faq.category}); setModalMode(faq);}} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg">
                <Edit size={16} />
              </button>
              <button onClick={() => setDeleteConfirm(faq._id)} className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {faqs.length === 0 && <p className="text-center text-gray-500 py-10">No FAQs found.</p>}
      </div>

      <Modal isOpen={!!modalMode} onClose={() => setModalMode(null)} title={modalMode === 'create' ? "Add FAQ" : "Edit FAQ"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field w-full">
              {categories.map(c => <option key={c} value={c} className="bg-[#0a0a0f]">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Question</label>
            <input type="text" value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Answer</label>
            <textarea value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value})} rows="4" className="input-field w-full resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-300 hover:bg-white/10 rounded-xl">Cancel</button>
            <button onClick={handleSave} className="btn-primary px-4 py-2">Save</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-gray-300">Delete this FAQ permanently?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-300 hover:bg-white/10 rounded-xl">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


// ==========================================
// MAIN ADMIN PAGE
// ==========================================
const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('tickets');

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-8 w-full max-w-full overflow-x-hidden">
        {activeTab === 'tickets' && <AllTicketsSection />}
        {activeTab === 'users' && <UsersSection />}
        {activeTab === 'notices' && <NoticesSection />}
        {activeTab === 'faqs' && <FAQsSection />}
      </main>
    </div>
  );
};

export default AdminPage;
