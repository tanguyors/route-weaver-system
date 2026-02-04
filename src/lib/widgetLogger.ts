// Widget Debug Logger
// - Always logs to console (for devtools)
// - Optionally shows in-widget panel (via WidgetDebugPanel)
// - Optionally ships logs to a backend endpoint when ?widgetDebug=1 is enabled
 
 interface LogEntry {
   timestamp: string;
   level: 'info' | 'warn' | 'error' | 'debug';
   category: string;
   message: string;
   data?: any;
   userAgent?: string;
   url?: string;
 }

const LOG_EVENT_NAME = 'sribooking-widget-log';

const getSearchParam = (name: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
};

const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'server';
  try {
    const key = 'sribooking_widget_session_id';
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(key, id);
    return id;
  } catch {
    return 'no-session-storage';
  }
};
 
 class WidgetLogger {
   private logs: LogEntry[] = [];
   private maxLogs = 100;

  private remoteLoggingEnabled = false;
  private remoteEndpoint: string | null = null;
  private remoteQueue: LogEntry[] = [];
  private flushTimer: number | null = null;
  private sessionId = getSessionId();

  isDebugEnabled(): boolean {
    // Enable when explicitly requested
    return getSearchParam('widgetDebug') === '1';
  }

  enableRemoteLogging(endpoint?: string) {
    if (typeof window === 'undefined') return;
    if (!this.isDebugEnabled()) return;

    const baseUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined;
    this.remoteEndpoint =
      endpoint || (baseUrl ? `${baseUrl}/functions/v1/widget-debug-log` : null);

    if (!this.remoteEndpoint) return;

    this.remoteLoggingEnabled = true;
    if (this.flushTimer) return;

    this.flushTimer = window.setInterval(() => {
      void this.flushRemote();
    }, 1500);
  }

  disableRemoteLogging() {
    this.remoteLoggingEnabled = false;
    this.remoteEndpoint = null;
    this.remoteQueue = [];
    if (typeof window !== 'undefined' && this.flushTimer) {
      window.clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
 
   private createLogEntry(
     level: LogEntry['level'],
     category: string,
     message: string,
     data?: any
   ): LogEntry {
     return {
       timestamp: new Date().toISOString(),
       level,
       category,
       message,
       data,
       userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
       url: typeof window !== 'undefined' ? window.location.href : undefined,
     };
   }

  private enqueueRemote(entry: LogEntry) {
    if (!this.remoteLoggingEnabled || !this.remoteEndpoint) return;
    this.remoteQueue.push(entry);
    // hard cap queue to avoid runaway memory
    if (this.remoteQueue.length > 200) {
      this.remoteQueue.splice(0, this.remoteQueue.length - 200);
    }
  }

  private async flushRemote() {
    if (!this.remoteLoggingEnabled || !this.remoteEndpoint) return;
    if (this.remoteQueue.length === 0) return;

    const batch = this.remoteQueue.splice(0, 50);
    const widgetKey = getSearchParam('key');

    try {
      await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetKey,
          sessionId: this.sessionId,
          logs: batch,
        }),
        keepalive: true,
      });
    } catch {
      // silent: remote logging should never break UX
    }
  }
 
   private addLog(entry: LogEntry) {
     this.logs.push(entry);
     if (this.logs.length > this.maxLogs) {
       this.logs.shift();
     }

    // Notify any UI panels
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent(LOG_EVENT_NAME, { detail: entry }));
      } catch {
        // ignore
      }
    }

    this.enqueueRemote(entry);
 
     // Console output with color coding
     const styles: Record<string, string> = {
       info: 'color: #2563eb; font-weight: bold',
       warn: 'color: #f59e0b; font-weight: bold',
       error: 'color: #dc2626; font-weight: bold',
       debug: 'color: #6b7280; font-weight: bold',
     };
 
     console.log(
       `%c[WIDGET ${entry.level.toUpperCase()}] ${entry.category}`,
       styles[entry.level],
       entry.message,
       entry.data || ''
     );
   }
 
   info(category: string, message: string, data?: any) {
     this.addLog(this.createLogEntry('info', category, message, data));
   }
 
   warn(category: string, message: string, data?: any) {
     this.addLog(this.createLogEntry('warn', category, message, data));
   }
 
   error(category: string, message: string, data?: any) {
     this.addLog(this.createLogEntry('error', category, message, data));
   }
 
   debug(category: string, message: string, data?: any) {
     this.addLog(this.createLogEntry('debug', category, message, data));
   }
 
   getAllLogs(): LogEntry[] {
     return [...this.logs];
   }
 
   clearLogs() {
     this.logs = [];
   }
 
   // Download logs as JSON file
   downloadLogs() {
     const dataStr = JSON.stringify(this.logs, null, 2);
     const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
     const exportFileDefaultName = `widget-logs-${new Date().toISOString()}.json`;
 
     const linkElement = document.createElement('a');
     linkElement.setAttribute('href', dataUri);
     linkElement.setAttribute('download', exportFileDefaultName);
     linkElement.click();
   }
 }
 
 // Global singleton instance
 export const widgetLogger = new WidgetLogger();

// Auto-enable remote logging when requested
if (typeof window !== 'undefined') {
  widgetLogger.enableRemoteLogging();
}
 
 // Expose to window for external debugging
 if (typeof window !== 'undefined') {
   (window as any).widgetLogger = widgetLogger;
  (window as any).SRIBOOKING_WIDGET_LOG_EVENT = LOG_EVENT_NAME;
 }

export type { LogEntry };