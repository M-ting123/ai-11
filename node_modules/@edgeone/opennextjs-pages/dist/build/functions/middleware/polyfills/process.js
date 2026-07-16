
      var require = await (async () => {
        var { createRequire } = await import("node:module");
        return createRequire(import.meta.url);
      })();
    
import "../../../../esm-chunks/chunk-6BT4RYQJ.js";

// src/build/functions/middleware/polyfills/process.ts
var processPolyfill = `
// === Process Polyfill ===
const process = globalThis.process || {
  env: {},
  version: 'v18.0.0',
  versions: { node: '18.0.0' },
  platform: 'linux',
  arch: 'x64',
  pid: 1,
  ppid: 0,
  title: 'edge-runtime',
  argv: [],
  execArgv: [],
  execPath: '/usr/bin/node',
  cwd: () => '/',
  chdir: () => {},
  exit: () => {},
  kill: () => {},
  umask: () => 0o22,
  hrtime: (time) => {
    const now = performance.now();
    const sec = Math.floor(now / 1000);
    const nsec = Math.floor((now % 1000) * 1e6);
    if (time) {
      return [sec - time[0], nsec - time[1]];
    }
    return [sec, nsec];
  },
  nextTick: (callback, ...args) => {
    queueMicrotask(() => callback(...args));
  },
  emitWarning: (warning) => {
    console.warn(warning);
  },
  binding: () => ({}),
  _linkedBinding: () => ({}),
  on: () => process,
  off: () => process,
  once: () => process,
  emit: () => false,
  addListener: () => process,
  removeListener: () => process,
  removeAllListeners: () => process,
  listeners: () => [],
  listenerCount: () => 0,
  prependListener: () => process,
  prependOnceListener: () => process,
  eventNames: () => [],
  setMaxListeners: () => process,
  getMaxListeners: () => 10,
  stdout: { write: (s) => console.log(s) },
  stderr: { write: (s) => console.error(s) },
  stdin: { read: () => null },
  memoryUsage: () => ({
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
    arrayBuffers: 0
  }),
  cpuUsage: () => ({ user: 0, system: 0 }),
  uptime: () => 0,
  getuid: () => 0,
  getgid: () => 0,
  geteuid: () => 0,
  getegid: () => 0,
  getgroups: () => [],
  setuid: () => {},
  setgid: () => {},
  seteuid: () => {},
  setegid: () => {},
  setgroups: () => {},
  features: {
    inspector: false,
    debug: false,
    uv: false,
    ipv6: true,
    tls_alpn: true,
    tls_sni: true,
    tls_ocsp: false,
    tls: true
  }
};

// \u786E\u4FDD process.env \u53EF\u4EE5\u88AB\u8D4B\u503C
if (!globalThis.process) {
  globalThis.process = process;
}
`;
export {
  processPolyfill
};
