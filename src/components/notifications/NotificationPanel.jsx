import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Bell, CheckCircle, X } from 'lucide-react';

function NotificationPanel({
  showNotifications,
  setShowNotifications,
  notifications,
  markAsRead,
  clearAllNotifications,
}) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!showNotifications) return undefined;

    setCurrentTime(Date.now());
    const timerId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timerId);
  }, [showNotifications]);

  const formatRelativeTime = (notification) => {
    const sourceTime = notification.createdAt || notification.time;
    const timestamp = typeof sourceTime === 'number' ? sourceTime : Date.parse(sourceTime);

    if (!Number.isFinite(timestamp)) {
      return notification.time || 'Just now';
    }

    const diffSeconds = Math.max(0, Math.floor((currentTime - timestamp) / 1000));
    if (diffSeconds < 3) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  if (!showNotifications) return null;

  return (
    <div className="fixed right-4 top-16 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 md:w-96">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearAllNotifications}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <div
                      className={`p-2 rounded-lg mr-3 ${
                        notification.type === 'success'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : notification.type === 'error'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : notification.type === 'warning'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {notification.type === 'success' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : notification.type === 'error' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : notification.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(notification)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                    </div>
                    {!notification.read && <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationPanel;
