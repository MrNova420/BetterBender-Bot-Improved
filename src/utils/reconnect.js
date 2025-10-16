class ReconnectManager {
  constructor(config = {}, logger = null) {
    this.logger = logger || console;
    this.enabled = config.enabled !== false;
    this.maxAttempts = config.maxAttempts || 100;
    this.initialDelayMs = config.initialDelayMs || 5000;
    this.maxDelayMs = config.maxDelayMs || 300000;
    this.backoffMultiplier = config.backoffMultiplier || 1.5;
    
    this.attempts = 0;
    this.reconnectTimeout = null;
  }
  
  shouldReconnect() {
    if (!this.enabled) return false;
    if (this.attempts >= this.maxAttempts) {
      this.logger.error(`Max reconnect attempts (${this.maxAttempts}) reached`);
      return false;
    }
    return true;
  }
  
  getDelay() {
    const delay = Math.min(
      this.initialDelayMs * Math.pow(this.backoffMultiplier, this.attempts),
      this.maxDelayMs
    );
    return Math.round(delay);
  }
  
  scheduleReconnect(callback) {
    if (!this.shouldReconnect()) return false;
    
    const delay = this.getDelay();
    this.attempts++;
    
    this.logger.info(`Reconnecting in ${delay}ms (attempt ${this.attempts}/${this.maxAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      callback();
    }, delay);
    
    return true;
  }
  
  reset() {
    this.attempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  cancel() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
      this.logger.info('Reconnect cancelled');
    }
  }
}

module.exports = ReconnectManager;
