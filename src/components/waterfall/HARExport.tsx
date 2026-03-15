import { Download, FileJson } from 'lucide-react';
import type { WaterfallData } from '@/core/waterfall/timingCalculator';

interface HAREntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
  };
  response: {
    status: number;
    statusText: string;
    headers: Array<{ name: string; value: string }>;
    content: {
      size: number;
      mimeType: string;
    };
  };
  timings: {
    blocked: number;
    dns: number;
    connect: number;
    send: number;
    wait: number;
    receive: number;
    ssl: number;
  };
}

interface HARFile {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
    };
    pages: Array<{
      startedDateTime: string;
      id: string;
      title: string;
      pageTimings: {
        onContentLoad: number;
        onLoad: number;
      };
    }>;
    entries: HAREntry[];
  };
}

interface HARExportProps {
  data: WaterfallData;
  fileName?: string;
}

export function HARExport({ data, fileName = 'waterfall' }: HARExportProps): React.ReactNode {
  const generateHAR = (): HARFile => {
    const now = new Date().toISOString();
    
    const entries: HAREntry[] = data.resources.map((resource) => {
      const downloadTime = resource.duration * 0.7;
      const waitTime = resource.duration * 0.3;

      return {
        startedDateTime: new Date(Date.now() + resource.startTime).toISOString(),
        time: resource.duration,
        request: {
          method: 'GET',
          url: resource.url,
          headers: [
            { name: 'User-Agent', value: 'Frontend-Performance-Profiler/1.0' },
          ],
        },
        response: {
          status: 200,
          statusText: 'OK',
          headers: [
            { name: 'Content-Type', value: getMimeType(resource.type) },
            { name: 'Content-Length', value: String(resource.size) },
          ],
          content: {
            size: resource.size,
            mimeType: getMimeType(resource.type),
          },
        },
        timings: {
          blocked: 0,
          dns: 0,
          connect: 0,
          send: 0,
          wait: waitTime,
          receive: downloadTime,
          ssl: 0,
        },
      };
    });

    return {
      log: {
        version: '1.2',
        creator: {
          name: 'Frontend Performance Profiler',
          version: '1.0.0',
        },
        pages: [
          {
            startedDateTime: now,
            id: 'page_1',
            title: 'Performance Analysis',
            pageTimings: {
              onContentLoad: data.markers.domContentLoaded,
              onLoad: data.totalDuration,
            },
          },
        ],
        entries,
      },
    };
  };

  const handleExportHAR = (): void => {
    const har = generateHAR();
    const blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.har`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = (): void => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportHAR}
        className="dev-button-secondary flex items-center gap-2 text-sm"
        title="Export as HAR (HTTP Archive)"
      >
        <Download className="w-4 h-4" />
        Export HAR
      </button>
      <button
        onClick={handleExportJSON}
        className="dev-button-secondary flex items-center gap-2 text-sm"
        title="Export as JSON"
      >
        <FileJson className="w-4 h-4" />
        Export JSON
      </button>
    </div>
  );
}

function getMimeType(type: string): string {
  const mimeTypes: Record<string, string> = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    image: 'image/jpeg',
    font: 'font/woff2',
    json: 'application/json',
    other: 'application/octet-stream',
  };
  return mimeTypes[type] || 'application/octet-stream';
}
