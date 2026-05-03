const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-primary border-t-secondary border-r-transparent animate-liquid-spin relative`}
        style={{
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
        }}
      >
        <div className="absolute inset-0 border-inherit animate-liquid-spin animation-delay-2000 opacity-50" />
      </div>
    </div>
  );
};

export default Spinner;
