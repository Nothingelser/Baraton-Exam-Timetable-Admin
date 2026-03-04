import React, { useEffect, useState } from 'react';
import {
  Activity,
  Bell,
  CheckCircle,
  Clock,
  Copy,
  Cpu,
  Database,
  DownloadCloud,
  Eye,
  EyeOff,
  HardDrive,
  Palette,
  RefreshCw,
  Server,
  Settings,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../lib/supabaseClient.js';
import BackupModal from '../modals/BackupModal.jsx';
import NotificationSettings from './NotificationSettings.jsx';
import SecuritySettingsComponent from './SecuritySettingsComponent.jsx';
import ThemeSettings from './ThemeSettings.jsx';

function SystemSettings({ currentUser, addNotification, backupService, courses, users }) {
  const [activeTab, setActiveTab] = useState('general');
  const [backupStatus, setBackupStatus] = useState('idle');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [apiKey, setApiKey] = useState(SUPABASE_PUBLISHABLE_KEY);
  const [showApiKey, setShowApiKey] = useState(false);
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('adminLanguage') || 'en';
  });
  const [systemName, setSystemName] = useState(() => {
    return localStorage.getItem('systemName') || 'Baraton Admin Panel';
  });
  const [timezone, setTimezone] = useState(() => {
    return localStorage.getItem('timezone') || 'Africa/Nairobi';
  });
  const [dateFormat, setDateFormat] = useState(() => {
    return localStorage.getItem('dateFormat') || 'DD-MM-YYYY';
  });
  const [apiMetrics, setApiMetrics] = useState({
    requests24h: 1247,
    successRate: 99.8,
    responseTime: 156,
    activeConnections: 42,
    lastUpdated: new Date(),
  });
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [apiEndpoints, setApiEndpoints] = useState([
    { method: 'GET', path: '/exam_courses', description: 'Fetch all courses' },
    { method: 'POST', path: '/exam_courses', description: 'Create new course' },
    { method: 'GET', path: '/profiles', description: 'Get user profiles' },
    { method: 'POST', path: '/auth/login', description: 'User authentication' },
    { method: 'GET', path: '/system/health', description: 'System health check' },
  ]);
  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('webhookUrl') || '';
  });
  const [rateLimit, setRateLimit] = useState(() => {
    return localStorage.getItem('apiRateLimit') || '1000';
  });
  const [apiLogs, setApiLogs] = useState([]);
  const [backupHistory, setBackupHistory] = useState([]);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API', icon: Cpu },
    { id: 'backup', label: 'Backup', icon: Database },
  ];

  useEffect(() => {
    if (activeTab === 'backup') {
      loadBackupHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadBackupHistory = () => {
    const history = backupService.getBackupHistory();
    setBackupHistory(history);
  };

  const fetchApiMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const mockResponse = {
        requests24h: Math.floor(Math.random() * 500) + 1000,
        successRate: 98 + Math.random() * 2,
        responseTime: Math.floor(Math.random() * 100) + 100,
        activeConnections: Math.floor(Math.random() * 30) + 20,
        lastUpdated: new Date(),
      };

      setTimeout(() => {
        setApiMetrics(mockResponse);
        addNotification('API Metrics Updated', 'Successfully fetched latest API performance data', 'success');
        setLoadingMetrics(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching API metrics:', error);
      setLoadingMetrics(false);
    }
  };

  const fetchApiLogs = async () => {
    try {
      const mockLogs = [
        { id: 1, method: 'GET', endpoint: '/exam_courses', status: 200, timestamp: Date.now() - 5000, user: 'admin@baraton.com' },
        { id: 2, method: 'POST', endpoint: '/exam_courses', status: 201, timestamp: Date.now() - 12000, user: 'lecturer@baraton.com' },
        { id: 3, method: 'GET', endpoint: '/profiles', status: 200, timestamp: Date.now() - 25000, user: 'admin@baraton.com' },
        { id: 4, method: 'DELETE', endpoint: '/exam_courses/123', status: 204, timestamp: Date.now() - 45000, user: 'admin@baraton.com' },
        { id: 5, method: 'GET', endpoint: '/system/health', status: 200, timestamp: Date.now() - 60000, user: 'system' },
        { id: 6, method: 'POST', endpoint: '/auth/login', status: 200, timestamp: Date.now() - 90000, user: 'anonymous' },
        { id: 7, method: 'GET', endpoint: '/exam_courses', status: 429, timestamp: Date.now() - 120000, user: 'anonymous' },
        { id: 8, method: 'PUT', endpoint: '/exam_courses/456', status: 403, timestamp: Date.now() - 180000, user: 'lecturer@baraton.com' },
      ];

      setApiLogs(mockLogs);
    } catch (error) {
      console.error('Error fetching API logs:', error);
    }
  };

  useEffect(() => {
    saveSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, systemName, timezone, dateFormat, webhookUrl, rateLimit]);

  useEffect(() => {
    if (activeTab === 'api') {
      fetchApiMetrics();
      fetchApiLogs();

      const interval = setInterval(() => {
        fetchApiMetrics();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const saveSettings = () => {
    localStorage.setItem('adminLanguage', language);
    localStorage.setItem('systemName', systemName);
    localStorage.setItem('timezone', timezone);
    localStorage.setItem('dateFormat', dateFormat);
    localStorage.setItem('webhookUrl', webhookUrl);
    localStorage.setItem('apiRateLimit', rateLimit);

    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
    window.dispatchEvent(new CustomEvent('systemNameChanged', { detail: systemName }));
    window.dispatchEvent(new CustomEvent('timezoneChanged', { detail: timezone }));
    window.dispatchEvent(new CustomEvent('dateFormatChanged', { detail: dateFormat }));
  };

  const handleGeneralSettingsChange = (key, value) => {
    switch (key) {
      case 'language':
        setLanguage(value);
        if (addNotification) {
          addNotification('Language Updated', `Interface language changed to ${getLanguageName(value)}`, 'success');
        }
        break;
      case 'systemName':
        setSystemName(value);
        if (addNotification) {
          addNotification('System Name Updated', `System name changed to "${value}"`, 'success');
        }
        break;
      case 'timezone':
        setTimezone(value);
        if (addNotification) {
          addNotification('Timezone Updated', `Timezone changed to ${getTimezoneName(value)}`, 'success');
        }
        break;
      case 'dateFormat':
        setDateFormat(value);
        if (addNotification) {
          addNotification('Date Format Updated', `Date format changed to ${value}`, 'success');
        }
        break;
    }
  };

  const getLanguageName = (code) => {
    const languages = {
      en: 'English',
      sw: 'Swahili',
      fr: 'French',
      es: 'Spanish',
      ar: 'Arabic',
    };
    return languages[code] || code;
  };

  const getTimezoneName = (id) => {
    const timezones = {
      'Africa/Nairobi': 'Africa/Nairobi (GMT+3)',
      UTC: 'UTC (GMT+0)',
      'America/New_York': 'America/New_York (GMT-5)',
      'Europe/London': 'Europe/London (GMT+0)',
      'Asia/Dubai': 'Asia/Dubai (GMT+4)',
    };
    return timezones[id] || id;
  };

  const handleCreateBackup = async () => {
    setBackupStatus('backing-up');

    const systemSettings = {
      systemName,
      dateFormat,
      language,
      timezone,
      adminTheme: localStorage.getItem('adminTheme'),
      compactMode: localStorage.getItem('compactMode'),
      highContrast: localStorage.getItem('highContrast'),
    };

    const result = await backupService.createBackup(courses, users, systemSettings, currentUser);

    if (result.success) {
      setBackupStatus('completed');
      loadBackupHistory();

      addNotification('Backup Created', `Backup created successfully with ${result.totalItems} items`, 'success');

      setTimeout(() => setBackupStatus('idle'), 3000);
    } else {
      setBackupStatus('idle');
      addNotification('Backup Failed', `Failed to create backup: ${result.error}`, 'error');
    }
  };

  const handleRestoreBackup = async () => {
    if (!window.confirm('Are you sure you want to restore from the latest backup? Current data may be overwritten.')) {
      return;
    }

    setBackupStatus('restoring');

    try {
      const result = await backupService.restoreBackup('latest', addNotification);

      if (result.success) {
        setBackupStatus('restored');

        setTimeout(() => {
          setBackupStatus('idle');
          window.location.reload();
        }, 2000);
      } else {
        setBackupStatus('idle');
      }
    } catch (error) {
      setBackupStatus('idle');
      addNotification('Restore Failed', `Failed to restore backup: ${error.message}`, 'error');
    }
  };

  const handleRegenerateApiKey = () => {
    const newKey = `sk_live_${Math.random().toString(36).substr(2, 32)}_${Math.random().toString(36).substr(2, 16)}`;
    setApiKey(newKey);
    if (addNotification) {
      addNotification('API Key Regenerated', 'New API key generated successfully. Update your applications.', 'success');
    }

    const newLog = {
      id: Date.now(),
      method: 'SYSTEM',
      endpoint: '/api/key/regenerate',
      status: 200,
      timestamp: Date.now(),
      user: currentUser?.email || 'admin',
      details: 'API key regenerated',
    };
    setApiLogs((prev) => [newLog, ...prev.slice(0, 9)]);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      addNotification('Webhook Error', 'Please enter a webhook URL first', 'error');
      return;
    }

    try {
      addNotification('Testing Webhook', 'Sending test webhook...', 'info');

      setTimeout(() => {
        addNotification('Webhook Test', 'Test webhook sent successfully', 'success');

        const newLog = {
          id: Date.now(),
          method: 'POST',
          endpoint: webhookUrl,
          status: 200,
          timestamp: Date.now(),
          user: currentUser?.email || 'admin',
          details: 'Webhook test successful',
        };
        setApiLogs((prev) => [newLog, ...prev.slice(0, 9)]);
      }, 1500);
    } catch (error) {
      addNotification('Webhook Error', 'Failed to send test webhook', 'error');
    }
  };

  const handleSaveWebhook = () => {
    localStorage.setItem('webhookUrl', webhookUrl);
    addNotification('Webhook Saved', 'Webhook URL saved successfully', 'success');
  };

  const handleSaveRateLimit = () => {
    localStorage.setItem('apiRateLimit', rateLimit);
    addNotification('Rate Limit Updated', `API rate limit set to ${rateLimit} requests/hour`, 'success');
  };

  const handleTestEndpoint = async (endpoint) => {
    try {
      addNotification('Testing Endpoint', `Testing ${endpoint.method} ${endpoint.path}...`, 'info');

      setTimeout(() => {
        const status = Math.random() > 0.1 ? 200 : 500;
        const message = status === 200 ? 'Endpoint test successful' : 'Endpoint test failed';

        addNotification(
          'Endpoint Test Result',
          `${endpoint.method} ${endpoint.path}: ${message}`,
          status === 200 ? 'success' : 'error'
        );

        const newLog = {
          id: Date.now(),
          method: endpoint.method,
          endpoint: endpoint.path,
          status: status,
          timestamp: Date.now(),
          user: currentUser?.email || 'admin',
          details: 'Endpoint test',
        };
        setApiLogs((prev) => [newLog, ...prev.slice(0, 9)]);
      }, 1000);
    } catch (error) {
      addNotification('Test Error', 'Failed to test endpoint', 'error');
    }
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600 dark:text-green-500';
    if (status >= 400 && status < 500) return 'text-yellow-600 dark:text-yellow-500';
    if (status >= 500) return 'text-red-600 dark:text-red-500';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getStatusBadge = (status) => {
    if (status >= 200 && status < 300) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    if (status >= 400 && status < 500) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    if (status >= 500) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'sw', name: 'Swahili' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'ar', name: 'Arabic' },
  ];

  const timezones = [
    { id: 'Africa/Nairobi', name: 'Africa/Nairobi (GMT+3)' },
    { id: 'UTC', name: 'UTC (GMT+0)' },
    { id: 'America/New_York', name: 'America/New_York (GMT-5)' },
    { id: 'Europe/London', name: 'Europe/London (GMT+0)' },
    { id: 'Asia/Dubai', name: 'Asia/Dubai (GMT+4)' },
  ];

  const dateFormats = [
    { id: 'DD-MM-YYYY', name: 'DD-MM-YYYY' },
    { id: 'MM/DD/YYYY', name: 'MM/DD/YYYY' },
    { id: 'YYYY-MM-DD', name: 'YYYY-MM-DD' },
    { id: 'DD/MM/YYYY', name: 'DD/MM/YYYY' },
  ];

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatBackupDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const backupStatusInfo = backupService.getBackupStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Configure system preferences and security settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Settings</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage your system configuration</p>
            </div>
            <nav className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg mb-1 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {currentUser?.avatar || 'A'}
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900 dark:text-white">{currentUser?.name || 'Administrator'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentUser?.role || 'admin'} • {currentUser?.email || 'admin@baraton.com'}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Last Login</span>
                <span className="font-medium">Today, 10:30 AM</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-400">Session</span>
                <span className="font-medium text-green-600 dark:text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">General Settings</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">System Name</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Display name of the admin panel</p>
                    </div>
                    <input
                      type="text"
                      value={systemName}
                      onChange={(e) => handleGeneralSettingsChange('systemName', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg w-64 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Interface Language</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">System language for interface</p>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => handleGeneralSettingsChange('language', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg w-64 dark:bg-gray-900 dark:text-white"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Timezone</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">System timezone for schedules</p>
                    </div>
                    <select
                      value={timezone}
                      onChange={(e) => handleGeneralSettingsChange('timezone', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg w-64 dark:bg-gray-900 dark:text-white"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.id} value={tz.id}>
                          {tz.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Date Format</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">How dates are displayed</p>
                    </div>
                    <select
                      value={dateFormat}
                      onChange={(e) => handleGeneralSettingsChange('dateFormat', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg w-64 dark:bg-gray-900 dark:text-white"
                    >
                      {dateFormats.map((format) => (
                        <option key={format.id} value={format.id}>
                          {format.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">System Status</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center">
                        <Server className="w-5 h-5 text-blue-600 dark:text-blue-500 mr-2" />
                        <span className="text-sm font-medium">Database</span>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs text-green-600 dark:text-green-500">Connected</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center">
                        <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-500 mr-2" />
                        <span className="text-sm font-medium">API</span>
                      </div>
                      <div className="flex items-center mt-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs text-green-600 dark:text-green-500">Healthy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'theme' && <ThemeSettings />}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h3>

                <SecuritySettingsComponent addNotification={addNotification} />
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <NotificationSettings />
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Configuration</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm pr-12 dark:text-white"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="flex justify-between mt-2">
                      <button
                        onClick={handleRegenerateApiKey}
                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                      >
                        <RefreshCw className="w-3 h-3 inline mr-1" />
                        Regenerate Key
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(apiKey);
                          addNotification('Copied', 'API key copied to clipboard', 'success');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
                      >
                        <Copy className="w-3 h-3 inline mr-1" />
                        Copy to Clipboard
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Endpoint</label>
                    <input
                      type="text"
                      value={SUPABASE_URL}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Base URL for all API requests</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Webhook URL</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://your-webhook-url.com"
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-900 dark:text-white"
                      />
                      <button onClick={handleSaveWebhook} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Save
                      </button>
                      <button onClick={handleTestWebhook} className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Test
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Receive real-time notifications for system events</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rate Limiting</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="100"
                            max="10000"
                            step="100"
                            value={rateLimit}
                            onChange={(e) => setRateLimit(e.target.value)}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium">{rateLimit} requests/hour</span>
                        </div>
                      </div>
                      <button onClick={handleSaveRateLimit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Apply
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum API requests per hour per user</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">API Performance</h4>
                      <button
                        onClick={fetchApiMetrics}
                        disabled={loadingMetrics}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
                      >
                        <RefreshCw className={`w-3 h-3 inline mr-1 ${loadingMetrics ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center">
                          <Activity className="w-5 h-5 text-green-600 dark:text-green-500 mr-2" />
                          <span className="text-sm font-medium">Requests (24h)</span>
                        </div>
                        <p className="text-2xl font-bold mt-2 dark:text-white">{apiMetrics.requests24h.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center">
                          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-500 mr-2" />
                          <span className="text-sm font-medium">Success Rate</span>
                        </div>
                        <p className="text-2xl font-bold mt-2 dark:text-white">{apiMetrics.successRate.toFixed(1)}%</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center">
                          <Clock className="w-5 h-5 text-purple-600 dark:text-purple-500 mr-2" />
                          <span className="text-sm font-medium">Response Time</span>
                        </div>
                        <p className="text-2xl font-bold mt-2 dark:text-white">{apiMetrics.responseTime}ms</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-orange-600 dark:text-orange-500 mr-2" />
                          <span className="text-sm font-medium">Active Connections</span>
                        </div>
                        <p className="text-2xl font-bold mt-2 dark:text-white">{apiMetrics.activeConnections}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Last updated: {apiMetrics.lastUpdated.toLocaleTimeString()}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Available Endpoints</h4>
                    <div className="space-y-2">
                      {apiEndpoints.map((endpoint, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  endpoint.method === 'GET'
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                                    : endpoint.method === 'POST'
                                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                                      : endpoint.method === 'PUT'
                                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                                        : endpoint.method === 'DELETE'
                                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                                          : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300'
                                }`}
                              >
                                {endpoint.method}
                              </span>
                              <code className="text-sm font-mono text-gray-800 dark:text-gray-300">{endpoint.path}</code>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{endpoint.description}</p>
                          </div>
                          <button
                            onClick={() => handleTestEndpoint(endpoint)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Test
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">Recent API Calls</h4>
                      <button
                        onClick={fetchApiLogs}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
                      >
                        Refresh logs
                      </button>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {apiLogs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between text-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(log.status)}`}>
                                {log.status}
                              </span>
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">{log.method}</span>
                                <code className="text-xs text-gray-500 dark:text-gray-400 ml-2">{log.endpoint}</code>
                                {log.details && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">• {log.details}</span>}
                                <div className="text-xs text-gray-500 dark:text-gray-400">{log.user}</div>
                              </div>
                            </div>
                            <span className="text-gray-500 dark:text-gray-400">{formatTimeAgo(log.timestamp)}</span>
                          </div>
                        ))}

                        {apiLogs.length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No API logs available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Backup & Restore</h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <Database className="w-8 h-8 text-blue-600 dark:text-blue-500 mr-3" />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Database Backup</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Last backup: {backupStatusInfo.lastBackupDate ? formatBackupDate(backupStatusInfo.lastBackupDate) : 'Never'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleCreateBackup}
                        disabled={backupStatus === 'backing-up'}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                      >
                        {backupStatus === 'backing-up' ? 'Backing up...' : 'Backup Now'}
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                      <div className="flex items-center mb-4">
                        <DownloadCloud className="w-8 h-8 text-green-600 dark:text-green-500 mr-3" />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Restore</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Restore from latest backup</p>
                        </div>
                      </div>
                      <button
                        onClick={handleRestoreBackup}
                        disabled={backupStatus === 'restoring' || !backupStatusInfo.hasBackups}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                      >
                        {backupStatus === 'restoring' ? 'Restoring...' : 'Restore Now'}
                      </button>
                    </div>
                  </div>

                  {backupStatus === 'backing-up' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-500 mr-2 animate-spin" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Creating backup... Please wait</span>
                      </div>
                    </div>
                  )}

                  {backupStatus === 'completed' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 mr-2" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-300">Backup created successfully!</span>
                      </div>
                    </div>
                  )}

                  {backupStatus === 'restoring' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <RefreshCw className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mr-2 animate-spin" />
                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Restoring system... Please wait</span>
                      </div>
                    </div>
                  )}

                  {backupStatus === 'restored' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 mr-2" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-300">System restored successfully! Page will reload...</span>
                      </div>
                    </div>
                  )}

                  {/* Backup History */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">Recent Backups</h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setShowBackupModal(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
                        >
                          Manage Backups
                        </button>
                      </div>
                    </div>

                    {backupHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <Database className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No backups found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first backup to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {backupHistory.slice(0, 3).map((backup) => (
                          <div
                            key={backup.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <Database className="w-4 h-4 text-blue-600 dark:text-blue-500 mr-2" />
                                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">{backup.name}</h5>
                                  {backup.id === backupHistory[0]?.id && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded">
                                      Latest
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <div>
                                    <span className="font-medium">Created:</span> {formatBackupDate(backup.timestamp)}
                                  </div>
                                  <div>
                                    <span className="font-medium">By:</span> {backup.createdByName}
                                  </div>
                                  <div>
                                    <span className="font-medium">Courses:</span> {backup.totalCourses}
                                  </div>
                                  <div>
                                    <span className="font-medium">Users:</span> {backup.totalUsers}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {backupHistory.length > 3 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setShowBackupModal(true)}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
                        >
                          View all {backupHistory.length} backups
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Backup Status</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center">
                          <Database className="w-5 h-5 text-blue-600 dark:text-blue-500 mr-2" />
                          <span className="text-sm font-medium">Total Backups</span>
                        </div>
                        <p className="text-2xl font-bold mt-2 dark:text-white">{backupStatusInfo.totalBackups}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center">
                          <HardDrive className="w-5 h-5 text-purple-600 dark:text-purple-500 mr-2" />
                          <span className="text-sm font-medium">Total Size</span>
                        </div>
                        <p className="text-2xl font-bold mt-2 dark:text-white">{formatFileSize(backupStatusInfo.totalSize)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Advanced Backup Options</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-Backup</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Automatically create backups daily</p>
                        </div>
                        <button
                          onClick={() => {
                            const enabled = localStorage.getItem('autoBackupEnabled') !== 'false';
                            localStorage.setItem('autoBackupEnabled', (!enabled).toString());
                            addNotification('Auto-Backup ' + (!enabled ? 'Enabled' : 'Disabled'), 'Auto-backup settings updated', 'success');
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            localStorage.getItem('autoBackupEnabled') !== 'false' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              localStorage.getItem('autoBackupEnabled') !== 'false' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Backup Retention</p>
                        <div className="flex items-center space-x-2">
                          <select
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-900 dark:text-white"
                            defaultValue="50"
                          >
                            <option value="10">Keep last 10 backups</option>
                            <option value="25">Keep last 25 backups</option>
                            <option value="50">Keep last 50 backups</option>
                            <option value="100">Keep last 100 backups</option>
                          </select>
                          <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Apply</button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Old backups are automatically deleted when limit is reached
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Backup Information</h5>
                    <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                      <p>• Backups include: Courses, Users, System Settings, Theme Preferences</p>
                      <p>• Backups are stored in your browser's localStorage</p>
                      <p>• Maximum of 50 backups are kept (oldest are automatically deleted)</p>
                      <p>• Export backups to JSON files for external storage</p>
                      <p>• Import backups from previously exported JSON files</p>
                      <p>• Click "Manage Backups" for advanced backup operations</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBackupModal && (
        <BackupModal
          showBackupModal={showBackupModal}
          setShowBackupModal={setShowBackupModal}
          backupService={backupService}
          addNotification={addNotification}
          currentUser={currentUser}
          courses={courses}
          users={users}
          systemSettings={{
            systemName,
            dateFormat,
            language,
            timezone,
          }}
        />
      )}
    </div>
  );
}

export default SystemSettings;

