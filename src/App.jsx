import React, { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Filter,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';

import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './lib/supabaseClient';
import BackupService from './services/backupService';
import { formatDate, parseDate } from './utils/dateUtils';
import { getMockCourses, getMockUsers } from './utils/mockData';
import { getRowAllocationSuggestions } from './utils/rowAllocation';

import LandingPage from './components/landing/LandingPage';
import LoginModal from './components/auth/LoginModal';
import LecturerSignupPage from './components/auth/LecturerSignupPage';
import NotificationPanel from './components/notifications/NotificationPanel';
import AddCourseModal from './components/modals/AddCourseModal';
import BulkUploadModal from './components/modals/BulkUploadModal';
import ExportModal from './components/modals/ExportModal';
import BackupModal from './components/modals/BackupModal';
import SystemSettings from './components/settings/SystemSettings';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVenue, setFilterVenue] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeVenues, setActiveVenues] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [systemSettings, setSystemSettings] = useState(() => {
    return {
      systemName: localStorage.getItem('systemName') || 'Baraton Admin Panel',
      dateFormat: localStorage.getItem('dateFormat') || 'DD-MM-YYYY',
      language: localStorage.getItem('adminLanguage') || 'en',
      timezone: localStorage.getItem('timezone') || 'Africa/Nairobi',
    };
  });

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    date: '',
    time: '',
    venue: '',
    instructor: '',
    option: '',
    numStudents: '',
    rows: '',
  });

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

        if (profileData) {
          if (
            profileData.role &&
            (profileData.role === 'admin' ||
              profileData.role === 'lecturer' ||
              profileData.role === 'examiner' ||
              profileData.role === 'coordinator')
          ) {
            const user = {
              id: profileData.id,
              name: profileData.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email,
              role: profileData.role,
              avatar: profileData.full_name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U',
            };
            setCurrentUser(user);
            localStorage.setItem('adminUser', JSON.stringify(user));
          } else {
            localStorage.removeItem('adminUser');
            setShowLogin(true);
          }
        }
      } else {
        const savedUser = localStorage.getItem('adminUser');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          if (
            user.role &&
            (user.role === 'admin' ||
              user.role === 'lecturer' ||
              user.role === 'examiner' ||
              user.role === 'coordinator')
          ) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem('adminUser');
            setShowLogin(true);
          }
        } else {
          setShowLogin(true);
        }
      }

      const savedTheme = localStorage.getItem('adminTheme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);

      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      const compactMode = localStorage.getItem('compactMode') === 'true';
      if (compactMode) {
        document.documentElement.classList.add('compact-mode');
      } else {
        document.documentElement.classList.remove('compact-mode');
      }

      const highContrast = localStorage.getItem('highContrast') === 'true';
      if (highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }

      // Initialize auto-backup
      BackupService.initializeAutoBackup(() => {
        // Auto-backup callback
        const systemSettings = {
          systemName: localStorage.getItem('systemName') || 'Baraton Admin Panel',
          dateFormat: localStorage.getItem('dateFormat') || 'DD-MM-YYYY',
          language: localStorage.getItem('adminLanguage') || 'en',
          timezone: localStorage.getItem('timezone') || 'Africa/Nairobi',
          adminTheme: localStorage.getItem('adminTheme'),
          compactMode: localStorage.getItem('compactMode'),
          highContrast: localStorage.getItem('highContrast'),
        };

        BackupService.createBackup(courses, users, systemSettings, currentUser);
        addNotification('Auto-Backup', 'System auto-backup completed successfully', 'success');
      });

      fetchCourses();
      fetchUsers();

      setNotifications([
        {
          id: 1,
          title: 'Welcome to Baraton Admin',
          message: 'System initialized successfully',
          time: 'Just now',
          read: false,
          type: 'success',
        },
      ]);
    };

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    setUnreadNotifications(unreadCount);
  }, [notifications]);

  useEffect(() => {
    const handleSystemNameChange = (e) => {
      setSystemSettings((prev) => ({ ...prev, systemName: e.detail }));
    };

    const handleDateFormatChange = (e) => {
      setSystemSettings((prev) => ({ ...prev, dateFormat: e.detail }));
    };

    const handleLanguageChange = (e) => {
      setSystemSettings((prev) => ({ ...prev, language: e.detail }));
    };

    const handleTimezoneChange = (e) => {
      setSystemSettings((prev) => ({ ...prev, timezone: e.detail }));
    };

    window.addEventListener('systemNameChanged', handleSystemNameChange);
    window.addEventListener('dateFormatChanged', handleDateFormatChange);
    window.addEventListener('languageChanged', handleLanguageChange);
    window.addEventListener('timezoneChanged', handleTimezoneChange);

    return () => {
      window.removeEventListener('systemNameChanged', handleSystemNameChange);
      window.removeEventListener('dateFormatChanged', handleDateFormatChange);
      window.removeEventListener('languageChanged', handleLanguageChange);
      window.removeEventListener('timezoneChanged', handleTimezoneChange);
    };
  }, []);

  const addNotification = (title, message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      title,
      message,
      time: 'Just now',
      read: false,
      type,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/exam_courses?select=*`, {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data || getMockCourses());
        const venues = [...new Set(data?.map((course) => course.venue).filter(Boolean) || [])];
        setActiveVenues(venues.length > 0 ? venues : ['Main Hall', 'Room 101']);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses(getMockCourses());
      setActiveVenues(['Main Hall', 'Room 101']);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const studentUsers = data.filter(
          (user) =>
            !user.role ||
            user.role === 'student' ||
            (user.role !== 'admin' &&
              user.role !== 'lecturer' &&
              user.role !== 'examiner' &&
              user.role !== 'coordinator')
        );
        setUsers(studentUsers || getMockUsers());
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers(getMockUsers());
    }
  };

  const handleRefresh = async () => {
    console.log('Refresh clicked by user:', currentUser?.role);

    try {
      setLoading(true);

      await fetchCourses();
      await fetchUsers();

      addNotification('Data Refreshed', 'All data has been refreshed successfully', 'success');

      console.log('Refresh completed successfully');
    } catch (error) {
      console.error('Refresh error:', error);

      addNotification('Refresh Failed', 'Failed to refresh data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async () => {
    try {
      let rowsToUse = formData.rows;
      if (!rowsToUse && formData.date && formData.time && formData.venue && formData.numStudents) {
        const suggestions = getRowAllocationSuggestions(courses, {
          date: formData.date,
          time: formData.time,
          venue: formData.venue,
          numStudents: formData.numStudents,
        });
        rowsToUse = suggestions.suggestedRows;
      }

      const courseData = {
        ...formData,
        rows: rowsToUse,
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/exam_courses`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        fetchCourses();
        addNotification('Course Added', `${formData.code} added successfully`, 'success');
      } else {
        addNotification('Error', 'Failed to add course', 'error');
      }
    } catch (error) {
      console.error('Error adding course:', error);
      addNotification('Error', 'Failed to add course', 'error');
    }
  };

  const handleBulkUpload = async (coursesData) => {
    try {
      for (const course of coursesData) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/exam_courses`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(course),
        });

        if (!response.ok) {
          throw new Error(`Failed to upload course: ${course.code}`);
        }
      }

      fetchCourses();
      return Promise.resolve();
    } catch (error) {
      console.error('Error in bulk upload:', error);
      return Promise.reject(error);
    }
  };

  const handleUpdateCourse = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/exam_courses?id=eq.${editingCourse.id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditingCourse(null);
        setShowAddModal(false);
        resetForm();
        fetchCourses();
        addNotification('Course Updated', `${formData.code} updated successfully`, 'success');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      addNotification('Error', 'Failed to update course', 'error');
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/exam_courses?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (response.ok) {
        fetchCourses();
        addNotification('Course Deleted', 'Course deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      addNotification('Error', 'Failed to delete course', 'error');
    }
  };

  const handleExport = (exportInfo) => {
    addNotification(
      'Export Successful',
      `Successfully exported ${exportInfo.count} ${exportInfo.type} as ${exportInfo.format.toUpperCase()}`,
      'success'
    );
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      date: '',
      time: '',
      venue: '',
      instructor: '',
      option: '',
      numStudents: '',
      rows: '',
    });
    setEditingCourse(null);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code || '',
      name: course.name || '',
      date: course.date || '',
      time: course.time || '',
      venue: course.venue || '',
      instructor: course.instructor || '',
      option: course.option || '',
      numStudents: course.numStudents || '',
      rows: course.rows || '',
    });
    setShowAddModal(true);
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await supabase.auth.signOut();
      localStorage.removeItem('adminUser');
      setCurrentUser(null);
      setShowLogin(true);
      addNotification('Logged Out', 'You have been logged out successfully', 'info');
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      (course.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (course.code?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesVenue = !filterVenue || course.venue === filterVenue;

    return matchesSearch && matchesVenue;
  });

  const stats = {
    totalCourses: courses.length,
    totalUsers: users.length,
    upcomingExams: courses.filter((c) => c.date && parseDate(c.date) > new Date()).length,
    todayExams: courses.filter((c) => c.date && parseDate(c.date).toDateString() === new Date().toDateString()).length,
    venues: activeVenues.length,
  };

  const isAdmin = currentUser?.role === 'admin';
  const isLecturer = currentUser?.role === 'lecturer';
  const canManageUsers = isAdmin;
  const canManageSystemSettings = isAdmin;

  if (showSignup) {
    return <LecturerSignupPage setShowSignup={setShowSignup} setCurrentUser={setCurrentUser} />;
  }

  if (!currentUser) {
    return (
      <>
        <LandingPage setShowLogin={setShowLogin} setShowSignup={setShowSignup} />
        {showLogin && (
          <LoginModal
            showLogin={showLogin}
            setShowLogin={setShowLogin}
            setCurrentUser={setCurrentUser}
            setShowSignup={setShowSignup}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NotificationPanel
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notifications={notifications}
        markAsRead={markNotificationAsRead}
        clearAllNotifications={clearAllNotifications}
      />

      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center ml-2 lg:ml-0">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{systemSettings.systemName}</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Welcome, {currentUser?.name || 'Admin'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>

              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadNotifications > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
              </button>

              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser?.name || 'Administrator'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {currentUser?.role === 'admin'
                      ? 'Administrator'
                      : currentUser?.role === 'lecturer'
                        ? 'Lecturer'
                        : currentUser?.role === 'examiner'
                          ? 'Examiner'
                          : currentUser?.role === 'coordinator'
                            ? 'Coordinator'
                            : currentUser?.role || 'User'}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {currentUser?.avatar || (currentUser?.role === 'admin' ? 'A' : 'L')}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        <aside
          className={`${
            mobileMenuOpen ? 'block fixed inset-0 z-30 bg-white dark:bg-gray-900 lg:relative lg:inset-auto' : 'hidden'
          } lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto sticky top-16`}
        >
          <div className="p-4 space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, allowed: true },
              { id: 'courses', label: 'Manage Courses', icon: BookOpen, allowed: true },
              { id: 'users', label: 'Students', icon: Users, allowed: canManageUsers },
              { id: 'settings', label: 'Settings', icon: Settings, allowed: canManageSystemSettings },
            ]
              .filter((item) => item.allowed)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-lg ${
                    currentView === item.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                  {item.id === 'users' && canManageUsers && (
                    <span className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                      {users.length}
                    </span>
                  )}
                </button>
              ))}
          </div>

          <div className="mt-8 p-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Courses Today</span>
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{stats.todayExams}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Upcoming</span>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">{stats.upcomingExams}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Active Venues</span>
                  <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">{stats.venues}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 mt-4">
            <button
              onClick={() => {
                setShowAddModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Course
            </button>
            {isAdmin && (
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={() => {
                    setShowBulkModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg hover:opacity-90 text-sm"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Bulk
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:opacity-90 text-sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </button>
              </div>
            )}
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden p-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4 mr-2" />
                Close Menu
              </button>
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">Welcome back, {currentUser?.name || 'Admin'} 👋</h1>
                    <p className="text-blue-100 opacity-90">Here's what's happening with your exam schedule today.</p>
                  </div>
                  <div className="mt-4 lg:mt-0">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 inline-block">
                      <p className="text-sm">Last updated: {formatDate(new Date())}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                  { title: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'blue' },
                  { title: 'Upcoming Exams', value: stats.upcomingExams, icon: Clock, color: 'green' },
                  { title: "Today's Exams", value: stats.todayExams, icon: Calendar, color: 'orange' },
                  { title: 'Students', value: stats.totalUsers, icon: Users, color: 'purple' },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          stat.color === 'blue'
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : stat.color === 'green'
                              ? 'bg-green-50 dark:bg-green-900/20'
                              : stat.color === 'orange'
                                ? 'bg-orange-50 dark:bg-orange-900/20'
                                : 'bg-purple-50 dark:bg-purple-900/20'
                        }`}
                      >
                        <stat.icon
                          className={`w-6 h-6 ${
                            stat.color === 'blue'
                              ? 'text-blue-600 dark:text-blue-500'
                              : stat.color === 'green'
                                ? 'text-green-600 dark:text-green-500'
                                : stat.color === 'orange'
                                  ? 'text-orange-600 dark:text-orange-500'
                                  : 'text-purple-600 dark:text-purple-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Courses</h2>
                  <button
                    onClick={() => setCurrentView('courses')}
                    className="text-sm text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 font-medium flex items-center"
                  >
                    View all <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Code</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Students</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Rows</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.slice(0, 5).map((course) => (
                        <tr key={course.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                              {course.code}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">{course.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{course.numStudents || '0'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{course.rows || 'Not set'}</td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditModal(course)}
                                className="p-1 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteCourse(course.id)}
                                  className="p-1 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentView === 'courses' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Management</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all examination courses and schedules</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {isAdmin && (
                    <button
                      onClick={() => setShowBulkModal(true)}
                      className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition font-medium text-sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Upload
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition font-medium text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course
                  </button>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:opacity-90 transition font-medium text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-600" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-600" />
                    <select
                      value={filterVenue}
                      onChange={(e) => setFilterVenue(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                    >
                      <option value="">All Venues</option>
                      {activeVenues.map((venue, idx) => (
                        <option key={idx} value={venue}>
                          {venue}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full">
                      {filteredCourses.length} courses found
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading courses...</p>
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No courses found</p>
                    <button onClick={() => setShowAddModal(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add Your First Course
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Course Details
                          </th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Schedule
                          </th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Students/Rows
                          </th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredCourses.map((course) => (
                          <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                                {course.code}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <p className="font-medium text-gray-900 dark:text-white">{course.name}</p>
                              {course.option && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{course.option}</p>}
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white">{formatDate(parseDate(course.date))}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{course.time}</p>
                                {course.venue && (
                                  <div className="flex items-center mt-1">
                                    <MapPin className="w-3 h-3 text-gray-400 mr-1" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">{course.venue}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Students: {course.numStudents || '0'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rows: {course.rows || 'Not configured'}</p>
                                {course.rows && (
                                  <div className="mt-1">
                                    <span
                                      className={`inline-block px-2 py-0.5 text-xs rounded ${
                                        course.rows.split(',').some((r) => parseInt(r) % 2 === 1)
                                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                                      }`}
                                    >
                                      {course.rows.split(',').some((r) => parseInt(r) % 2 === 1) ? 'Odd rows' : 'Even rows'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => openEditModal(course)}
                                  className="p-2 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="p-2 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'users' && canManageUsers && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage all registered users</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <Users className="w-8 h-8 opacity-80" />
                    <span className="text-3xl font-bold">{users.length}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                  <p className="text-purple-200 text-sm">All registered users in the system</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recently Registered</h3>
                  <div className="space-y-4">
                    {users.slice(0, 4).map((user) => (
                      <div key={user.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.full_name?.[0] || user.email?.[0] || 'U'}
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name || 'Unnamed User'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role || 'student'}</p>
                        </div>
                        <div className="text-right">
                          {user.student_id && (
                            <span className="block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">
                              {user.student_id}
                            </span>
                          )}
                          {user.staff_id && (
                            <span className="block mt-1 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded">
                              {user.staff_id}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          ID Number
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Joined Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {user.full_name?.[0] || user.email?.[0] || 'U'}
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name || 'Unnamed User'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role || 'student'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900 dark:text-white">{user.email}</p>
                          </td>
                          <td className="py-4 px-6">
                            {user.student_id ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                                {user.student_id}
                              </span>
                            ) : user.staff_id ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
                                {user.staff_id}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin'
                                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                                  : user.role === 'lecturer'
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                                    : user.role === 'examiner'
                                      ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
                                      : user.role === 'coordinator'
                                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300'
                                        : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {user.role || 'student'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {user.created_at ? formatDate(new Date(user.created_at)) : 'N/A'}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentView === 'settings' && canManageSystemSettings && (
            <SystemSettings
              currentUser={currentUser}
              addNotification={addNotification}
              backupService={BackupService}
              courses={courses}
              users={users}
            />
          )}

          {((currentView === 'users' && !canManageUsers) || (currentView === 'settings' && !canManageSystemSettings)) && (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Restricted</h2>
              <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this section.</p>
              <button onClick={() => setCurrentView('dashboard')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Go to Dashboard
              </button>
            </div>
          )}
        </main>
      </div>

      {showAddModal && (
        <AddCourseModal
          editingCourse={editingCourse}
          formData={formData}
          setFormData={setFormData}
          setShowAddModal={setShowAddModal}
          handleAddCourse={handleAddCourse}
          handleUpdateCourse={handleUpdateCourse}
          resetForm={resetForm}
          isAdmin={isAdmin}
          courses={courses}
        />
      )}

      {showBulkModal && (
        <BulkUploadModal
          showBulkModal={showBulkModal}
          setShowBulkModal={setShowBulkModal}
          handleBulkUpload={handleBulkUpload}
          addNotification={addNotification}
          courses={courses}
        />
      )}

      {showExportModal && (
        <ExportModal
          showExportModal={showExportModal}
          setShowExportModal={setShowExportModal}
          handleExport={handleExport}
          courses={courses}
          users={users}
        />
      )}

      {showBackupModal && (
        <BackupModal
          showBackupModal={showBackupModal}
          setShowBackupModal={setShowBackupModal}
          backupService={BackupService}
          addNotification={addNotification}
          currentUser={currentUser}
          courses={courses}
          users={users}
          systemSettings={systemSettings}
        />
      )}
    </div>
  );
}

export default App;
