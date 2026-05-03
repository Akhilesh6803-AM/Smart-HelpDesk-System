import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, HelpCircle, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import SkeletonLoader from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';

const FAQsPage = () => {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Categories based on backend constants
  const categories = [
    'Technical Issues',
    'Academic Issues',
    'Project & Documentation',
    'Administrative Issues',
    'Facility & Campus Issues',
    'Student Welfare & Complaints',
    'General', // Fallback
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const url = debouncedSearch ? `/faqs?search=${encodeURIComponent(debouncedSearch)}` : '/faqs';
        const res = await api.get(url);
        setFaqs(res.data.faqs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, [debouncedSearch]);

  const groupedFaqs = categories.reduce((acc, cat) => {
    const catFaqs = faqs.filter((f) => f.category === cat || (!categories.includes(f.category) && cat === 'General'));
    if (catFaqs.length > 0) acc[cat] = catFaqs;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header & Search */}
      <div className="text-center space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-3">
          <HelpCircle className="text-primary" size={32} />
          Frequently Asked Questions
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Find quick answers to common issues. If you can't find what you're looking for, feel free to raise a support ticket.
        </p>

        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary focus:outline-none text-white transition-all text-lg"
          />
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-8">
        {loading ? (
          <SkeletonLoader count={5} />
        ) : Object.keys(groupedFaqs).length > 0 ? (
          Object.keys(groupedFaqs).map((category) => (
            <div key={category} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-200 pl-2 border-l-4 border-primary">
                {category}
              </h2>
              <div className="space-y-3">
                {groupedFaqs[category].map((faq) => {
                  const isExpanded = expandedId === faq._id;
                  return (
                    <motion.div
                      key={faq._id}
                      layout
                      className="glass-card overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : faq._id)}
                        className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-white/5 transition-colors"
                      >
                        <span className="font-medium text-white">{faq.question}</span>
                        <ChevronDown
                          size={20}
                          className={`text-gray-400 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 text-gray-300 whitespace-pre-wrap"
                          >
                            <div className="pt-2 border-t border-white/5">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No FAQs match your search.</p>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="glass-card p-8 text-center mt-12 border-dashed border-primary/30 bg-primary/5">
        <h3 className="text-xl font-semibold text-white mb-2">Didn't find your answer?</h3>
        <p className="text-gray-400 mb-6">Our support team is here to help. Raise a ticket and we'll get back to you shortly.</p>
        <Link
          to={user ? "/dashboard" : "/auth"}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Ticket size={20} />
          Raise a Ticket
        </Link>
      </div>
    </div>
  );
};

export default FAQsPage;
