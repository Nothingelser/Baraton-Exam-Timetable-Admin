const TIMEZONE_OFFSETS = {
  'Africa/Nairobi': 3,
  'UTC': 0,
  'America/New_York': -5,
  'Europe/London': 0,
  'Asia/Dubai': 4,
};

const convertToTimezone = (date, timezone) => {
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const offset = TIMEZONE_OFFSETS[timezone] || 0;
  return new Date(utcDate.getTime() + offset * 3600000);
};

export const parseDate = (dateString) => {
  try {
    if (!dateString) return new Date();

    const format = localStorage.getItem('dateFormat') || 'DD-MM-YYYY';
    const raw = String(dateString).trim();
    const clean = raw.includes(',') ? raw.split(',').slice(1).join(',').trim() : raw;

    // Always accept ISO dates directly regardless of UI format.
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return new Date(clean);
    }

    let day;
    let month;
    let year;

    if (format === 'DD-MM-YYYY' || format === 'DD/MM/YYYY') {
      const parts = clean.split(/[-/]/).map((part) => part.trim());
      if (parts.length >= 3) {
        [day, month, year] = parts;
      }
    } else if (format === 'MM/DD/YYYY') {
      const parts = clean.split(/[-/]/).map((part) => part.trim());
      if (parts.length >= 3) {
        [month, day, year] = parts;
      }
    } else if (format === 'YYYY-MM-DD') {
      const parts = clean.split(/[-/]/).map((part) => part.trim());
      if (parts.length >= 3) {
        [year, month, day] = parts;
      }
    }

    if (day && month && year) {
      const d = Number(day);
      const m = Number(month);
      const y = Number(year);

      if (!Number.isNaN(d) && !Number.isNaN(m) && !Number.isNaN(y) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return new Date(y, m - 1, d);
      }
    }

    return new Date(dateString);
  } catch {
    return new Date();
  }
};

export const formatDate = (date, dateFormat = 'DD-MM-YYYY') => {
  const timezone = localStorage.getItem('timezone') || 'Africa/Nairobi';
  let d = new Date(date);
  if (isNaN(d.getTime())) return date;

  d = convertToTimezone(d, timezone);

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[d.getDay()];

  const format = localStorage.getItem('dateFormat') || 'DD-MM-YYYY';

  switch (format) {
    case 'DD-MM-YYYY':
      return `${dayName}, ${day}-${month}-${year}`;
    case 'MM/DD/YYYY':
      return `${dayName}, ${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${dayName}, ${day}/${month}/${year}`;
    default:
      return `${dayName}, ${day}-${month}-${year}`;
  }
};

export const formatDateTime = (date) => {
  const timezone = localStorage.getItem('timezone') || 'Africa/Nairobi';
  let d = new Date(date);
  if (isNaN(d.getTime())) return date;

  d = convertToTimezone(d, timezone);

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[d.getDay()];

  const format = localStorage.getItem('dateFormat') || 'DD-MM-YYYY';

  switch (format) {
    case 'DD-MM-YYYY':
      return `${dayName}, ${day}-${month}-${year} ${hours}:${minutes}`;
    case 'MM/DD/YYYY':
      return `${dayName}, ${month}/${day}/${year} ${hours}:${minutes}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    case 'DD/MM/YYYY':
      return `${dayName}, ${day}/${month}/${year} ${hours}:${minutes}`;
    default:
      return `${dayName}, ${day}-${month}-${year} ${hours}:${minutes}`;
  }
};
