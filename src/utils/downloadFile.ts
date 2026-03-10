interface DownloadFileOptions {
  filename: string;
  content: string | Blob;
  mimeType?: string;
}

export function downloadFile(options: DownloadFileOptions): void {
  const { filename, content, mimeType = 'text/plain' } = options;

  // Create blob if content is string
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });

  // Create download URL
  const url = URL.createObjectURL(blob);

  // Create temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up URL object
  URL.revokeObjectURL(url);
}

export function downloadJSON(data: unknown, filename: string): void {
  const content = JSON.stringify(data, null, 2);
  downloadFile({
    filename,
    content,
    mimeType: 'application/json',
  });
}

export function downloadCSV(data: string[][] | Record<string, unknown>[], filename: string): void {
  let content: string;

  if (data.length === 0) {
    content = '';
  } else if (Array.isArray(data[0])) {
    // Array of arrays
    content = (data as string[][]).map(row => row.join(',')).join('\n');
  } else {
    // Array of objects
    const headers = Object.keys(data[0]);
    const rows = (data as Record<string, unknown>[]).map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape values containing commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    content = [headers.join(','), ...rows].join('\n');
  }

  downloadFile({
    filename,
    content,
    mimeType: 'text/csv',
  });
}

export function downloadText(content: string, filename: string): void {
  downloadFile({
    filename,
    content,
    mimeType: 'text/plain',
  });
}
