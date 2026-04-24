import api from './api.js';

const reportService = {
  async downloadAttendance(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.download(`/reports/attendance${qs ? `?${qs}` : ''}`);
  },

  async downloadAttendanceSummary(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.download(`/reports/attendance/summary${qs ? `?${qs}` : ''}`);
  },

  async downloadShifts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.download(`/reports/shifts${qs ? `?${qs}` : ''}`);
  },

  async downloadLeaves(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return api.download(`/reports/leaves${qs ? `?${qs}` : ''}`);
  },
};

/**
 * Helper to trigger browser download from a fetch Response object.
 * Usage:
 *   const res = await reportService.downloadAttendance({ format: 'excel' });
 *   await triggerDownload(res, 'attendance-report');
 */
export async function triggerDownload(response, fallbackName = 'report') {
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?(.+?)"?$/);
  const filename = match ? match[1] : `${fallbackName}.csv`;

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default reportService;
