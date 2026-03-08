import { useEffect } from 'react';

const PHRASES = {
  sw: {
    'Welcome': 'Karibu',
    'Welcome Back': 'Karibu Tena',
    'Dashboard': 'Dashibodi',
    'Manage Courses': 'Simamia Kozi',
    'Course Management': 'Usimamizi wa Kozi',
    'Students': 'Wanafunzi',
    'Settings': 'Mipangilio',
    'System Settings': 'Mipangilio ya Mfumo',
    'User Management': 'Usimamizi wa Watumiaji',
    'Refresh': 'Sasisha',
    'Refreshing...': 'Inasasisha...',
    'Search courses...': 'Tafuta kozi...',
    'All Venues': 'Kumbi Zote',
    'No courses found': 'Hakuna kozi zilizopatikana',
    'Loading courses...': 'Inapakia kozi...',
    'Add Course': 'Ongeza Kozi',
    'Update Course': 'Sasisha Kozi',
    'Delete': 'Futa',
    'Cancel': 'Ghairi',
    'Confirm': 'Thibitisha',
    'Close': 'Funga',
    'Save': 'Hifadhi',
    'Export Data': 'Hamisha Data',
    'Bulk Upload': 'Pakia Kwa Wingi',
    'Backup & Restore': 'Hifadhi na Rejesha',
    'Notifications': 'Arifa',
    'Access Restricted': 'Ufikiaji Umezuiwa',
    "You don't have permission to access this section.": 'Huna ruhusa ya kufikia sehemu hii.',
    'Go to Dashboard': 'Rudi Dashibodi',
    'View Logs': 'Tazama Kumbukumbu',
    'Last Login': 'Kuingia Mara ya Mwisho',
    'Joined Date': 'Tarehe ya Kujiunga',
    'Activity': 'Shughuli',
    'Code': 'Nambari',
    'Name': 'Jina',
    'Date': 'Tarehe',
    'Time': 'Muda',
    'Venue': 'Ukumbi',
    'Instructor': 'Mwalimu',
    'Rows': 'Mistari',
    'Students/Rows': 'Wanafunzi/Mistari',
    'Actions': 'Vitendo',
    'Previous': 'Iliyopita',
    'Next': 'Ifuatayo',
  },
  fr: {
    'Welcome': 'Bienvenue',
    'Welcome Back': 'Bon retour',
    'Dashboard': 'Tableau de bord',
    'Manage Courses': 'Gerer les cours',
    'Course Management': 'Gestion des cours',
    'Students': 'Etudiants',
    'Settings': 'Parametres',
    'System Settings': 'Parametres systeme',
    'User Management': 'Gestion des utilisateurs',
    'Refresh': 'Actualiser',
    'Refreshing...': 'Actualisation...',
    'Search courses...': 'Rechercher des cours...',
    'All Venues': 'Tous les lieux',
    'No courses found': 'Aucun cours trouve',
    'Loading courses...': 'Chargement des cours...',
    'Add Course': 'Ajouter un cours',
    'Update Course': 'Mettre a jour le cours',
    'Delete': 'Supprimer',
    'Cancel': 'Annuler',
    'Confirm': 'Confirmer',
    'Close': 'Fermer',
    'Save': 'Enregistrer',
    'Export Data': 'Exporter les donnees',
    'Bulk Upload': 'Import en masse',
    'Backup & Restore': 'Sauvegarde et restauration',
    'Notifications': 'Notifications',
    'Access Restricted': 'Acces restreint',
    "You don't have permission to access this section.": "Vous n'avez pas la permission d'acceder a cette section.",
    'Go to Dashboard': 'Aller au tableau de bord',
    'View Logs': 'Voir les journaux',
    'Last Login': 'Derniere connexion',
    'Joined Date': "Date d'inscription",
    'Activity': 'Activite',
    'Code': 'Code',
    'Name': 'Nom',
    'Date': 'Date',
    'Time': 'Heure',
    'Venue': 'Lieu',
    'Instructor': 'Enseignant',
    'Rows': 'Rangees',
    'Students/Rows': 'Etudiants/Rangees',
    'Actions': 'Actions',
    'Previous': 'Precedent',
    'Next': 'Suivant',
  },
  es: {
    'Welcome': 'Bienvenido',
    'Welcome Back': 'Bienvenido de nuevo',
    'Dashboard': 'Panel',
    'Manage Courses': 'Gestionar cursos',
    'Course Management': 'Gestion de cursos',
    'Students': 'Estudiantes',
    'Settings': 'Configuracion',
    'System Settings': 'Configuracion del sistema',
    'User Management': 'Gestion de usuarios',
    'Refresh': 'Actualizar',
    'Refreshing...': 'Actualizando...',
    'Search courses...': 'Buscar cursos...',
    'All Venues': 'Todos los lugares',
    'No courses found': 'No se encontraron cursos',
    'Loading courses...': 'Cargando cursos...',
    'Add Course': 'Agregar curso',
    'Update Course': 'Actualizar curso',
    'Delete': 'Eliminar',
    'Cancel': 'Cancelar',
    'Confirm': 'Confirmar',
    'Close': 'Cerrar',
    'Save': 'Guardar',
    'Export Data': 'Exportar datos',
    'Bulk Upload': 'Carga masiva',
    'Backup & Restore': 'Respaldo y restauracion',
    'Notifications': 'Notificaciones',
    'Access Restricted': 'Acceso restringido',
    "You don't have permission to access this section.": 'No tienes permiso para acceder a esta seccion.',
    'Go to Dashboard': 'Ir al panel',
    'View Logs': 'Ver registros',
    'Last Login': 'Ultimo acceso',
    'Joined Date': 'Fecha de registro',
    'Activity': 'Actividad',
    'Code': 'Codigo',
    'Name': 'Nombre',
    'Date': 'Fecha',
    'Time': 'Hora',
    'Venue': 'Lugar',
    'Instructor': 'Instructor',
    'Rows': 'Filas',
    'Students/Rows': 'Estudiantes/Filas',
    'Actions': 'Acciones',
    'Previous': 'Anterior',
    'Next': 'Siguiente',
  },
  ar: {
    'Welcome': 'مرحبا',
    'Welcome Back': 'مرحبا بعودتك',
    'Dashboard': 'لوحة التحكم',
    'Manage Courses': 'إدارة المقررات',
    'Course Management': 'إدارة المقررات',
    'Students': 'الطلاب',
    'Settings': 'الإعدادات',
    'System Settings': 'إعدادات النظام',
    'User Management': 'إدارة المستخدمين',
    'Refresh': 'تحديث',
    'Refreshing...': 'جار التحديث...',
    'Search courses...': 'ابحث عن المقررات...',
    'All Venues': 'كل القاعات',
    'No courses found': 'لا توجد مقررات',
    'Loading courses...': 'جار تحميل المقررات...',
    'Add Course': 'إضافة مقرر',
    'Update Course': 'تحديث المقرر',
    'Delete': 'حذف',
    'Cancel': 'إلغاء',
    'Confirm': 'تأكيد',
    'Close': 'إغلاق',
    'Save': 'حفظ',
    'Export Data': 'تصدير البيانات',
    'Bulk Upload': 'رفع جماعي',
    'Backup & Restore': 'نسخ احتياطي واستعادة',
    'Notifications': 'الإشعارات',
    'Access Restricted': 'الوصول مقيّد',
    "You don't have permission to access this section.": 'ليس لديك إذن للوصول إلى هذا القسم.',
    'Go to Dashboard': 'العودة إلى لوحة التحكم',
    'View Logs': 'عرض السجلات',
    'Last Login': 'آخر تسجيل دخول',
    'Joined Date': 'تاريخ الانضمام',
    'Activity': 'النشاط',
    'Code': 'الرمز',
    'Name': 'الاسم',
    'Date': 'التاريخ',
    'Time': 'الوقت',
    'Venue': 'القاعة',
    'Instructor': 'المحاضر',
    'Rows': 'الصفوف',
    'Students/Rows': 'الطلاب/الصفوف',
    'Actions': 'الإجراءات',
    'Previous': 'السابق',
    'Next': 'التالي',
  },
};

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);

