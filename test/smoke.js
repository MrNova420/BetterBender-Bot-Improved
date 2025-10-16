const fs = require('fs');
const path = require('path');

console.log('🧪 BetterBender 2.0 - Smoke Tests');
console.log('==================================\n');

let passedTests = 0;
let failedTests = 0;
const testResults = [];

function test(name, fn) {
  try {
    fn();
    passedTests++;
    testResults.push(`✓ ${name}`);
    console.log(`✓ ${name}`);
  } catch (err) {
    failedTests++;
    testResults.push(`✗ ${name}: ${err.message}`);
    console.error(`✗ ${name}:`, err.message);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('Testing Core Components...\n');

test('Logger module loads', () => {
  const Logger = require('../src/core/logger');
  assert(typeof Logger === 'function', 'Logger should be a constructor');
});

test('Logger creates instances', () => {
  const Logger = require('../src/core/logger');
  const logger = new Logger({ logToFile: false });
  assert(logger, 'Logger instance should be created');
  assert(typeof logger.info === 'function', 'Logger should have info method');
});

test('SafetyMonitor module loads', () => {
  const SafetyMonitor = require('../src/core/safety');
  assert(typeof SafetyMonitor === 'function', 'SafetyMonitor should be a constructor');
});

test('SafetyMonitor creates instances', () => {
  const SafetyMonitor = require('../src/core/safety');
  const safety = new SafetyMonitor({}, null);
  assert(safety, 'SafetyMonitor instance should be created');
  assert(typeof safety.start === 'function', 'SafetyMonitor should have start method');
});

test('TaskManager module loads', () => {
  const TaskManager = require('../src/core/taskManager');
  assert(typeof TaskManager === 'function', 'TaskManager should be a constructor');
});

test('TaskManager creates instances', () => {
  const TaskManager = require('../src/core/taskManager');
  const taskManager = new TaskManager({ enablePersistence: false }, null);
  assert(taskManager, 'TaskManager instance should be created');
  assert(typeof taskManager.addTask === 'function', 'TaskManager should have addTask method');
});

test('TaskManager can add tasks', () => {
  const TaskManager = require('../src/core/taskManager');
  const taskManager = new TaskManager({ enablePersistence: false }, null);
  const taskId = taskManager.addTask({ type: 'test', params: {} });
  assert(taskId, 'Task ID should be returned');
  const status = taskManager.getStatus();
  assert(status.queueLength === 1, 'Queue should have 1 task');
});

test('ReconnectManager module loads', () => {
  const ReconnectManager = require('../src/utils/reconnect');
  assert(typeof ReconnectManager === 'function', 'ReconnectManager should be a constructor');
});

test('Auth utils module loads', () => {
  const { getAuthOptions } = require('../src/utils/auth');
  assert(typeof getAuthOptions === 'function', 'getAuthOptions should be a function');
});

test('Auth utils handles offline auth', () => {
  const { getAuthOptions } = require('../src/utils/auth');
  const options = getAuthOptions({ type: 'offline', username: 'TestBot' });
  assert(options.username === 'TestBot', 'Username should be TestBot');
  assert(options.auth === 'offline', 'Auth type should be offline');
});

console.log('\nTesting Addons...\n');

test('AFK addon loads', () => {
  const AFKAddon = require('../addons/afk');
  assert(AFKAddon, 'AFK addon should load');
  assert(AFKAddon.name === 'afk', 'AFK addon should have name "afk"');
  assert(typeof AFKAddon.init === 'function', 'AFK addon should have init method');
});

test('Player addon loads', () => {
  const PlayerAddon = require('../addons/player');
  assert(PlayerAddon, 'Player addon should load');
  assert(PlayerAddon.name === 'player', 'Player addon should have name "player"');
  assert(typeof PlayerAddon.init === 'function', 'Player addon should have init method');
});

test('Crafting addon loads', () => {
  const CraftingAddon = require('../addons/crafting');
  assert(CraftingAddon, 'Crafting addon should load');
  assert(typeof CraftingAddon.init === 'function', 'Crafting addon should have init method');
});

test('Pathfinding addon loads', () => {
  const PathfindingAddon = require('../addons/pathfinding');
  assert(PathfindingAddon, 'Pathfinding addon should load');
  assert(typeof PathfindingAddon.init === 'function', 'Pathfinding addon should have init method');
});

test('Mining addon loads', () => {
  const MiningAddon = require('../addons/mining');
  assert(MiningAddon, 'Mining addon should load');
  assert(typeof MiningAddon.init === 'function', 'Mining addon should have init method');
});

test('Building addon loads', () => {
  const BuildingAddon = require('../addons/building');
  assert(BuildingAddon, 'Building addon should load');
  assert(typeof BuildingAddon.init === 'function', 'Building addon should have init method');
});

test('Trading addon loads', () => {
  const TradingAddon = require('../addons/trading');
  assert(TradingAddon, 'Trading addon should load');
  assert(typeof TradingAddon.init === 'function', 'Trading addon should have init method');
});

console.log('\nTesting Engine...\n');

test('Engine module loads', () => {
  const BotEngine = require('../src/engine');
  assert(typeof BotEngine === 'function', 'BotEngine should be a constructor');
});

test('Engine creates instances with valid config', () => {
  const BotEngine = require('../src/engine');
  
  const testConfig = {
    server: { host: 'localhost', port: 25565, version: '1.20.1' },
    auth: { type: 'offline', username: 'TestBot' },
    mode: { current: 'afk' },
    safety: { maxCpuPercent: 30, maxMemoryMB: 512 },
    dashboard: { enabled: false },
    afkMode: {},
    playerMode: {},
    reconnect: { enabled: false },
    logging: { logToFile: false },
    tasks: { enablePersistence: false }
  };
  
  const engine = new BotEngine(testConfig);
  assert(engine, 'Engine instance should be created');
  assert(typeof engine.start === 'function', 'Engine should have start method');
  assert(typeof engine.stop === 'function', 'Engine should have stop method');
  assert(typeof engine.registerAddon === 'function', 'Engine should have registerAddon method');
});

test('Engine can register addons', () => {
  const BotEngine = require('../src/engine');
  
  const testConfig = {
    server: { host: 'localhost', port: 25565, version: '1.20.1' },
    auth: { type: 'offline', username: 'TestBot' },
    mode: { current: 'afk' },
    safety: { maxCpuPercent: 30, maxMemoryMB: 512 },
    dashboard: { enabled: false },
    afkMode: {},
    playerMode: {},
    reconnect: { enabled: false },
    logging: { logToFile: false },
    tasks: { enablePersistence: false }
  };
  
  const engine = new BotEngine(testConfig);
  const AFKAddon = require('../addons/afk');
  
  engine.registerAddon(AFKAddon);
  assert(engine.addons.has('afk'), 'Engine should have registered AFK addon');
});

console.log('\nTesting Configuration...\n');

test('CONFIG.example.json is valid JSON', () => {
  const configPath = path.join(__dirname, '..', 'CONFIG.example.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configData);
  assert(config, 'Config should parse as JSON');
  assert(config.server, 'Config should have server section');
  assert(config.auth, 'Config should have auth section');
  assert(config.safety, 'Config should have safety section');
});

test('package.json is valid', () => {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageData = fs.readFileSync(packagePath, 'utf8');
  const pkg = JSON.parse(packageData);
  assert(pkg.name === 'betterbender-2.0', 'Package name should be betterbender-2.0');
  assert(pkg.dependencies, 'Package should have dependencies');
  assert(pkg.dependencies.mineflayer, 'Package should have mineflayer dependency');
});

console.log('\n==================================');
console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed\n`);

if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results');
}

const resultFile = path.join('test-results', `smoke-test-${Date.now()}.log`);
const resultContent = [
  'BetterBender 2.0 - Smoke Test Results',
  `Date: ${new Date().toISOString()}`,
  `Passed: ${passedTests}`,
  `Failed: ${failedTests}`,
  '',
  'Details:',
  ...testResults
].join('\n');

fs.writeFileSync(resultFile, resultContent);
console.log(`✓ Test results saved to: ${resultFile}\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✅ All tests passed!\n');
  process.exit(0);
}
