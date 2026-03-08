import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle,
  FileText,
  RefreshCw,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import { allocateRows, getOccupiedRows } from '../../utils/rowAllocation.js';
import ConfirmModal from './ConfirmModal.jsx';

function BulkUploadModal({ showBulkModal, setShowBulkModal, handleBulkUpload, addNotification, courses }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Confirm
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: async () => {},
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');

        const reader = new FileReader();
        reader.onload = (e) => {
          const csvContent = e.target.result;
          const lines = csvContent.split('\n');
          const preview = [];

          for (let i = 1; i < Math.min(6, lines.length); i++) {
            if (lines[i].trim()) {
              const [code, name, date, time, venue, instructor, option, numStudents] = lines[i].split(',');
              if (code && name) {
                const occupiedRows = getOccupiedRows(courses, date?.trim(), time?.trim(), venue?.trim());
                const allocatedRows = allocateRows(numStudents?.trim() || '0', occupiedRows);

                preview.push({
                  code: code.trim(),
                  name: name.trim(),
                  date: date?.trim() || '',
                  time: time?.trim() || '',
                  venue: venue?.trim() || '',
                  instructor: instructor?.trim() || '',
                  option: option?.trim() || 'Main',
                  numStudents: numStudents?.trim() || '',
                  rows: allocatedRows,
                });
              }
            }
          }
          setPreviewData(preview);
          setStep(2);
        };
        reader.readAsText(selectedFile);
      } else {
        setError('Please upload a CSV file');
        setFile(null);
      }
    }
  };

  const openConfirm = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', onConfirm }) => {
    setConfirmConfig({ isOpen: true, title, message, confirmText, cancelText, type, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const performUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvContent = e.target.result;
        const lines = csvContent.split('\n');

        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const [code, name, date, time, venue, instructor, option, numStudents] = lines[i].split(',');
            if (code && name) {
              const occupiedRows = getOccupiedRows(courses, date?.trim(), time?.trim(), venue?.trim());
              const allocatedRows = allocateRows(numStudents?.trim() || '0', occupiedRows);

              const courseData = {
                code: code.trim(),
                name: name.trim(),
                date: date?.trim() || '',
                time: time?.trim() || '',
                venue: venue?.trim() || '',
                instructor: instructor?.trim() || '',
                option: option?.trim() || 'Main',
                numStudents: numStudents?.trim() || '',
                rows: allocatedRows,
              };

              try {
                await handleBulkUpload([courseData]);
                successCount++;
              } catch (err) {
                console.error(`Error uploading course ${code}:`, err);
                errorCount++;
              }
            }
          }
        }

        setUploadStatus(`Upload completed: ${successCount} successful, ${errorCount} failed`);
        setStep(3);

        if (addNotification) {
          addNotification(
            'Bulk Upload Complete',
            `Successfully uploaded ${successCount} courses. ${errorCount > 0 ? `${errorCount} courses failed to upload.` : ''}`,
            errorCount > 0 ? 'warning' : 'success'
          );
        }

        setTimeout(() => {
          setShowBulkModal(false);
          setUploading(false);
          setStep(1);
          setFile(null);
          setPreviewData([]);
        }, 3000);
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Error parsing CSV file: ' + err.message);
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    openConfirm({
      title: 'Confirm Bulk Upload',
      message: 'Proceed with bulk upload? This will add new courses to the system.',
      confirmText: 'Upload',
      type: 'info',
      onConfirm: performUpload,
    });
  };

  const downloadTemplate = () => {
    const dateFormat = localStorage.getItem('dateFormat') || 'DD-MM-YYYY';

    let dateExample = 'Mon, 20-01-2025';
    if (dateFormat === 'MM/DD/YYYY') {
      dateExample = 'Mon, 01/20/2025';
    } else if (dateFormat === 'YYYY-MM-DD') {
      dateExample = '2025-01-20';
    } else if (dateFormat === 'DD/MM/YYYY') {
      dateExample = 'Mon, 20/01/2025';
    }

    const template = `code,name,date,time,venue,instructor,option,numStudents
CSIS311,Database Systems,${dateExample},09:00 AM-12:00 PM,Main Hall,Dr. John Smith,Main,50
MATH201,Calculus II,${dateExample},01:00 PM-03:00 PM,Room 101,Prof. Mary Johnson,Group A,40
PHY301,Physics Lab,${dateExample},10:00 AM-12:00 PM,Lab Building,Dr. Robert Williams,Group B,30
ENG101,English Composition,${dateExample},02:00 PM-04:00 PM,Room 202,Ms. Sarah Davis,Group C,45`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setPreviewData([]);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              {file ? (
                <div className="space-y-4">
                  <FileText className="w-12 h-12 text-blue-600 dark:text-blue-500 mx-auto" />
                  <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreviewData([]);
                    }}
                    className="text-sm text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadCloud className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto" />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium mb-2">Drag and drop your CSV file here</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or click to browse</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose CSV File
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">CSV Format Requirements:</h4>
              <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1 max-h-32 overflow-y-auto pr-2">
                <p>• First row should be headers: code,name,date,time,venue,instructor,option,numStudents</p>
                <p>• Date format: {localStorage.getItem('dateFormat') || 'DD-MM-YYYY'} (e.g., Mon, 20-01-2025)</p>
                <p>• Time format: HH:MM AM-HH:MM PM (e.g., 09:00 AM-12:00 PM)</p>
                <p>• Option: Main, Group A, Group B, or Group C</p>
                <p>• Number of Students: Total students for this exam</p>
                <p>• Rows will be automatically allocated to avoid conflicts</p>
                <p>
                  • Download{' '}
                  <button onClick={downloadTemplate} className="underline hover:text-blue-900 dark:hover:text-blue-300">
                    template.csv
                  </button>{' '}
                  for reference
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">File uploaded successfully!</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Preview of first {previewData.length} courses:
              </p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="py-2 px-3 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        Code
                      </th>
                      <th className="py-2 px-3 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        Name
                      </th>
                      <th className="py-2 px-3 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        Students
                      </th>
                      <th className="py-2 px-3 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        Rows (Auto-allocated)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {previewData.map((course, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                            {course.code}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{course.name}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {course.numStudents || '0'}
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          <span className="font-mono bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded text-xs">
                            {course.rows || 'Will be auto-allocated'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total courses to upload: {previewData.length} (sample shown)
              </span>
              <button
                onClick={goBack}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              >
                Change file
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center py-8">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Uploading Courses...</h3>
                <p className="text-gray-600 dark:text-gray-400">Please wait while we process your courses</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Upload Complete!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{uploadStatus}</p>
                <div className="text-sm text-gray-500 dark:text-gray-400">Modal will close automatically...</div>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bulk Course Upload</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Step {step} of 3</p>
            </div>
            <button
              onClick={() => {
                setShowBulkModal(false);
                setStep(1);
                setFile(null);
                setPreviewData([]);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            {['Upload File', 'Preview', 'Complete'].map((stepLabel, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step > index + 1
                      ? 'bg-green-500 text-white'
                      : step === index + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {step > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    step >= index + 1 ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {stepLabel}
                </span>
                {index < 2 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      step > index + 1 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mr-2" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          {renderStep()}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            {step === 1 && file && (
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:opacity-90 transition-colors"
              >
                Continue to Preview
              </button>
            )}

            {step === 2 && (
              <>
                <button
                  onClick={goBack}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Courses'
                  )}
                </button>
              </>
            )}

            {step === 1 && !file && (
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            )}
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

export default BulkUploadModal;

