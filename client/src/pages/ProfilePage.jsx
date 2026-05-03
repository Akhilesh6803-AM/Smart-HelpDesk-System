import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import Spinner from '../components/Spinner';
import { User, Mail, Shield, Hash, Calendar, Edit3, X, Save } from 'lucide-react';

const ProfilePage = () => {
  const { user, login } = useAuth(); // we'll use login to update context user if needed, or AuthContext fetches on mount
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, name: user.name, email: user.email }));
    }
  }, [user]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload = { name: formData.name, email: formData.email };
      if (formData.newPassword) {
        payload.password = formData.newPassword;
        payload.currentPassword = formData.currentPassword;
      }

      const res = await api.patch(`/users/${user._id}`, payload);
      addToast('Profile updated successfully', 'success');
      setIsEditing(false);
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      // Normally we'd want to refresh the user context here, but AuthContext only has a login method
      // We can reload the page or add a refreshUser to AuthContext. For simplicity, reload or just let it be.
      window.location.reload();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <div className="py-20 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="glass-card rounded-3xl p-6 sm:p-10">
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="text-primary" /> My Profile
          </h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl transition-colors font-medium text-sm"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({ name: user.name, email: user.email, currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl transition-colors font-medium text-sm"
            >
              <X size={16} /> Cancel
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start mb-10">
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-4xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              {getInitials(user.name)}
            </div>
            <span className="mt-4 px-3 py-1 bg-white/10 text-gray-300 rounded-full text-xs font-semibold uppercase tracking-wider">
              {user.role}
            </span>
          </div>

          <div className="flex-1 w-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField icon={<User size={18} />} label="Full Name" value={user.name} />
              <ProfileField icon={<Mail size={18} />} label="Email Address" value={user.email} />
              <ProfileField icon={<Hash size={18} />} label="ID Number" value={user.usn || user.employeeId || 'N/A'} />
              <ProfileField icon={<Calendar size={18} />} label="Joined Date" value={new Date(user.createdAt).toLocaleDateString()} />
            </div>
          </div>
        </div>

        {isEditing && (
          <form onSubmit={handleSave} className="border-t border-white/10 pt-8 space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field w-full" />
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
              <h4 className="font-medium text-white flex items-center gap-2">
                <Shield size={16} className="text-primary" /> Change Password <span className="text-xs text-gray-500 font-normal">(Optional)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Current Password</label>
                  <input type="password" value={formData.currentPassword} onChange={e => setFormData({...formData, currentPassword: e.target.value})} className="input-field w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">New Password</label>
                  <input type="password" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} className="input-field w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Confirm New Password</label>
                  <input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="input-field w-full text-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Spinner size="sm" /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const ProfileField = ({ icon, label, value }) => (
  <div className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
    <div className="text-gray-500 mt-0.5">{icon}</div>
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
    </div>
  </div>
);

export default ProfilePage;
