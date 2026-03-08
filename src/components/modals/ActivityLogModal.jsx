import React, { useEffect, useState } from 'react';
import { X, Activity } from 'lucide-react';
import ActivityLogger from '../../services/activityLogger';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

function ActivityLogModal({ user, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      const logs = await ActivityLogger.getUserActivities(user.id);
      setActivities(logs);
      setLoading(false);
    };
    fetchActivities();
  }, [user.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-blue-600 dark:text-blue-500 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Activity Log</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.full_name || user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No activity recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{activity.action}</p>
                      {activity.details && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <p>ID: {activity.details.id || 'N/A'}</p>
                          <p>Course Code: {activity.details.code || 'N/A'}</p>
                          <p>Course Name: {activity.details.name || 'N/A'}</p>
                          <p>Date: {activity.details.date || formatDate(activity.timestamp)}</p>
                          <p>Time: {activity.details.time || new Date(activity.timestamp).toLocaleTimeString()}</p>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                      {formatDateTime(activity.timestamp)}
                    </span>
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

export default ActivityLogModal;
