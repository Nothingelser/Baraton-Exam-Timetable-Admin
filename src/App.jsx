import React, { useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
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
import { formatDate, parseDate, formatDateTime } from './utils/dateUtils';
import { useDomI18n } from './utils/domI18n';
import { getRowAllocationSuggestions } from './utils/rowAllocation';

import LandingPage from './components/landing/LandingPage';
import LoginModal from './components/auth/LoginModal';
import LecturerSignupPage from './components/auth/LecturerSignupPage';
import NotificationPanel from './components/notifications/NotificationPanel';
import AddCourseModal from './components/modals/AddCourseModal';
import BulkUploadModal from './components/modals/BulkUploadModal';
import ExportModal from './components/modals/ExportModal';
import BackupModal from './components/modals/BackupModal';
import ActivityLogModal from './components/modals/ActivityLogModal';
import ConfirmModal from './components/modals/ConfirmModal';
import SystemSettings from './components/settings/SystemSettings';
import ActivityLogger from './services/activityLogger';

const UI_TRANSLATIONS = {
  en: {
    welcome: 'Welcome',
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    dashboard: 'Dashboard',
    manageCourses: 'Manage Courses',
    users: 'Users',
    settings: 'Settings',
    courseManagement: 'Course Management',
    courseManagementDesc: 'Manage all examination courses and schedules',
    searchCourses: 'Search courses...',
    allVenues: 'All Venues',
    coursesFound: 'courses found',
    loadingCourses: 'Loading courses...',
    noCoursesFound: 'No courses found',
    addFirstCourse: 'Add Your First Course',
    userManagement: 'User Management',
    userManagementDesc: 'View and manage all registered users',
    accessRestricted: 'Access Restricted',
    noPermission: "You don't have permission to access this section.",
    goToDashboard: 'Go to Dashboard',
  },
  sw: {
    welcome: 'Karibu',
    refresh: 'Sasisha',
    refreshing: 'Inasasisha...',
    dashboard: 'Dashibodi',
    manageCourses: 'Simamia Kozi',
    users: 'Watumiaji',
    settings: 'Mipangilio',
    courseManagement: 'Usimamizi wa Kozi',
    courseManagementDesc: 'Simamia kozi na ratiba zote za mitihani',
    searchCourses: 'Tafuta kozi...',
    allVenues: 'Kumbi Zote',
    coursesFound: 'kozi zimepatikana',
    loadingCourses: 'Inapakia kozi...',
    noCoursesFound: 'Hakuna kozi zilizopatikana',
    addFirstCourse: 'Ongeza Kozi ya Kwanza',
    userManagement: 'Usimamizi wa Watumiaji',
    userManagementDesc: 'Tazama na simamia watumiaji wote waliosajiliwa',
    accessRestricted: 'Ufikiaji Umezuiwa',
    noPermission: 'Huna ruhusa ya kufikia sehemu hii.',
    goToDashboard: 'Rudi Dashibodi',
  },
  fr: {
    welcome: 'Bienvenue',
    refresh: 'Actualiser',
    refreshing: 'Actualisation...',
    dashboard: 'Tableau de bord',
    manageCourses: 'Gerer les cours',
    users: 'Utilisateurs',
    settings: 'Parametres',
    courseManagement: 'Gestion des cours',
    courseManagementDesc: "Gerez tous les cours et horaires d'examen",
    searchCourses: 'Rechercher des cours...',
    allVenues: 'Tous les lieux',
    coursesFound: 'cours trouves',
    loadingCourses: 'Chargement des cours...',
    noCoursesFound: 'Aucun cours trouve',
    addFirstCourse: 'Ajouter votre premier cours',
    userManagement: 'Gestion des utilisateurs',
    userManagementDesc: 'Voir et gerer tous les utilisateurs inscrits',
    accessRestricted: 'Acces restreint',
    noPermission: "Vous n'avez pas la permission d'acceder a cette section.",
    goToDashboard: 'Aller au tableau de bord',
  },
  es: {
    welcome: 'Bienvenido',
    refresh: 'Actualizar',
    refreshing: 'Actualizando...',
    dashboard: 'Panel',
    manageCourses: 'Gestionar cursos',
    users: 'Usuarios',
    settings: 'Configuracion',
    courseManagement: 'Gestion de cursos',
    courseManagementDesc: 'Gestiona todos los cursos y horarios de examenes',
    searchCourses: 'Buscar cursos...',
    allVenues: 'Todos los lugares',
    coursesFound: 'cursos encontrados',
    loadingCourses: 'Cargando cursos...',
    noCoursesFound: 'No se encontraron cursos',
    addFirstCourse: 'Agregar tu primer curso',
    userManagement: 'Gestion de usuarios',
    userManagementDesc: 'Ver y gestionar todos los usuarios registrados',
    accessRestricted: 'Acceso restringido',
    noPermission: 'No tienes permiso para acceder a esta seccion.',
    goToDashboard: 'Ir al panel',
  },
  ar: {
    welcome: 'مرحبا',
    refresh: 'تحديث',
    refreshing: 'جار التحديث...',
    dashboard: 'لوحة التحكم',
    manageCourses: 'إدارة المقررات',
    users: 'المستخدمون',
    settings: 'الإعدادات',
    courseManagement: 'إدارة المقررات',
    courseManagementDesc: 'إدارة جميع المقررات وجداول الامتحانات',
    searchCourses: 'ابحث عن المقررات...',
    allVenues: 'كل القاعات',
    coursesFound: 'مقررات موجودة',
    loadingCourses: 'جار تحميل المقررات...',
    noCoursesFound: 'لا توجد مقررات',
    addFirstCourse: 'أضف أول مقرر',
    userManagement: 'إدارة المستخدمين',
    userManagementDesc: 'عرض وإدارة جميع المستخدمين المسجلين',
    accessRestricted: 'الوصول مقيّد',
    noPermission: 'ليس لديك إذن للوصول إلى هذا القسم.',
    goToDashboard: 'العودة إلى لوحة التحكم',
  },
};

function App() {
  const COURSES_PER_PAGE = 25;
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
  const [coursesCount, setCoursesCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [hasLoadedCourses, setHasLoadedCourses] = useState(false);
  const [hasLoadedUsers, setHasLoadedUsers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVenue, setFilterVenue] = useState('');
  const [coursesPage, setCoursesPage] = useState(1);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeVenues, setActiveVenues] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: async () => {},
  });
  const [, startTransition] = useTransition();
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
            
            supabase
              .from('profiles')
              .update({
                last_sign_in_at: new Date().toISOString(),
              })
              .eq('id', session.user.id)
              .then(() => {})
              .catch((updateError) => console.error('Error updating last sign-in:', updateError));
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

      fetchFastCounts();
      fetchCourses();

      setNotifications([
        {
          id: 1,
          title: 'Welcome to Baraton Admin',
          message: 'System initialized successfully',
          createdAt: new Date().toISOString(),
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
    if ((currentView === 'users' || currentView === 'settings') && !hasLoadedUsers) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, hasLoadedUsers]);

  useEffect(() => {
    // Close notifications drawer when switching between main views.
    setShowNotifications(false);
  }, [currentView]);

  useEffect(() => {
    startTransition(() => {
      setSearchQuery(searchInput);
    });
  }, [searchInput, startTransition]);

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
      createdAt: new Date().toISOString(),
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

  const normalizeCourseFromDb = (course) => ({
    ...course,
    numStudents: course.numStudents ?? course.num_students ?? '',
  });

  const mapCourseToDbPayload = (courseInput) => {
    const { numStudents, ...rest } = courseInput;
    const parsedStudents =
      numStudents === '' || numStudents === null || numStudents === undefined
        ? null
        : Number.isNaN(Number(numStudents))
          ? null
          : Number(numStudents);

    return {
      ...rest,
      num_students: parsedStudents,
    };
  };

  const fetchCourses = async ({ manageLoading = true } = {}) => {
    if (manageLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_courses')
        .select('id, code, name, date, time, venue, instructor, option, num_students, rows');
      if (error) throw error;

      const normalizedCourses = (data || []).map(normalizeCourseFromDb);
      setCourses(normalizedCourses);
      setCoursesCount(normalizedCourses.length);
      setHasLoadedCourses(true);
      const venues = [...new Set(normalizedCourses.map((course) => course.venue).filter(Boolean) || [])];
      setActiveVenues(venues);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
      setActiveVenues([]);
      setHasLoadedCourses(false);
    }
    if (manageLoading) setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, student_id, staff_id, created_at, last_sign_in_at');
      if (error) throw error;
      const userRows = data || [];
      setUsers(userRows);
      setUsersCount(userRows.length);
      setHasLoadedUsers(true);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setHasLoadedUsers(false);
    }
  };

  const fetchFastCounts = async () => {
    try {
      const [{ count: courseCount, error: coursesCountError }, { count: userCount, error: usersCountError }] = await Promise.all([
        supabase.from('exam_courses').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      if (coursesCountError) throw coursesCountError;
      if (usersCountError) throw usersCountError;

      setCoursesCount(courseCount || 0);
      setUsersCount(userCount || 0);
    } catch (error) {
      console.error('Error fetching fast counts:', error);
    }
  };

  const handleRefresh = async () => {
    console.log('Refresh clicked by user:', currentUser?.role);

    try {
      setIsRefreshing(true);
      setLoading(true);

      const refreshTasks = [fetchFastCounts(), fetchCourses({ manageLoading: false })];
      if (currentView === 'users' || currentView === 'settings' || hasLoadedUsers) {
        refreshTasks.push(fetchUsers());
      }
      await Promise.all(refreshTasks);

      addNotification('Data Refreshed', 'All data has been refreshed successfully', 'success');

      console.log('Refresh completed successfully');
    } catch (error) {
      console.error('Refresh error:', error);

      addNotification('Refresh Failed', 'Failed to refresh data. Please try again.', 'error');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const openConfirm = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', onConfirm }) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const performAddCourse = async () => {
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
      const payload = mapCourseToDbPayload(courseData);

      const response = await fetch(`${SUPABASE_URL}/rest/v1/exam_courses`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        fetchCourses();
        addNotification('Course Added', `${formData.code} added successfully`, 'success');
        await ActivityLogger.logActivity(currentUser?.id, 'Course Added', {
          id: null,
          code: courseData.code,
          name: courseData.name,
          date: courseData.date,
          time: courseData.time,
        });
      } else {
        addNotification('Error', 'Failed to add course', 'error');
      }
    } catch (error) {
      console.error('Error adding course:', error);
      addNotification('Error', 'Failed to add course', 'error');
    }
  };

  const handleAddCourse = async () => {
    openConfirm({
      title: 'Confirm Course Addition',
      message: `Add course ${formData.code || 'Untitled'} to the system?`,
      confirmText: 'Add Course',
      type: 'info',
      onConfirm: performAddCourse,
    });
  };

  const handleBulkUpload = async (coursesData) => {
    try {
      for (const course of coursesData) {
        const payload = mapCourseToDbPayload(course);
        const response = await fetch(`${SUPABASE_URL}/rest/v1/exam_courses`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
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

  const performUpdateCourse = async () => {
    try {
      if (!editingCourse?.id) {
        addNotification('Update Failed', 'No course selected for update', 'error');
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/exam_courses?id=eq.${editingCourse.id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(mapCourseToDbPayload(formData)),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || `Update failed with status ${response.status}`);
      }

      await fetchCourses();
      setEditingCourse(null);
      setShowAddModal(false);
      resetForm();
      addNotification('Course Updated', `${formData.code} updated successfully`, 'success');
      await ActivityLogger.logActivity(currentUser?.id, 'Course Updated', {
        id: editingCourse?.id || null,
        code: formData.code,
        name: formData.name,
        date: formData.date,
        time: formData.time,
      });
    } catch (error) {
      console.error('Error updating course:', error);
      addNotification('Update Failed', `Failed to update course: ${error.message}`, 'error');
    }
  };

  const handleUpdateCourse = async () => {
    openConfirm({
      title: 'Confirm Course Update',
      message: `Save updates to course ${formData.code || 'this course'}?`,
      confirmText: 'Update Course',
      type: 'info',
      onConfirm: performUpdateCourse,
    });
  };

  const performDeleteCourse = async (id) => {
    try {
      const deletedCourse = courses.find((course) => course.id === id);
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
        await ActivityLogger.logActivity(currentUser?.id, 'Course Deleted', {
          id,
          code: deletedCourse?.code || null,
          name: deletedCourse?.name || null,
          date: deletedCourse?.date || null,
          time: deletedCourse?.time || null,
        });
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      addNotification('Error', 'Failed to delete course', 'error');
    }
  };

  const handleDeleteCourse = async (id) => {
    const course = courses.find((c) => c.id === id);
    openConfirm({
      title: 'Confirm Course Deletion',
      message: `Delete ${course?.code || 'this course'}${course?.name ? ` - ${course.name}` : ''}? This action cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: () => performDeleteCourse(id),
    });
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

  const performLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('adminUser');
    setCurrentUser(null);
    setShowLogin(true);
    addNotification('Logged Out', 'You have been logged out successfully', 'info');
  };

  const handleLogout = async () => {
    openConfirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      type: 'danger',
      onConfirm: performLogout,
    });
  };

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const navigateToView = (viewId) => {
    startTransition(() => {
      setCurrentView(viewId);
      setMobileMenuOpen(false);
    });
  };

  const filteredCourses = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.toLowerCase().trim();

    return courses.filter((course) => {
      const matchesSearch =
        !normalizedQuery ||
        (course.name?.toLowerCase() || '').includes(normalizedQuery) ||
        (course.code?.toLowerCase() || '').includes(normalizedQuery);

      const matchesVenue = !filterVenue || course.venue === filterVenue;

      return matchesSearch && matchesVenue;
    });
  }, [courses, deferredSearchQuery, filterVenue]);

  const totalCoursePages = useMemo(
    () => Math.max(1, Math.ceil(filteredCourses.length / COURSES_PER_PAGE)),
    [filteredCourses.length, COURSES_PER_PAGE]
  );

  const paginatedCourses = useMemo(() => {
    const startIndex = (coursesPage - 1) * COURSES_PER_PAGE;
    return filteredCourses.slice(startIndex, startIndex + COURSES_PER_PAGE);
  }, [filteredCourses, coursesPage, COURSES_PER_PAGE]);

  useEffect(() => {
    setCoursesPage(1);
  }, [deferredSearchQuery, filterVenue, currentView]);

  useEffect(() => {
    if (coursesPage > totalCoursePages) {
      setCoursesPage(totalCoursePages);
    }
  }, [coursesPage, totalCoursePages]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();

    return {
      totalCourses: hasLoadedCourses ? courses.length : coursesCount,
      totalUsers: hasLoadedUsers ? users.length : usersCount,
      upcomingExams: courses.filter((c) => c.date && parseDate(c.date) > now).length,
      todayExams: courses.filter((c) => c.date && parseDate(c.date).toDateString() === today).length,
      venues: activeVenues.length,
    };
  }, [courses, users.length, activeVenues.length, hasLoadedCourses, hasLoadedUsers, coursesCount, usersCount]);

  const isAdmin = currentUser?.role === 'admin';
  const isLecturer = currentUser?.role === 'lecturer';
  const canManageUsers = isAdmin;
  const canManageSystemSettings = isAdmin;
  const t = (key, fallback) => UI_TRANSLATIONS[systemSettings.language]?.[key] || fallback;
  useDomI18n(systemSettings.language);

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
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('welcome', 'Welcome')}, {currentUser?.name || 'Admin'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
              { id: 'courses', label: t('manageCourses', 'Manage Courses'), icon: BookOpen, allowed: true },
              { id: 'users', label: t('users', 'Users'), icon: Users, allowed: canManageUsers },
              { id: 'settings', label: t('settings', 'Settings'), icon: Settings, allowed: canManageSystemSettings },
            ]
              .map((item) => ({ ...item, label: item.id === 'dashboard' ? t('dashboard', 'Dashboard') : item.label }))
              .filter((item) => item.allowed)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigateToView(item.id)}
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
                      {stats.totalUsers}
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
                  { title: 'Users', value: stats.totalUsers, icon: Users, color: 'purple' },
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
                    onClick={() => navigateToView('courses')}
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
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('courseManagement', 'Course Management')}</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{t('courseManagementDesc', 'Manage all examination courses and schedules')}</p>
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
                      placeholder={t('searchCourses', 'Search courses...')}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
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
                      <option value="">{t('allVenues', 'All Venues')}</option>
                      {activeVenues.map((venue, idx) => (
                        <option key={idx} value={venue}>
                          {venue}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full">
                      {filteredCourses.length} {t('coursesFound', 'courses found')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">{t('loadingCourses', 'Loading courses...')}</p>
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('noCoursesFound', 'No courses found')}</p>
                    <button onClick={() => setShowAddModal(true)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      {t('addFirstCourse', 'Add Your First Course')}
                    </button>
                  </div>
                ) : (
                  <>
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
                          {paginatedCourses.map((course) => (
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
                                  <p className="text-sm text-gray-900 dark:text-white">{course.date ? formatDate(course.date) : 'No date'}</p>
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
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Showing {(coursesPage - 1) * COURSES_PER_PAGE + 1}-{Math.min(coursesPage * COURSES_PER_PAGE, filteredCourses.length)} of {filteredCourses.length}
                      </p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCoursesPage((prev) => Math.max(1, prev - 1))}
                          disabled={coursesPage === 1}
                          className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Previous
                        </button>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Page {coursesPage} / {totalCoursePages}
                        </span>
                        <button
                          onClick={() => setCoursesPage((prev) => Math.min(totalCoursePages, prev + 1))}
                          disabled={coursesPage >= totalCoursePages}
                          className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {currentView === 'users' && canManageUsers && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('userManagement', 'User Management')}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{t('userManagementDesc', 'View and manage all registered users')}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <Users className="w-8 h-8 opacity-80" />
                    <span className="text-3xl font-bold">{stats.totalUsers}</span>
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
                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Activity
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
                              <span className="text-gray-400">-</span>
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
                              {user.created_at ? formatDate(user.created_at) : 'Unknown'}
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : 'Never'}
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowActivityModal(true);
                              }}
                              className="text-sm text-blue-600 dark:text-blue-500 hover:underline"
                            >
                              View Logs
                            </button>
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('accessRestricted', 'Access Restricted')}</h2>
              <p className="text-gray-600 dark:text-gray-400">{t('noPermission', "You don't have permission to access this section.")}</p>
              <button onClick={() => navigateToView('dashboard')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {t('goToDashboard', 'Go to Dashboard')}
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

      {showActivityModal && selectedUser && (
        <ActivityLogModal
          user={selectedUser}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedUser(null);
          }}
        />
      )}

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

export default App;
