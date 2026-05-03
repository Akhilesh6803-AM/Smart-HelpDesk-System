import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Bell, HelpCircle, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

const navItems = [
  { id: 'tickets', label: 'All Tickets', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'notices', label: 'Notices', icon: Bell },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
];

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar & Mobile Drawer */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 240,
          y: isMobileOpen ? 0 : '100%',
        }}
        className={`fixed md:sticky top-auto bottom-0 md:top-20 z-40 h-[60vh] md:h-[calc(100vh-5rem)] bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl border-t md:border-t-0 md:border-r border-gray-200 dark:border-white/10 flex flex-col transition-all duration-300 md:translate-y-0 ${
          isMobileOpen ? 'translate-y-0 rounded-t-3xl' : 'translate-y-full md:translate-y-0'
        }`}
      >
        <div className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto">
          {/* Mobile Handle */}
          <div className="md:hidden w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6" />

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                title={isCollapsed ? item.label : ''}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center md:px-0' : 'justify-start'}`}
              >
                <Icon size={20} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="md:whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop Collapse Button */}
        <div className="hidden md:flex p-4 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
