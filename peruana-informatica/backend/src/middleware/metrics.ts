import type { NextFunction, Request, Response } from 'express';

const startedAt = new Date();
const counters = new Map<string, number>();

const inc = (key: string) => counters.set(key, (counters.get(key) ?? 0) + 1);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    inc(requestCounterKey(req.method, res.statusCode));
    counters.set('http_request_duration_seconds_sum', (counters.get('http_request_duration_seconds_sum') ?? 0) + seconds);
    inc('http_request_duration_seconds_count');
  });

  next();
};

const escapeLabel = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const requestCounterKey = (method: string, status: number) =>
  `http_requests_total{method="${escapeLabel(method)}",status="${status}"}`;

export const renderMetrics = (): string => {
  const lines: string[] = [
    '# HELP process_uptime_seconds Seconds since the process started',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${Math.floor((Date.now() - startedAt.getTime()) / 1000)}`,
    '# HELP process_resident_memory_bytes Resident memory size in bytes',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${process.memoryUsage().rss}`,
    '# HELP http_requests_total Total HTTP requests by method and status',
    '# TYPE http_requests_total counter',
  ];

  for (const [key, value] of counters) {
    if (key.startsWith('http_requests_total')) {
      lines.push(`${key} ${value}`);
    }
  }

  lines.push(
    '# HELP http_request_duration_seconds_sum Total time spent handling requests',
    '# TYPE http_request_duration_seconds_sum counter',
    `http_request_duration_seconds_sum ${counters.get('http_request_duration_seconds_sum') ?? 0}`,
    '# HELP http_request_duration_seconds_count Total handled requests',
    '# TYPE http_request_duration_seconds_count counter',
    `http_request_duration_seconds_count ${counters.get('http_request_duration_seconds_count') ?? 0}`,
  );

  return `${lines.join('\n')}\n`;
};
