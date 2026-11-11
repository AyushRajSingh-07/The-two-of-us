// Get current date string formatted as YYYY-MM-DD in Asia/Kolkata timezone
export function getKolkataDateString(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

// Format timestamp in Asia/Kolkata timezone (e.g. "5:15 PM")
export function formatKolkataTime(isoDate?: string): string {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat(undefined, {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '';
  }
}

export function calculateTimeTogether(startDateStr: string) {
  if (!startDateStr) {
    return {
      days: 0,
      months: 0,
      years: 0,
      hours: 0,
      totalDays: 0,
      nextAnniversaryDays: 0,
    };
  }

  const start = new Date(startDateStr);
  const now = new Date();

  // If start is in the future, fallback gracefully
  if (isNaN(start.getTime()) || start > now) {
    return {
      days: 0,
      months: 0,
      years: 0,
      hours: 0,
      totalDays: 0,
      nextAnniversaryDays: 0,
    };
  }

  const diffMs = now.getTime() - start.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);

  // Approximate years, months, days
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Next anniversary countdown
  const nextAnniversaryYear = (now.getMonth() > start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() > start.getDate()))
    ? now.getFullYear() + 1
    : now.getFullYear();
  const nextDate = new Date(nextAnniversaryYear, start.getMonth(), start.getDate());
  const nextDiffMs = nextDate.getTime() - now.getTime();
  const nextAnniversaryDays = Math.ceil(nextDiffMs / (1000 * 60 * 60 * 24));

  return {
    years,
    months,
    days,
    hours,
    totalDays,
    nextAnniversaryDays,
  };
}

export function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export function formatTime(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function formatRelativeTime(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return formatDate(isoDate);
  } catch {
    return '';
  }
}

export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];
