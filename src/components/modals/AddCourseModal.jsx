import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, RefreshCw, X } from 'lucide-react';
import { getRowAllocationSuggestions } from '../../utils/rowAllocation.js';

function AddCourseModal({
  editingCourse,
  formData,
  setFormData,
  setShowAddModal,
  handleAddCourse,
  handleUpdateCourse,
  resetForm,
  isAdmin,
  courses,
}) {
  const [errors, setErrors] = useState({});
  const [rowsSuggestions, setRowsSuggestions] = useState('');
  const [allocationWarning, setAllocationWarning] = useState('');
  const [occupiedRows, setOccupiedRows] = useState([]);
  const [concurrentCourses, setConcurrentCourses] = useState(0);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code?.trim()) newErrors.code = 'Course code is required';
    if (!formData.name?.trim()) newErrors.name = 'Course name is required';
    if (!formData.date?.trim()) newErrors.date = 'Date is required';

    const dateFormat = localStorage.getItem('dateFormat') || 'DD-MM-YYYY';

    if (formData.date) {
      if (dateFormat === 'DD-MM-YYYY') {
        if (!/^[A-Za-z]{3},\s\d{2}-\d{2}-\d{4}$/.test(formData.date.trim())) {
          newErrors.date = 'Use format: Day, DD-MM-YYYY (e.g., Mon, 20-01-2025)';
        }
      } else if (dateFormat === 'MM/DD/YYYY') {
        if (!/^[A-Za-z]{3},\s\d{2}\/\d{2}\/\d{4}$/.test(formData.date.trim())) {
          newErrors.date = 'Use format: Day, MM/DD/YYYY (e.g., Mon, 01/20/2025)';
        }
      } else if (dateFormat === 'YYYY-MM-DD') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date.trim())) {
          newErrors.date = 'Use format: YYYY-MM-DD (e.g., 2025-01-20)';
        }
      }
    }

    if (formData.time && !/^\d{1,2}:\d{2}\s(AM|PM)-\d{1,2}:\d{2}\s(AM|PM)$/.test(formData.time.trim())) {
      newErrors.time = 'Use format: HH:MM AM-HH:MM PM (e.g., 09:00 AM-12:00 PM)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateRowAllocation = () => {
    if (formData.date && formData.time && formData.venue && formData.numStudents) {
      const suggestions = getRowAllocationSuggestions(courses, {
        date: formData.date,
        time: formData.time,
        venue: formData.venue,
        numStudents: formData.numStudents,
        id: editingCourse?.id,
      });

      setRowsSuggestions(suggestions.suggestedRows);
      setAllocationWarning(suggestions.warning);
      setOccupiedRows(suggestions.occupiedRows);
      setConcurrentCourses(suggestions.concurrentCourses);

      if (suggestions.suggestedRows && !formData.rows) {
        setFormData((prev) => ({
          ...prev,
          rows: suggestions.suggestedRows,
        }));
      }
    } else {
      setRowsSuggestions('');
      setAllocationWarning('');
      setOccupiedRows([]);
      setConcurrentCourses(0);
    }
  };

  useEffect(() => {
    updateRowAllocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date, formData.time, formData.venue, formData.numStudents]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      if (editingCourse) {
        handleUpdateCourse();
      } else {
        handleAddCourse();
      }
    }
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    const dateFormat = localStorage.getItem('dateFormat') || 'DD-MM-YYYY';

    if (dateFormat === 'DD-MM-YYYY') {
      if (value.length === 2 || value.length === 5) {
        setFormData({ ...formData, date: value + '-' });
      } else {
        setFormData({ ...formData, date: value });
      }
    } else if (dateFormat === 'MM/DD/YYYY') {
      if (value.length === 2 || value.length === 5) {
        setFormData({ ...formData, date: value + '/' });
      } else {
        setFormData({ ...formData, date: value });
      }
    } else {
      setFormData({ ...formData, date: value });
    }
  };

  const handleNumStudentsChange = (value) => {
    setFormData({
      ...formData,
      numStudents: value,
    });
  };

  const getDatePlaceholder = () => {
    const dateFormat = localStorage.getItem('dateFormat') || 'DD-MM-YYYY';
    switch (dateFormat) {
      case 'DD-MM-YYYY':
        return 'e.g., Mon, 20-01-2025';
      case 'MM/DD/YYYY':
        return 'e.g., Mon, 01/20/2025';
      case 'YYYY-MM-DD':
        return 'e.g., 2025-01-20';
      case 'DD/MM/YYYY':
        return 'e.g., Mon, 20/01/2025';
      default:
        return 'e.g., Mon, 20-01-2025';
    }
  };

  const getDateFormatDescription = () => {
    const dateFormat = localStorage.getItem('dateFormat') || 'DD-MM-YYYY';
    return `Format: ${dateFormat
      .replace('DD', 'Day')
      .replace('MM', 'Month')
      .replace('YYYY', 'Year')} (${getDatePlaceholder()})`;
  };

  const handleAutoAllocate = () => {
    updateRowAllocation();
    if (rowsSuggestions) {
      setFormData((prev) => ({
        ...prev,
        rows: rowsSuggestions,
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingCourse ? '✏️ Edit Course' : '➕ Add New Course'}
            </h2>
            <button
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {editingCourse ? 'Update course information' : 'Add a new examination course to the system'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                  errors.code ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., CSIS311"
                required
              />
              {errors.code && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Database Systems"
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.date}
                onChange={handleDateChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                  errors.date ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={getDatePlaceholder()}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{getDateFormatDescription()}</p>
              {errors.date && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time</label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                  errors.time ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., 09:00 AM-12:00 PM"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Format: HH:MM AM-HH:MM PM (e.g., 09:00 AM-12:00 PM)
              </p>
              {errors.time && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.time}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Venue</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Enter venue name (e.g., Main Hall, Room 101)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructor</label>
              <input
                type="text"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Enter instructor name (e.g., Dr. John Smith)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Option</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Main', 'Group A', 'Group B', 'Group C'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, option: type })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.option === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Exam Room Setup</h4>
              <button
                type="button"
                onClick={handleAutoAllocate}
                className="text-sm text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 font-medium flex items-center"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Auto-Allocate Rows
              </button>
            </div>

            {allocationWarning && (
              <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{allocationWarning}</p>
                    {occupiedRows.length > 0 && (
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        Currently occupied rows: <span className="font-mono font-bold">{occupiedRows.join(', ')}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Students
                </label>
                <input
                  type="number"
                  value={formData.numStudents || ''}
                  onChange={(e) => handleNumStudentsChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., 50"
                  min="1"
                  max="500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Total number of students registered for this exam
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rows Allocation</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.rows || ''}
                    onChange={(e) => setFormData({ ...formData, rows: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="e.g., 1, 3, 5, 7"
                  />
                  {rowsSuggestions && formData.rows !== rowsSuggestions && (
                    <div className="absolute right-0 top-0 h-full flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, rows: rowsSuggestions })}
                        className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                        title="Use suggested rows"
                      >
                        Use suggestion
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {rowsSuggestions && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      <Check className="w-3 h-3 inline mr-1" />
                      Suggested rows: <span className="font-mono font-bold">{rowsSuggestions}</span>
                    </p>
                  )}
                  {concurrentCourses > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {concurrentCourses} other course(s) scheduled in same venue at same time
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    System automatically avoids adjacent rows for exam security
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Row Allocation Guide:</h5>
              <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <p>• System avoids rows already occupied by other courses at same time/venue</p>
                <p>• Students skip rows to prevent cheating (e.g., 1, 3, 5 or 2, 4, 6)</p>
                <p>• Automatic allocation considers adjacent row avoidance</p>
                <p>• 10 students per row (adjustable if needed)</p>
                <p>• Click "Auto-Allocate Rows" to get optimal row assignment</p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition-colors font-medium"
            >
              {editingCourse ? 'Update Course' : 'Add Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCourseModal;
