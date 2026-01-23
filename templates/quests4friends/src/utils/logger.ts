/**
 * Logger utility — replaces console.* in app code.
 * In development: logs/warns. In production: no-op (except errors).
 * See MASTER_PLAN.md: reduce debug noise, keep error visibility.
 */

const DEBUG = import.meta.env.DEV;

export const log = DEBUG ? (...args: unknown[]) => console.log(...args) : () => {};
export const warn = DEBUG ? (...args: unknown[]) => console.warn(...args) : () => {};
export const error = (...args: unknown[]) => console.error(...args);
