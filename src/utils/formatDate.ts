type DateFormat = 'short' | 'long' | 'relative' | 'iso';
type Locale = string;

interface FormatDateOptions {
  format?: DateFormat;
  locale?: Locale;
  includeTime?: boolean;
}

const DEFAULT_LOCALE = 'en-US';

export function formatDate(
  date: Date | number | string,
  options: FormatDateOptions = {}
): string {
  const {
    format = 'long',
    locale = DEFAULT_LOCALE,
    includeTime = false,
  } = options;

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  switch (format) {
    case 'short':
      return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

    case 'long':
      return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...(includeTime && {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

    case 'relative':
      return formatRelativeTime(d, locale);

    case 'iso':
      return d.toISOString();

    default:
      return d.toLocaleDateString(locale);
  }
}

function formatRelativeTime(date: Date, locale: Locale): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute');
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour');
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return rtf.format(-diffInDays, 'day');
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return rtf.format(-diffInWeeks, 'week');
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return rtf.format(-diffInMonths, 'month');
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return rtf.format(-diffInYears, 'year');
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
