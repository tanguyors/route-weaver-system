import { useEffect, useMemo, useState } from 'react';
import { widgetLogger, type LogEntry } from '@/lib/widgetLogger';
import { cn } from '@/lib/utils';

const LOG_EVENT_NAME = (typeof window !== 'undefined'
  ? (window as any).SRIBOOKING_WIDGET_LOG_EVENT
  : null) as string | null;

function levelBadge(level: LogEntry['level']) {
  switch (level) {
    case 'error':
      return 'bg-destructive text-destructive-foreground';
    case 'warn':
      return 'bg-accent text-accent-foreground';
    case 'info':
      return 'bg-primary text-primary-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function WidgetDebugPanel() {
  const enabled = widgetLogger.isDebugEnabled();
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(() => widgetLogger.getAllLogs());

  const summary = useMemo(() => {
    const errors = logs.filter((l) => l.level === 'error').length;
    const warns = logs.filter((l) => l.level === 'warn').length;
    return { errors, warns, total: logs.length };
  }, [logs]);

  useEffect(() => {
    if (!enabled) return;

    const handler = () => setLogs(widgetLogger.getAllLogs());
    // Update once immediately
    handler();

    if (LOG_EVENT_NAME) {
      window.addEventListener(LOG_EVENT_NAME, handler as any);
      return () => window.removeEventListener(LOG_EVENT_NAME, handler as any);
    }

    // Fallback polling
    const id = window.setInterval(handler, 1000);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  const copy = async () => {
    const payload = JSON.stringify(widgetLogger.getAllLogs(), null, 2);
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed bottom-3 right-3 z-[10000] pointer-events-auto">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'rounded-full border bg-background text-foreground shadow-lg px-3 py-2 text-xs font-semibold',
            'hover:bg-muted'
          )}
        >
          Debug logs • {summary.total} ({summary.warns}w/{summary.errors}e)
        </button>
      ) : (
        <div className="w-[min(92vw,420px)] rounded-lg border bg-background text-foreground shadow-xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted">
            <div className="text-xs font-semibold">
              Widget debug ({summary.total})
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copy}
                className="text-xs px-2 py-1 rounded border bg-background hover:bg-muted"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => widgetLogger.downloadLogs()}
                className="text-xs px-2 py-1 rounded border bg-background hover:bg-muted"
              >
                Download
              </button>
              <button
                type="button"
                onClick={() => {
                  widgetLogger.clearLogs();
                  setLogs([]);
                }}
                className="text-xs px-2 py-1 rounded border bg-background hover:bg-muted"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs px-2 py-1 rounded border bg-background hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>

          <div className="max-h-[55vh] overflow-auto p-2 space-y-2">
            {logs.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2">
                No logs yet. Interact with the date picker, then come back here.
              </div>
            ) : (
              logs
                .slice(-80)
                .reverse()
                .map((l, idx) => (
                  <div key={`${l.timestamp}-${idx}`} className="rounded-md border p-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded', levelBadge(l.level))}>
                        {l.level.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-semibold">{l.category}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{l.timestamp}</span>
                    </div>
                    <div className="text-[11px] mt-1 whitespace-pre-wrap break-words">
                      {l.message}
                    </div>
                    {l.data !== undefined && (
                      <pre className="mt-2 text-[10px] text-muted-foreground whitespace-pre-wrap break-words">
                        {JSON.stringify(l.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
