const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');

class SafetyMonitor {
  constructor(config = {}, logger = null) {
    this.config = {
      maxCpuPercent: config.maxCpuPercent || 30,
      maxMemoryMB: config.maxMemoryMB || 512,
      maxBlocksPerHour: config.maxBlocksPerHour || 200,
      checkIntervalMs: config.checkIntervalMs || 30000,
      enableThermalMonitoring: config.enableThermalMonitoring !== false,
      enableBatteryMonitoring: config.enableBatteryMonitoring !== false,
      autoThrottle: config.autoThrottle !== false
    };
    
    this.logger = logger || console;
    this.metrics = {
      cpu: 0,
      memory: 0,
      temperature: null,
      battery: null,
      blocksThisHour: 0,
      lastBlockReset: Date.now()
    };
    
    this.throttled = false;
    this.monitorInterval = null;
    this.callbacks = {
      onThrottle: null,
      onRestore: null,
      onCritical: null
    };
    
    this.lastCpuInfo = null;
    this.lastMemCheck = Date.now();
    this.startupTime = Date.now();
    this.cpuReadings = [];
  }
  
  start() {
    this.logger.info('Safety monitor started');
    this.monitorInterval = setInterval(() => {
      this._checkMetrics();
    }, this.config.checkIntervalMs);
    
    this._checkMetrics();
  }
  
  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.logger.info('Safety monitor stopped');
  }
  
  _checkMetrics() {
    this.metrics.cpu = this._getCpuUsage();
    this.metrics.memory = this._getMemoryUsageMB();
    
    if (this.config.enableThermalMonitoring) {
      this.metrics.temperature = this._getTemperature();
    }
    
    if (this.config.enableBatteryMonitoring) {
      this.metrics.battery = this._getBatteryStatus();
    }
    
    if (Date.now() - this.metrics.lastBlockReset > 3600000) {
      this.metrics.blocksThisHour = 0;
      this.metrics.lastBlockReset = Date.now();
    }
    
    const shouldThrottle = this._shouldThrottle();
    
    if (shouldThrottle && !this.throttled) {
      this._activateThrottle();
    } else if (!shouldThrottle && this.throttled) {
      this._deactivateThrottle();
    }
  }
  
  _getCpuUsage() {
    const cpus = os.cpus();
    
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const currentCpuInfo = {
      idle: totalIdle,
      total: totalTick,
      timestamp: Date.now()
    };
    
    if (!this.lastCpuInfo) {
      this.lastCpuInfo = currentCpuInfo;
      return 0;
    }
    
    const idleDiff = currentCpuInfo.idle - this.lastCpuInfo.idle;
    const totalDiff = currentCpuInfo.total - this.lastCpuInfo.total;
    
    this.lastCpuInfo = currentCpuInfo;
    
    if (totalDiff === 0) return 0;
    
    const usage = 100 - (100 * idleDiff / totalDiff);
    return Math.max(0, Math.min(100, Math.round(usage)));
  }
  
  _getMemoryUsageMB() {
    const processMemory = process.memoryUsage();
    return Math.round(processMemory.rss / (1024 * 1024));
  }
  
  _getTemperature() {
    if (!fs.existsSync('/sys/class/thermal/thermal_zone0/temp')) {
      return null;
    }
    
    try {
      const temp = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8');
      return parseInt(temp) / 1000;
    } catch (err) {
      return null;
    }
  }
  
  _getBatteryStatus() {
    try {
      const output = execSync('termux-battery-status 2>/dev/null', { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (err) {
      return null;
    }
  }
  
  _shouldThrottle() {
    const uptimeSeconds = (Date.now() - this.startupTime) / 1000;
    const isStartupPhase = uptimeSeconds < 30;
    
    this.cpuReadings.push(this.metrics.cpu);
    if (this.cpuReadings.length > 5) {
      this.cpuReadings.shift();
    }
    
    const avgCpu = this.cpuReadings.reduce((a, b) => a + b, 0) / this.cpuReadings.length;
    
    if (avgCpu > this.config.maxCpuPercent && !isStartupPhase) {
      this.logger.warn(`CPU usage high (avg): ${Math.round(avgCpu)}%`);
      return true;
    }
    
    if (this.metrics.memory > this.config.maxMemoryMB) {
      this.logger.warn(`Memory usage high: ${this.metrics.memory}MB`);
      return true;
    }
    
    if (this.metrics.temperature && this.metrics.temperature > 60) {
      this.logger.warn(`Temperature high: ${this.metrics.temperature}°C`);
      return true;
    }
    
    if (this.metrics.battery && this.metrics.battery.status === 'DISCHARGING' && this.metrics.battery.percentage < 20) {
      this.logger.warn(`Battery low: ${this.metrics.battery.percentage}%`);
      return true;
    }
    
    if (this.metrics.blocksThisHour > this.config.maxBlocksPerHour) {
      this.logger.warn(`Block limit reached: ${this.metrics.blocksThisHour}/hour`);
      return true;
    }
    
    return false;
  }
  
  _activateThrottle() {
    this.throttled = true;
    this.logger.warn('THROTTLING ACTIVATED - Reducing bot activity');
    
    if (this.callbacks.onThrottle) {
      this.callbacks.onThrottle(this.metrics);
    }
  }
  
  _deactivateThrottle() {
    this.throttled = false;
    this.logger.info('Throttling deactivated - Resuming normal activity');
    
    if (this.callbacks.onRestore) {
      this.callbacks.onRestore(this.metrics);
    }
  }
  
  recordBlock() {
    this.metrics.blocksThisHour++;
  }
  
  isThrottled() {
    return this.throttled;
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
  
  on(event, callback) {
    if (event === 'throttle') {
      this.callbacks.onThrottle = callback;
    } else if (event === 'restore') {
      this.callbacks.onRestore = callback;
    } else if (event === 'critical') {
      this.callbacks.onCritical = callback;
    }
  }
}

module.exports = SafetyMonitor;
