function getMemoryUsage() {
   const used = process.memoryUsage();
   return {
      rss: Math.round(used.rss / 1024 / 1024),
      heapTotal: Math.round(used.heapTotal / 1024 / 1024),
      heapUsed: Math.round(used.heapUsed / 1024 / 1024),
      external: Math.round(used.external / 1024 / 1024)
   };
}

function logMemoryUsage() {
   const memory = getMemoryUsage();
   console.log('\x1b[35m[MEMORY]\x1b[0m', `RSS: ${memory.rss}MB | Heap: ${memory.heapUsed}/${memory.heapTotal}MB | External: ${memory.external}MB`);
}

function startMemoryMonitoring(intervalMinutes = 30) {
   logMemoryUsage();
   
   setInterval(() => {
      logMemoryUsage();
      
      const memory = getMemoryUsage();
      if (memory.heapUsed > 400) {
         console.log('\x1b[33m[WARNING]\x1b[0m Memory usage is high, consider restarting if issues occur');
      }
      
      if (global.gc && memory.heapUsed > 300) {
         console.log('\x1b[35m[MEMORY]\x1b[0m Running garbage collection...');
         global.gc();
         logMemoryUsage();
      }
   }, intervalMinutes * 60 * 1000);
}

function cleanupOldData(map, maxAge = 7 * 24 * 60 * 60 * 1000) {
   const now = Date.now();
   let cleaned = 0;
   
   for (const [key, value] of map.entries()) {
      if (value.lastSeen && (now - value.lastSeen) > maxAge) {
         map.delete(key);
         cleaned++;
      }
   }
   
   if (cleaned > 0) {
      console.log(`\x1b[35m[CLEANUP]\x1b[0m Removed ${cleaned} old player entries from memory`);
   }
   
   return cleaned;
}

module.exports = {
   getMemoryUsage,
   logMemoryUsage,
   startMemoryMonitoring,
   cleanupOldData
};
