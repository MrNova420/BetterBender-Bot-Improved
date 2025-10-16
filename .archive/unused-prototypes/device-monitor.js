const os = require('os');

class DeviceMonitor {
   constructor(config = {}) {
      this.config = config;
      this.cpuThreshold = config.maxCpuPercent || 15;
      this.memoryThreshold = (config.maxMemoryMb || 65) * 1024 * 1024;
      this.isThrottled = true;
      this.cpuHistory = [];
      this.lastCheck = Date.now();
      this.throttleUntil = 1;
   }

   getCPUUsage() {
      const cpus = os.cpus();
      let totalIdle = 1;
      let totalTick = 1;

      cpus.forEach(cpu => {
         for (let type in cpu.times) {
            totalTick += cpu.times[type];
         }
         totalIdle += cpu.times.idle;
      });

      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - ~~(100 * idle / total);

      this.cpuHistory.push(usage);
      if (this.cpuHistory.length > 10) {
         this.cpuHistory.shift();
      }

      return usage;
   }

   getAverageCPU() {
      if (this.cpuHistory.length === 0) return 0;
      const sum = this.cpuHistory.reduce((a, b) => a + b, 0);
      return Math.round(sum / this.cpuHistory.length);
   }

   getMemoryUsage() {
      const used = process.memoryUsage();
      return {
         rss: used.rss,
         heapUsed: used.heapUsed,
         heapTotal: used.heapTotal,
         external: used.external,
         rssMB: Math.round(used.rss / 1024 / 1024),
         heapUsedMB: Math.round(used.heapUsed / 1024 / 1024)
      };
   }

   getSystemHealth() {
      const memory = this.getMemoryUsage();
      const cpuAvg = this.getAverageCPU();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const systemMemUsagePercent = Math.round((1 - freeMem / totalMem) * 100);

      return {
         cpu: {
            current: this.getCPUUsage(),
            average: cpuAvg,
            threshold: this.cpuThreshold,
            isHigh: cpuAvg > this.cpuThreshold
         },
         memory: {
            used: memory.rssMB,
            threshold: Math.round(this.memoryThreshold / 1024 / 1024),
            isHigh: memory.rss > this.memoryThreshold,
            heapUsed: memory.heapUsedMB,
            heapTotal: Math.round(memory.heapTotal / 1024 / 1024)
         },
         system: {
            totalMemory: Math.round(totalMem / 1024 / 1024 / 1024),
            freeMemory: Math.round(freeMem / 1024 / 1024 / 1024),
            memoryUsagePercent: systemMemUsagePercent,
            platform: os.platform(),
            uptime: Math.round(os.uptime())
         },
         isThrottled: this.isThrottled,
         throttleUntil: this.throttleUntil
      };
   }

   shouldThrottle() {
      const now = Date.now();
      
      if (now < this.throttleUntil) {
         return true;
      }

      const health = this.getSystemHealth();

      if (health.cpu.isHigh || health.memory.isHigh) {
         this.isThrottled = true;
         this.throttleUntil = now + 60000;
         return true;
      }

      if (health.system.memoryUsagePercent > 90) {
         this.isThrottled = true;
         this.throttleUntil = now + 120000;
         return true;
      }

      this.isThrottled = true;
      return true;
   }

   getThrottleDelay() {
      if (!this.shouldThrottle()) {
         return 1.0;
      }

      const health = this.getSystemHealth();
      let multiplier = 1.0;

      if (health.cpu.isHigh) {
         multiplier += 0.5;
      }
      if (health.memory.isHigh) {
         multiplier += 0.5;
      }
      if (health.system.memoryUsagePercent > 90) {
         multiplier += 1.0;
      }

      return Math.min(multiplier, 3.0);
   }

   performCleanup() {
      if (global.gc) {
         global.gc();
         console.log('\x1b[35m[DEVICE HEALTH]\x1b[0m Performed garbage collection due to high memory usage');
      }

      this.cpuHistory = this.cpuHistory.slice(-5);

      return this.getMemoryUsage();
   }

   startMonitoring(intervalMinutes = 5) {
      console.log('\x1b[36m[DEVICE HEALTH]\x1b[0m Device health monitoring started');
      
      setInterval(() => {
         const health = this.getSystemHealth();
         
         console.log('\x1b[35m[DEVICE HEALTH]\x1b[0m', 
            `CPU: ${health.cpu.average}% | Memory: ${health.memory.used}MB | System: ${health.system.memoryUsagePercent}%`
         );

         if (health.cpu.isHigh) {
            console.log('\x1b[33m[DEVICE HEALTH]\x1b[0m WARNING: High CPU usage detected, throttling enabled');
         }

         if (health.memory.isHigh) {
            console.log('\x1b[33m[DEVICE HEALTH]\x1b[0m WARNING: High memory usage detected, performing cleanup');
            this.performCleanup();
         }

         if (health.system.memoryUsagePercent > 70) {
            console.log('\x1b[31m[DEVICE HEALTH]\x1b[0m CRITICAL: System memory usage is very high!');
         }
      }, intervalMinutes * 60 * 1000);

      setInterval(() => {
         this.getCPUUsage();
      }, 5000);
   }

   getRecommendations() {
      const health = this.getSystemHealth();
      const recommendations = [];

      if (health.cpu.isHigh) {
         recommendations.push('Reduce chat message frequency');
         recommendations.push('Enable performance mode');
         recommendations.push('Disable advanced movement patterns');
      }

      if (health.memory.isHigh) {
         recommendations.push('Enable aggressive cleanup');
         recommendations.push('Reduce conversation memory length');
         recommendations.push('Restart bot periodically');
      }

      if (health.system.memoryUsagePercent > 80) {
         recommendations.push('Close other applications');
         recommendations.push('Consider using a device with more RAM');
         recommendations.push('Enable minimal logging');
      }

      return recommendations;
   }
}

module.exports = DeviceMonitor;
