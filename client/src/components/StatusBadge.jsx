const StatusBadge = ({ status }) => {
  const colors = {
    Open: 'bg-primary/20 text-primary border border-primary/30',
    'In Progress': 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    Escalated: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    Closed: 'bg-green-500/20 text-green-300 border border-green-500/30',
  };

  const className = colors[status] || 'bg-white/10 text-gray-300';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
