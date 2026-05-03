const PriorityBadge = ({ priority }) => {
  const colors = {
    Low: 'bg-white/5 text-gray-300 border border-white/10',
    Medium: 'bg-primary/20 text-primary border border-primary/30',
    High: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    Critical: 'bg-red-500/20 text-red-300 border border-red-500/30',
  };

  const className = colors[priority] || 'bg-white/10 text-gray-300';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {priority}
    </span>
  );
};

export default PriorityBadge;
