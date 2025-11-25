import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const formatDate = (date: Date, formatStr: string): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (formatStr === 'MMM dd, yyyy') {
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
  }
  if (formatStr === 'yyyy-MM-dd') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  return date.toLocaleDateString();
};

export const formatTime24 = (time: string): string => {
  if (!time) return '';
  if (time.match(/^\d{2}:\d{2}$/)) return time;
  if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time.substring(0, 5);
  return time;
};

export const formatTime12 = (time: string): string => {
  if (!time) return '';
  
  // Extract hours and minutes
  let hours: number;
  let minutes: number;
  
  if (time.match(/^\d{2}:\d{2}$/)) {
    // Format: HH:MM
    const [h, m] = time.split(':').map(Number);
    hours = h;
    minutes = m;
  } else if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
    // Format: HH:MM:SS
    const [h, m] = time.split(':').map(Number);
    hours = h;
    minutes = m;
  } else {
    return time; // Return as-is if format is unrecognized
  }
  
  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

export function parseDateToComponents(dateString: string): { day: string; month: string; year: string } {
  if (!dateString) return { day: '', month: '', year: '' };
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { day: '', month: '', year: '' };
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      year: String(date.getFullYear()),
    };
  } catch {
    return { day: '', month: '', year: '' };
  }
}


export function handleNumberInput(currentValue: string, newValue: string): string {
  if (newValue === '') {
    return '';
  }

  let sanitized = newValue.replace(/[^\d.]/g, '');

  if (currentValue === '0' && sanitized.length > 0) {
    if (sanitized.startsWith('0') && sanitized.length > 1 && sanitized[1] !== '.') {
      sanitized = sanitized.replace(/^0+/, '');
      if (sanitized === '') {
        sanitized = '0';
      }
    } else if (sanitized.length === 1 && /^\d$/.test(sanitized)) {
      return sanitized;
    }
  }

  if (sanitized.length > 1 && sanitized.startsWith('0') && sanitized[1] !== '.') {
    sanitized = sanitized.replace(/^0+/, '');
    if (sanitized === '') {
      sanitized = '0';
    }
  }

  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }

  return sanitized;
}