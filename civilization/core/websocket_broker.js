const WebSocket = require('ws');

class WebSocketBroker {
  constructor(port, logger) {
    this.port = port;
    this.logger = logger;
    this.wss = null;
    this.bots = new Map();
    this.connections = new Map();
  }
  
  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    
    this.wss.on('connection', (ws) => {
      this.logger.info('[Broker] New WebSocket connection');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this._handleMessage(ws, message);
        } catch (error) {
          this.logger.error('[Broker] Message parse error:', error.message);
        }
      });
      
      ws.on('close', () => {
        this._handleDisconnect(ws);
      });
      
      ws.on('error', (error) => {
        this.logger.error('[Broker] WebSocket error:', error.message);
      });
    });
    
    this.logger.info(`[Broker] WebSocket server started on port ${this.port}`);
  }
  
  registerBot(botId, botInstance) {
    this.bots.set(botId, botInstance);
    this.logger.info(`[Broker] Bot ${botId} registered`);
  }
  
  unregisterBot(botId) {
    this.bots.delete(botId);
    this.connections.delete(botId);
    this.logger.info(`[Broker] Bot ${botId} unregistered`);
  }
  
  _handleMessage(ws, message) {
    const { type, from, to, data } = message;
    
    switch(type) {
      case 'register':
        this.connections.set(data.botId, ws);
        this._sendResponse(ws, 'registered', { botId: data.botId });
        break;
      
      case 'broadcast':
        this._broadcast(from, data);
        break;
      
      case 'direct_message':
        this._sendDirectMessage(from, to, data);
        break;
      
      case 'trade_offer':
        this._handleTradeOffer(from, to, data);
        break;
      
      case 'alliance_request':
        this._handleAllianceRequest(from, to, data);
        break;
      
      case 'help_request':
        this._handleHelpRequest(from, to, data);
        break;
      
      default:
        this.logger.warn('[Broker] Unknown message type:', type);
    }
  }
  
  _handleDisconnect(ws) {
    for (const [botId, connection] of this.connections.entries()) {
      if (connection === ws) {
        this.connections.delete(botId);
        this.logger.info(`[Broker] Bot ${botId} disconnected`);
        break;
      }
    }
  }
  
  _broadcast(fromBotId, data) {
    const message = {
      type: 'broadcast',
      from: fromBotId,
      timestamp: Date.now(),
      data: data
    };
    
    this.connections.forEach((ws, botId) => {
      if (botId !== fromBotId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
    
    this.logger.info(`[Broker] Broadcast from ${fromBotId} to ${this.connections.size - 1} bots`);
  }
  
  _sendDirectMessage(fromBotId, toBotId, data) {
    const targetWs = this.connections.get(toBotId);
    
    if (!targetWs || targetWs.readyState !== WebSocket.OPEN) {
      this.logger.warn(`[Broker] Target bot ${toBotId} not connected`);
      return false;
    }
    
    const message = {
      type: 'direct_message',
      from: fromBotId,
      to: toBotId,
      timestamp: Date.now(),
      data: data
    };
    
    targetWs.send(JSON.stringify(message));
    this.logger.info(`[Broker] Direct message: ${fromBotId} -> ${toBotId}`);
    
    return true;
  }
  
  _handleTradeOffer(fromBotId, toBotId, data) {
    const message = {
      type: 'trade_offer',
      from: fromBotId,
      to: toBotId,
      timestamp: Date.now(),
      offer: data
    };
    
    const targetWs = this.connections.get(toBotId);
    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(JSON.stringify(message));
      this.logger.info(`[Broker] Trade offer: ${fromBotId} -> ${toBotId}`);
    }
  }
  
  _handleAllianceRequest(fromBotId, toBotId, data) {
    const message = {
      type: 'alliance_request',
      from: fromBotId,
      to: toBotId,
      timestamp: Date.now(),
      data: data
    };
    
    const targetWs = this.connections.get(toBotId);
    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(JSON.stringify(message));
      this.logger.info(`[Broker] Alliance request: ${fromBotId} -> ${toBotId}`);
    }
  }
  
  _handleHelpRequest(fromBotId, toBotId, data) {
    const message = {
      type: 'help_request',
      from: fromBotId,
      to: toBotId,
      timestamp: Date.now(),
      data: data
    };
    
    if (toBotId === 'all') {
      this._broadcast(fromBotId, { type: 'help_request', ...data });
    } else {
      const targetWs = this.connections.get(toBotId);
      if (targetWs && targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(JSON.stringify(message));
      }
    }
    
    this.logger.info(`[Broker] Help request: ${fromBotId} -> ${toBotId}`);
  }
  
  _sendResponse(ws, type, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
    }
  }
  
  getConnectedBots() {
    return Array.from(this.connections.keys());
  }
  
  getBotCount() {
    return this.connections.size;
  }
  
  stop() {
    if (this.wss) {
      this.wss.close();
      this.logger.info('[Broker] WebSocket server stopped');
    }
  }
}

module.exports = WebSocketBroker;
