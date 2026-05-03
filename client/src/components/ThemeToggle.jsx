import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-14 h-8 bg-black/10 dark:bg-white/10 backdrop-blur-md rounded-full border border-black/5 dark:border-white/10 transition-colors duration-300 focus:outline-none"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute w-6 h-6 rounded-full bg-white dark:bg-gray-800 shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          theme === 'dark' ? 'translate-x-3' : '-translate-x-3'
        }`}
      >
        {theme === 'dark' ? (
          <Moon size={14} className="text-blue-400" />
        ) : (
          <Sun size={14} className="text-orange-400" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
