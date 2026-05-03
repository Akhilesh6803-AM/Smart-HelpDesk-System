import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Edit, Trash2, Search, Bell } from 'lucide-react';
import api from '../utils/api';
import SkeletonLoader from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';

const NoticesPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Admin Modals
  const [modalMode, setModalMode] = useState(null); // 'create' | notice obj
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      addToast('Please fill all fields', 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      if (modalMode === 'create') {
        await api.post('/notices', formData);
        addToast('Notice created successfully', 'success');
      } else {
        await api.patch(`/notices/${modalMode._id}`, formData);
        addToast('Notice updated successfully', 'success');
      }
      setModalMode(null);
      fetchNotices();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save notice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await api.delete(`/notices/${deleteConfirm}`);
      addToast('Notice deleted successfully', 'success');
      setDeleteConfirm(null);
      fetchNotices();
    } catch (err) {
      addToast('Failed to delete notice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="text-primary" />
            Campus Notices
          </h1>
          <p className="text-gray-400 mt-2">Stay updated with the latest announcements.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setFormData({ title: '', description: '' }); setModalMode('create'); }}
            className="hidden sm:flex items-center gap-2 btn-primary"
          >
            <Plus size={18} /> Add Notice
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <SkeletonLoader count={4} />
        ) : notices.length > 0 ? (
          notices.map((notice) => {
            const isExpanded = expandedId === notice._id;
            return (
              <motion.div
                key={notice._id}
                layout
                className="glass-card overflow-hidden"
              >
                <div
                  className="p-5 cursor-pointer flex justify-between gap-4"
                  onClick={() => setExpandedId(isExpanded ? null : notice._id)}
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{notice.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                      <Calendar size={14} />
                      <span>{new Date(notice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">By {notice.createdBy?.name || 'Admin'}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-start gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setFormData({ title: notice.title, description: notice.description }); setModalMode(notice); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setDeleteConfirm(notice._id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 pt-2 border-t border-white/5"
                    >
                      <p className="text-gray-300 whitespace-pre-wrap">{notice.description}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-16 glass-card rounded-xl border-dashed border-white/10">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-3 opacity-50" />
            <h3 className="text-lg font-medium text-white">No notices posted yet</h3>
          </div>
        )}
      </div>

      {isAdmin && (
        <button
          onClick={() => { setFormData({ title: '', description: '' }); setModalMode('create'); }}
          className="sm:hidden fixed bottom-24 right-6 p-4 bg-primary text-white rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Modals for Admin */}
      {isAdmin && (
        <>
          <Modal isOpen={!!modalMode} onClose={() => setModalMode(null)} title={modalMode === 'create' ? "Add Notice" : "Edit Notice"}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="6" className="input-field w-full resize-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-gray-300 hover:bg-white/10 rounded-xl">Cancel</button>
                <button onClick={handleSave} disabled={isSubmitting} className="btn-primary px-4 py-2 disabled:opacity-50">Save</button>
              </div>
            </div>
          </Modal>

          <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
            <div className="space-y-4">
              <p className="text-gray-300">Delete this notice permanently?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-300 hover:bg-white/10 rounded-xl">Cancel</button>
                <button onClick={handleDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">Delete</button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

export default NoticesPage;
