/**
 * Simple logger utility
 * Logs messages with timestamps
 */

const formatTimestamp = () => {
  return new Date().toISOString();
};

const logger = {
  info: (...args) => {
    console.log(`[${formatTimestamp()}] INFO:`, ...args);
  },
  
  warn: (...args) => {
    console.warn(`[${formatTimestamp()}] WARN:`, ...args);
  },
  
  error: (...args) => {
    console.error(`[${formatTimestamp()}] ERROR:`, ...args);
  },
  
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${formatTimestamp()}] DEBUG:`, ...args);
    }
  }
};

export default logger;
