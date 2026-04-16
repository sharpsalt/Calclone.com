type LogMeta = Record<string, unknown>;

function format(level: string, name: string, meta: LogMeta) {
  const base = { level, name, ts: new Date().toISOString(), ...meta };
  return JSON.stringify(base);
}

export default {
  info: (name: string, meta: LogMeta = {}) => console.log(format('info', name, meta)),
  error: (name: string, meta: LogMeta = {}) => console.error(format('error', name, meta)),
  debug: (name: string, meta: LogMeta = {}) => console.log(format('debug', name, meta)),
};
