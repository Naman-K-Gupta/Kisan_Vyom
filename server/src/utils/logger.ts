export const logger = {
  info: (msg: string, ...args: any[]) => {
    console.log(`[${new Date().toISOString()}] ℹ️  INFO: ${msg}`, ...args);
  },
  warn: (msg: string, ...args: any[]) => {
    console.warn(`[${new Date().toISOString()}] ⚠️  WARN: ${msg}`, ...args);
  },
  error: (msg: string, ...args: any[]) => {
    console.error(`[${new Date().toISOString()}] ❌ ERROR: ${msg}`, ...args);
  },
  success: (msg: string, ...args: any[]) => {
    console.log(`[${new Date().toISOString()}] ✅ SUCCESS: ${msg}`, ...args);
  },
};
