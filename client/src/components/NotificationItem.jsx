import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ notification, onClick }) => {
  return (
    <div
      onClick={() => onClick(notification)}
      className={`p-3 border-l-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
        !notification.readStatus
          ? 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10'
          : 'border-l-transparent'
      }`}
    >
      <p
        className={`text-sm ${
          !notification.readStatus
            ? 'font-semibold text-gray-900 dark:text-white'
            : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {notification.message}
      </p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </span>
        {!notification.readStatus && (
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
