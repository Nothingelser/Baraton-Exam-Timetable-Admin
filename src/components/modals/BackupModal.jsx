import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  Database,
  Download,
  DownloadCloud,
  HardDrive,
  RefreshCw,
  UploadCloud,
  X,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

function BackupModal({
  showBackupModal,
  setShowBackupModal,
  backupService,
  addNotification,
  currentUser,
  courses,
  users,
  systemSettings,
}) {
  const [backupStatus, setBackupStatus] = useState('idle'); // idle, backing-up, completed, restoring, restored
  const [backupHistory, setBackupHistory] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [importing, setImporting] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => {
    return localStorage.getItem('autoBackupEnabled') !== 'false';
  });
  const [autoBackupInterval, setAutoBackupInterval] = useState(() => {
    return localStorage.getItem('autoBackupInterval') || '24';
  });
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: async () => {},
  });

  useEffect(() => {
    if (showBackupModal) {
      loadBackupHistory();
    }
  }, [showBackupModal]);

  const loadBackupHistory = () => {
    const history = backupService.getBackupHistory();
    setBackupHistory(history);
  };

  const handleCreateBackup = async () => {
    setBackupStatus('backing-up');

    try {
      const result = await backupService.createBackup(
        courses,
        users,
        {
          ...systemSettings,
          adminTheme: localStorage.getItem('adminTheme'),
          compactMode: localStorage.getItem('compactMode'),
          highContrast: localStorage.getItem('highContrast'),
        },
        currentUser
      );

      if (result.success) {
        setBackupStatus('completed');
        loadBackupHistory();

        addNotification('Backup Created', `Backup created successfully with ${result.totalItems} items`, 'success');

        setTimeout(() => {
          setBackupStatus('idle');
        }, 3000);
      } else {
        setBackupStatus('idle');
        addNotification('Backup Failed', `Failed to create backup: ${result.error}`, 'error');
      }
    } catch (error) {
      setBackupStatus('idle');
      addNotification('Backup Error', `An error occurred: ${error.message}`, 'error');
    }
  };

  const openConfirm = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', onConfirm }) => {
    setConfirmConfig({ isOpen: true, title, message, confirmText, cancelText, type, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const performRestoreBackup = async (backupId = 'latest') => {
    setBackupStatus('restoring');

    try {
      const result = await backupService.restoreBackup(backupId, addNotification);

      if (result.success) {
        setBackupStatus('restored');

        setTimeout(() => {
          setBackupStatus('idle');
          setShowBackupModal(false);
          // Trigger page reload to reflect restored data
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

  const handleRestoreBackup = async (backupId = 'latest') => {
    openConfirm({
      title: 'Confirm Restore',
      message: 'Are you sure you want to restore this backup? Current data may be overwritten.',
      confirmText: 'Restore',
      type: 'danger',
      onConfirm: () => performRestoreBackup(backupId),
    });
  };

  const performDeleteBackup = async (backupId) => {
    const result = backupService.deleteBackup(backupId);

    if (result.success) {
      loadBackupHistory();
      addNotification('Backup Deleted', `Backup deleted successfully`, 'success');
    } else {
      addNotification('Delete Failed', `Failed to delete backup: ${result.error}`, 'error');
    }
  };

  const handleDeleteBackup = async (backupId) => {
    openConfirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this backup? This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: () => performDeleteBackup(backupId),
    });
  };

  const handleExportBackup = (backupId) => {
    const backup = backupId === 'latest' ? backupHistory[0] : backupHistory.find((b) => b.id === backupId);

    if (!backup) {
      addNotification('Export Failed', 'Backup not found', 'error');
      return;
    }

    const result = backupService.exportBackup(
      backupId,
      `baraton_backup_${new Date(backup.timestamp).toISOString().split('T')[0]}`
    );

    if (result.success) {
      addNotification('Backup Exported', `Backup exported successfully as JSON file`, 'success');
    } else {
      addNotification('Export Failed', `Failed to export backup: ${result.error}`, 'error');
    }
  };

  const handleImportBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);

    try {
      const result = await backupService.importBackup(file, addNotification);

      if (result.success) {
        loadBackupHistory();
        addNotification('Backup Imported', `Successfully imported backup: ${result.name}`, 'success');
      } else {
        addNotification('Import Failed', `Failed to import backup: ${result.error}`, 'error');
      }
    } catch (error) {
      addNotification('Import Error', `An error occurred: ${error.message}`, 'error');
    } finally {
      setImporting(false);
      event.target.value = ''; // Reset file input
    }
  };

  const performClearAllBackups = () => {
    const result = backupService.clearAllBackups();

    if (result.success) {
      setBackupHistory([]);
      addNotification('Backups Cleared', 'All backups have been cleared', 'warning');
    } else {
      addNotification('Clear Failed', `Failed to clear backups: ${result.error}`, 'error');
    }
  };

  const handleClearAllBackups = () => {
    openConfirm({
      title: 'Confirm Clear All',
      message: 'Are you sure you want to clear all backups? This action cannot be undone.',
      confirmText: 'Clear All',
      type: 'danger',
      onConfirm: performClearAllBackups,
    });
  };

  const handleAutoBackupToggle = (enabled) => {
    setAutoBackupEnabled(enabled);
    localStorage.setItem('autoBackupEnabled', enabled.toString());

    if (enabled) {
      addNotification('Auto-Backup Enabled', 'Automatic backups have been enabled', 'success');
    } else {
      addNotification('Auto-Backup Disabled', 'Automatic backups have been disabled', 'info');
    }
  };

  const handleAutoBackupIntervalChange = (hours) => {
    setAutoBackupInterval(hours);
    localStorage.setItem('autoBackupInterval', hours);

    addNotification('Auto-Backup Interval Updated', `Auto-backup interval set to ${hours} hours`, 'success');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const backupStatusInfo = backupService.getBackupStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Backup & Restore</h2>
            <button onClick={() => setShowBackupModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage system backups and restoration</p>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Backup Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center">
                <Database className="w-8 h-8 text-blue-600 dark:text-blue-500 mr-3" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Total Backups</h4>
                  <p className="text-2xl font-bold mt-2 dark:text-white">{backupStatusInfo.totalBackups}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-green-600 dark:text-green-500 mr-3" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Last Backup</h4>
                  <p className="text-sm mt-2 dark:text-gray-300">
                    {backupStatusInfo.lastBackupDate ? formatDate(backupStatusInfo.lastBackupDate) : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <div className="flex items-center">
                <HardDrive className="w-8 h-8 text-purple-600 dark:text-purple-500 mr-3" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Total Size</h4>
                  <p className="text-2xl font-bold mt-2 dark:text-white">{formatFileSize(backupStatusInfo.totalSize)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
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
                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                  System restored successfully! Page will reload...
                </span>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCreateBackup}
              disabled={backupStatus !== 'idle'}
              className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              <DownloadCloud className="w-5 h-5 mr-2" />
              Create New Backup
            </button>

            <button
              onClick={() => handleRestoreBackup('latest')}
              disabled={backupStatus !== 'idle' || !backupStatusInfo.hasBackups}
              className="p-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              <UploadCloud className="w-5 h-5 mr-2" />
              Restore Latest
            </button>
          </div>

          {/* Import/Export Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Import & Export</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Import Backup</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    disabled={importing || backupStatus !== 'idle'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-900 dark:text-white disabled:opacity-50"
                  />
                  {importing && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select a JSON backup file</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export Latest Backup</label>
                <button
                  onClick={() => handleExportBackup('latest')}
                  disabled={!backupStatusInfo.hasBackups || backupStatus !== 'idle'}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download Backup
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Download as JSON file</p>
              </div>
            </div>
          </div>

          {/* Auto-Backup Settings */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Auto-Backup Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Auto-Backup</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Automatically create backups on schedule</p>
                </div>
                <button
                  onClick={() => handleAutoBackupToggle(!autoBackupEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoBackupEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {autoBackupEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Backup Interval (hours)
                  </label>
                  <div className="flex items-center space-x-4">
                    {[6, 12, 24, 48].map((hours) => (
                      <button
                        key={hours}
                        onClick={() => handleAutoBackupIntervalChange(hours.toString())}
                        className={`px-3 py-1 rounded-lg border transition-all ${
                          autoBackupInterval === hours.toString()
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Backups will be created automatically every {autoBackupInterval} hours
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Backup History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Backup History</h4>
              {backupHistory.length > 0 && (
                <button
                  onClick={handleClearAllBackups}
                  className="text-xs text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                >
                  Clear All
                </button>
              )}
            </div>

            {backupHistory.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No backups found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first backup to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {backupHistory.map((backup) => (
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
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Created:</span> {formatDate(backup.timestamp)}
                          </div>
                          <div>
                            <span className="font-medium">By:</span> {backup.createdByName}
                          </div>
                          <div>
                            <span className="font-medium">Size:</span> {formatFileSize(backup.size || 0)}
                          </div>
                          <div>
                            <span className="font-medium">Courses:</span> {backup.totalCourses}
                          </div>
                          <div>
                            <span className="font-medium">Users:</span> {backup.totalUsers}
                          </div>
                          <div>
                            <span className="font-medium">ID:</span> {backup.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => handleRestoreBackup(backup.id)}
                          disabled={backupStatus !== 'idle'}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          title="Restore this backup"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleExportBackup(backup.id)}
                          disabled={backupStatus !== 'idle'}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          title="Export this backup"
                        >
                          Export
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.id)}
                          disabled={backupStatus !== 'idle'}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          title="Delete this backup"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Information Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Backup Information</h5>
            <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <p>• Backups include: Courses, Users, System Settings, Theme Preferences</p>
              <p>• Backups are stored in your browser's localStorage</p>
              <p>• Maximum of 50 backups are kept (oldest are automatically deleted)</p>
              <p>• Export backups to JSON files for external storage</p>
              <p>• Import backups from previously exported JSON files</p>
              <p>• Restore points are created before each restore operation</p>
              <p>• Auto-backup can be scheduled for automatic data protection</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowBackupModal(false)}
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              disabled={backupStatus === 'backing-up' || backupStatus === 'restoring'}
            >
              Close
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
      />
    </div>
  );
}

export default BackupModal;

