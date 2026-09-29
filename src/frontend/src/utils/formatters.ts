/**
 * Formatter Utilities
 * 
 * Common formatting functions for dates, times, numbers, and text.
 * 
 * @module utils/formatters
 */

import { formatDistance, format, parseISO } from 'date-fns';

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date, formatStr = 'PPP'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format date and time
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'PPP p');
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Format bytes to human readable size
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * Math.pow(10, dm)) / Math.pow(10, dm) + ' ' + sizes[i];
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return (Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals) + '%';
};

/**
 * Truncate string to max length
 */
export const truncateString = (str: string, maxLength: number, suffix = '...'): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format text to title case
 */
export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format status to badge color
 */
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    open: 'bg-red-100 text-red-800',
    acknowledged: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    false_positive: 'bg-gray-100 text-gray-800',
    closed: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Format severity to badge color
 */
export const getSeverityColor = (severity: string): string => {
  const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
    info: 'bg-gray-100 text-gray-800',
  };

  return severityColors[severity] || 'bg-gray-100 text-gray-800';
};

/**
 * Format URL to be safe and linkable
 */
export const formatUrl = (url: string): string => {
  try {
    return new URL(url).toString();
  } catch {
    return url;
  }
};

/**
 * Extract domain from URL
 */
export const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

/**
 * Format IP address
 */
export const formatIpAddress = (ip: string): string => {
  // Add validation if needed
  return ip;
};

/**
 * Format JSON for display
 */
export const formatJson = (obj: unknown, indent = 2): string => {
  try {
    return JSON.stringify(obj, null, indent);
  } catch {
    return 'Invalid JSON';
  }
};
