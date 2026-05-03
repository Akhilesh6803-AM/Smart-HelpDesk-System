import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ChatTypingText = ({ text, delay = 30, className = '' }) => {
  const [displayedWords, setDisplayedWords] = useState([]);
  const words = text.split(' ');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedWords(words.slice(0, i));
      i++;
      if (i > words.length) {
        clearInterval(interval);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [text, delay]);

  return (
    <div className={className}>
      {displayedWords.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

export default ChatTypingText;
