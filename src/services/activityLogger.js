import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../lib/supabaseClient';

class ActivityLogger {
  static async logActivity(userId, action, details = {}) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/activity_logs`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          user_id: userId,
          action,
          details,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to log activity:', response.status, error);
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  static async getUserActivities(userId) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/activity_logs?user_id=eq.${userId}&order=timestamp.desc`,
        {
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      if (response.ok) {
        return await response.json();
      }
      const error = await response.text();
      console.error('Failed to fetch activities:', response.status, error);
      return [];
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      return [];
    }
  }
}

export default ActivityLogger;