const translateText = (text, language) => {
  if (!text || !language || language === 'en') return text;
  const dict = PHRASES[language];
  if (!dict) return text;

  const trimmed = text.trim();
  if (!trimmed) return text;

  if (dict[trimmed]) {
    return text.replace(trimmed, dict[trimmed]);
  }

  const keys = Object.keys(dict).sort((a, b) => b.length - a.length);
  let translated = text;
  for (const key of keys) {
    if (translated.includes(key)) {
      translated = translated.split(key).join(dict[key]);
    }
  }
  return translated;
};

export const useDomI18n = (language) => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const originalText = new WeakMap();
    const originalAttrs = new WeakMap();
    let rafId = null;

    const translateAttributes = (el) => {
      const attrs = ['placeholder', 'title', 'aria-label'];
      const saved = originalAttrs.get(el) || {};

      attrs.forEach((attr) => {
        const value = el.getAttribute(attr);
        if (value === null) return;
        if (!(attr in saved)) saved[attr] = value;
        const translated = translateText(saved[attr], language);
        if (translated !== value) el.setAttribute(attr, translated);
      });

      if (Object.keys(saved).length > 0) {
        originalAttrs.set(el, saved);
      }
    };

    const translateNodeTree = (rootNode) => {
      if (!rootNode) return;

      if (rootNode.nodeType === Node.TEXT_NODE) {
        const node = rootNode;
        const parent = node.parentElement;
        if (!parent || SKIP_TAGS.has(parent.tagName)) return;

        const current = node.nodeValue || '';
        if (!current.trim()) return;
        if (!originalText.has(node)) originalText.set(node, current);

        const source = originalText.get(node) || current;
        const translated = translateText(source, language);
        if (translated !== current) node.nodeValue = translated;
        return;
      }

      if (rootNode.nodeType !== Node.ELEMENT_NODE) return;
      const rootEl = rootNode;
      if (SKIP_TAGS.has(rootEl.tagName)) return;

      translateAttributes(rootEl);

      const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const textNode = walker.currentNode;
        const parent = textNode.parentElement;
        if (!parent || SKIP_TAGS.has(parent.tagName)) continue;

        const current = textNode.nodeValue || '';
        if (!current.trim()) continue;
        if (!originalText.has(textNode)) originalText.set(textNode, current);

        const source = originalText.get(textNode) || current;
        const translated = translateText(source, language);
        if (translated !== current) textNode.nodeValue = translated;
      }

      rootEl.querySelectorAll('*').forEach((el) => {
        if (!SKIP_TAGS.has(el.tagName)) translateAttributes(el);
      });
    };

    const runFullTranslation = () => {
      rafId = null;
      translateNodeTree(document.body);
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    };

    const scheduleFullTranslation = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(runFullTranslation);
    };

    scheduleFullTranslation();
    const observer = new MutationObserver((mutations) => {
      // Translate only newly added nodes instead of rescanning whole DOM.
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => translateNodeTree(node));
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [language]);
};
