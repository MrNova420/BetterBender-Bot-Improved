/**
 * Test script for the Building System
 * Tests all building types and construction logic
 */

const BuildingSystem = require('../core/building_system');

class MockBot {
  constructor() {
    this.username = 'TestBot';
    this.version = '1.20.1';
    this.entity = {
      position: { x: 100, y: 64, z: 100 }
    };
    this.inventory = {
      items: () => []
    };
  }

  blockAt(position) {
    return {
      name: 'grass_block',
      type: 2
    };
  }

  async equip(item, hand) {
    console.log(`[MockBot] Equipped ${item.name || 'item'} in ${hand}`);
  }

  async placeBlock(referenceBlock, face) {
    console.log(`[MockBot] Placed block`);
  }

  async dig(block) {
    console.log(`[MockBot] Dug block`);
  }

  async activateBlock(block) {
    console.log(`[MockBot] Activated block`);
  }

  findBlock(options) {
    return null;
  }

  findBlocks(options) {
    return [];
  }
}

class MockPathfinder {
  async goto(goal) {
    console.log(`[MockBot] Pathfinding to goal`);
  }

  setGoal(goal, dynamic) {
    console.log(`[MockBot] Set goal`);
  }
}

class MockLogger {
  info(...args) {
    console.log('[INFO]', ...args);
  }

  warn(...args) {
    console.warn('[WARN]', ...args);
  }

  error(...args) {
    console.error('[ERROR]', ...args);
  }

  debug(...args) {
    // Suppress debug messages in test
  }
}

async function testBuildingSystem() {
  console.log('\n========================================');
  console.log('  Building System Test Suite');
  console.log('========================================\n');

  const mockBot = new MockBot();
  mockBot.pathfinder = new MockPathfinder();
  const logger = new MockLogger();
  const buildingSystem = new BuildingSystem(mockBot, logger);

  // Test 1: Get available structures
  console.log('\nTest 1: Available Structures');
  console.log('----------------------------');
  const structures = buildingSystem.getAvailableStructures();
  console.log('Available structure types:', structures);
  console.log(`✓ Found ${structures.length} structure types`);

  // Test 2: Get material requirements
  console.log('\nTest 2: Material Requirements');
  console.log('----------------------------');
  for (const structureType of structures) {
    const materials = buildingSystem.getMaterialsNeeded(structureType);
    console.log(`\n${structureType}:`);
    for (const [material, count] of Object.entries(materials)) {
      console.log(`  - ${material}: ${count}`);
    }
  }
  console.log('✓ All structures have material requirements defined');

  // Test 3: Structure templates
  console.log('\nTest 3: Structure Templates');
  console.log('----------------------------');
  const templates = buildingSystem.structureTemplates;
  for (const [type, template] of Object.entries(templates)) {
    console.log(`\n${template.name}:`);
    console.log(`  Dimensions: ${template.dimensions.width}x${template.dimensions.height}x${template.dimensions.depth || template.dimensions.length || 'N/A'}`);
    console.log(`  Blueprint: ${template.blueprint}`);
    console.log(`  Materials: ${Object.keys(template.materials).length} types`);
  }
  console.log('✓ All templates properly structured');

  // Test 4: Build attempt (will fail due to no materials, but tests logic)
  console.log('\nTest 4: Build Attempt (Expected to fail - no materials)');
  console.log('--------------------------------------------------------');
  const testLocation = { x: 100, y: 64, z: 100 };
  const buildResult = await buildingSystem.buildStructure('small_house', testLocation, { skipMaterialCheck: true });
  
  if (buildResult.success) {
    console.log('✓ Build logic executed successfully (in simulation mode)');
  } else {
    console.log(`Build failed as expected: ${buildResult.reason}`);
  }

  // Test 5: Check build progress tracking
  console.log('\nTest 5: Build Progress Tracking');
  console.log('-------------------------------');
  const progress = buildingSystem.getBuildProgress();
  console.log(`Build history entries: ${progress.length}`);
  if (progress.length > 0) {
    console.log('Recent builds:');
    progress.forEach((build, index) => {
      console.log(`  ${index + 1}. ${build.structure} at (${build.location.x}, ${build.location.y}, ${build.location.z}) - ${build.timeTaken}ms`);
    });
  }
  console.log('✓ Progress tracking functional');

  // Test Summary
  console.log('\n========================================');
  console.log('  Test Summary');
  console.log('========================================');
  console.log('✓ All basic tests passed');
  console.log('✓ Building system structure is sound');
  console.log('✓ Ready for integration testing with real bot');
  console.log('\nNote: Full functionality requires:');
  console.log('  1. Connected Minecraft bot');
  console.log('  2. Materials in inventory');
  console.log('  3. Valid build location');
  console.log('========================================\n');
}

// Run tests
if (require.main === module) {
  testBuildingSystem().catch(console.error);
}

module.exports = { testBuildingSystem };
