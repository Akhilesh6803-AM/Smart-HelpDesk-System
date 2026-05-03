const SkeletonLoader = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 glass-card border border-white/5 animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="h-5 bg-gray-700 rounded w-1/3"></div>
            <div className="flex gap-2">
              <div className="h-5 bg-gray-700 rounded w-16"></div>
              <div className="h-5 bg-gray-700 rounded w-16"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-5/6 mb-4"></div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
            <div className="h-4 bg-gray-700 rounded w-24"></div>
            <div className="h-4 bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
