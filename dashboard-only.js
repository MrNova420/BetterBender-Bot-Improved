const fs = require('fs');
const DashboardServer = require('./dashboard/server');

console.log('🎛️  BetterBender 2.0 - Dashboard Only Mode');
console.log('==========================================\n');

const configPath = process.argv[2] || 'CONFIG.json';

if (!fs.existsSync(configPath)) {
  console.error(`❌ Config file not found: ${configPath}`);
  console.log('Please copy CONFIG.example.json to CONFIG.json and configure it');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('Starting dashboard server...');
console.log('Bot will NOT start automatically.');
console.log('Use the dashboard to start/stop the bot manually.\n');

const dashboard = new DashboardServer(config, null);

dashboard.start().then(() => {
  console.log('\n✅ Dashboard ready!');
  console.log(`📊 Access at: http://localhost:${config.dashboard?.port || 5000}`);
  console.log(`🔑 Admin token: ${config.dashboard?.adminToken || 'CHANGE_THIS_TOKEN_NOW'}`);
  console.log('\nTo start the bot:');
  console.log('  1. Open the dashboard in your browser');
  console.log('  2. Enter your admin token');
  console.log('  3. Click "Start Bot"\n');
  console.log('💡 Tip: The bot will remember its last mode and resume tasks\n');
});

const BotEngine = require('./src/engine');

dashboard.on = function(event, callback) {
  if (event === 'start_bot_request') {
    if (!this.engine) {
      console.log('🚀 Starting bot engine...');
      
      const engine = new BotEngine(config);
      
      const AFKAddon = require('./addons/afk');
      const PlayerAddon = require('./addons/player');
      const CraftingAddon = require('./addons/crafting');
      const PathfindingAddon = require('./addons/pathfinding');
      const MiningAddon = require('./addons/mining');
      const BuildingAddon = require('./addons/building');
      const TradingAddon = require('./addons/trading');
      
      engine.registerAddon(AFKAddon);
      engine.registerAddon(PlayerAddon);
      engine.registerAddon(CraftingAddon);
      engine.registerAddon(PathfindingAddon);
      engine.registerAddon(MiningAddon);
      engine.registerAddon(BuildingAddon);
      engine.registerAddon(TradingAddon);
      
      this.setEngine(engine);
      engine.start();
    }
  }
};
