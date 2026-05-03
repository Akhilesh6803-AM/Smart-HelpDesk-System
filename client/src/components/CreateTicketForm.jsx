import { useState } from 'react';
import { Bot, Send, AlertCircle } from 'lucide-react';
import Spinner from './Spinner';
import api from '../utils/api';

const categories = [
  'Technical Issues',
  'Academic Issues',
  'Project & Documentation',
  'Administrative Issues',
  'Facility & Campus Issues',
  'Student Welfare & Complaints',
];

const CreateTicketForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({ title: '', description: '', category: '' });
  const [aiResponse, setAiResponse] = useState('');
  const [isGettingAI, setIsGettingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = errorState('');

  function errorState(initial) {
    const [val, setVal] = useState(initial);
    return [val, setVal];
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleGetSuggestion = async () => {
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill all fields to get an AI suggestion');
      return;
    }

    setIsGettingAI(true);
    setError('');
    
    try {
      const res = await api.post('/ai/suggest', formData);
      setAiResponse(res.data.suggestion);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get AI suggestion');
    } finally {
      setIsGettingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) {
      setError('All fields are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/tickets/create', formData);
      if (onSuccess) onSuccess();
      setFormData({ title: '', description: '', category: '' });
      setAiResponse('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all"
          placeholder="Brief description of the issue"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all appearance-none"
        >
          <option value="" disabled className="dark:bg-dark-bg">Select a category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat} className="dark:bg-dark-bg">{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows="4"
          className="w-full px-4 py-2 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all resize-none"
          placeholder="Detailed explanation of your issue..."
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleGetSuggestion}
          disabled={isGettingAI || isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-50"
        >
          {isGettingAI ? <Spinner size="sm" /> : <Bot size={18} />}
          Get AI Suggestion
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting || isGettingAI}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
        >
          {isSubmitting ? <Spinner size="sm" /> : <Send size={18} />}
          Submit Ticket
        </button>
      </div>

      {aiResponse && (
        <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            <Bot size={16} />
            <span>AI Suggestion</span>
          </div>
          <div className="text-sm text-blue-900/80 dark:text-blue-200 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {aiResponse}
          </div>
        </div>
      )}
    </form>
  );
};

export default CreateTicketForm;
