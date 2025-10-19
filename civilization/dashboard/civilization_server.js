const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const CivilizationDatabase = require('../db/database');
const path = require('path');

class CivilizationDashboard {
  constructor(port = 3001) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIO(this.server);
    
    this.db = new CivilizationDatabase('./data/civilization/civilization.db');
    
    this._setupRoutes();
    this._setupWebSocket();
  }
  
  _setupRoutes() {
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    this.app.get('/api/status', (req, res) => {
      const allBots = this.db.getAllBots();
      const villages = this.db.getAllVillages();
      const events = this.db.getRecentEvents(50);
      
      res.json({
        totalBots: allBots.length,
        villages: villages.length,
        recentEvents: events.length,
        uptime: process.uptime()
      });
    });
    
    this.app.get('/api/bots', (req, res) => {
      const bots = this.db.getAllBots();
      
      const botsWithDetails = bots.map(bot => {
        const personality = this.db.getPersonality(bot.id);
        const emotions = this.db.getLatestEmotions(bot.id);
        const relationships = this.db.getAllRelationships(bot.id);
        const goals = this.db.getActiveGoals(bot.id);
        
        return {
          ...bot,
          personality,
          emotions,
          relationshipCount: relationships.length,
          activeGoals: goals.length
        };
      });
      
      res.json(botsWithDetails);
    });
    
    this.app.get('/api/bots/:id', (req, res) => {
      const bot = this.db.getBot(req.params.id);
      
      if (!bot) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      
      const personality = this.db.getPersonality(bot.id);
      const emotions = this.db.getLatestEmotions(bot.id);
      const memories = this.db.getRecentMemories(bot.id, 50);
      const relationships = this.db.getAllRelationships(bot.id);
      const goals = this.db.getActiveGoals(bot.id);
      
      res.json({
        ...bot,
        personality,
        emotions,
        memories,
        relationships,
        goals
      });
    });
    
    this.app.get('/api/villages', (req, res) => {
      const villages = this.db.getAllVillages();
      
      const villagesWithMembers = villages.map(village => {
        const members = this.db.getVillageMembers(village.id);
        return { ...village, members };
      });
      
      res.json(villagesWithMembers);
    });
    
    this.app.get('/api/events', (req, res) => {
      const limit = parseInt(req.query.limit || '100');
      const type = req.query.type || null;
      
      const events = this.db.getRecentEvents(limit, type);
      res.json(events);
    });
    
    this.app.get('/api/relationships', (req, res) => {
      const allBots = this.db.getAllBots();
      const relationships = [];
      
      for (const bot of allBots) {
        const botRelationships = this.db.getAllRelationships(bot.id);
        relationships.push(...botRelationships.map(r => ({ ...r, bot_id: bot.id })));
      }
      
      res.json(relationships);
    });
    
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'civilization.html'));
    });
  }
  
  _setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log('[Dashboard] Client connected');
      
      this._sendUpdate(socket);
      
      socket.on('request_update', () => {
        this._sendUpdate(socket);
      });
      
      socket.on('disconnect', () => {
        console.log('[Dashboard] Client disconnected');
      });
    });
    
    setInterval(() => {
      this.io.emit('update', this._getDashboardData());
    }, 5000);
  }
  
  _sendUpdate(socket) {
    socket.emit('update', this._getDashboardData());
  }
  
  _getDashboardData() {
    const bots = this.db.getAllBots();
    const villages = this.db.getAllVillages();
    const events = this.db.getRecentEvents(20);
    
    return {
      bots: bots.map(bot => ({
        ...bot,
        emotions: this.db.getLatestEmotions(bot.id),
        personality: this.db.getPersonality(bot.id)
      })),
      villages: villages.map(v => ({
        ...v,
        members: this.db.getVillageMembers(v.id)
      })),
      events,
      timestamp: Date.now()
    };
  }
  
  start() {
    this.server.listen(this.port, () => {
      console.log(`[Dashboard] Civilization Dashboard running on http://localhost:${this.port}`);
    });
  }
}

const port = process.env.DASHBOARD_PORT || 3001;
const dashboard = new CivilizationDashboard(port);
dashboard.start();
