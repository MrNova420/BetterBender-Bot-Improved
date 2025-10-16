const Vec3 = require('vec3');

class StructureBuilder {
   constructor(bot) {
      this.bot = bot;
      this.currentProject = null;
      this.buildQueue = [];
      this.templates = this.initializeTemplates();
   }

   initializeTemplates() {
      return {
         mansion: {
            name: 'Luxury Mansion',
            size: { width: 20, length: 25, height: 12 },
            materials: {
               'oak_planks': 1500,
               'stone_bricks': 800,
               'glass': 200,
               'oak_stairs': 150,
               'oak_slab': 100,
               'spruce_door': 8,
               'torch': 80,
               'oak_fence': 60,
               'red_carpet': 120,
               'crafting_table': 4,
               'furnace': 8,
               'bed': 6,
               'chest': 12
            },
            floors: 3,
            rooms: ['entrance', 'living_room', 'kitchen', 'dining', 'bedroom_master', 'bedroom_1', 'bedroom_2', 'bathroom', 'storage', 'balcony'],
            style: 'luxury'
         },
         house: {
            name: 'Cozy House',
            size: { width: 12, length: 15, height: 8 },
            materials: {
               'oak_planks': 600,
               'cobblestone': 400,
               'glass': 80,
               'oak_stairs': 50,
               'oak_slab': 40,
               'oak_door': 3,
               'torch': 30,
               'bed': 2,
               'chest': 6,
               'crafting_table': 2,
               'furnace': 4
            },
            floors: 2,
            rooms: ['living_room', 'kitchen', 'bedroom', 'storage'],
            style: 'cozy'
         },
         tower: {
            name: 'Guard Tower',
            size: { width: 8, length: 8, height: 20 },
            materials: {
               'stone_bricks': 800,
               'oak_planks': 200,
               'ladder': 60,
               'glass': 40,
               'torch': 50,
               'chest': 4
            },
            floors: 5,
            rooms: ['entrance', 'storage', 'guard_post', 'lookout'],
            style: 'defensive'
         },
         farm: {
            name: 'Automated Farm',
            size: { width: 30, length: 30, height: 6 },
            materials: {
               'oak_planks': 400,
               'cobblestone': 300,
               'water_bucket': 10,
               'wheat_seeds': 200,
               'carrot': 100,
               'potato': 100,
               'oak_fence': 120,
               'chest': 8,
               'composter': 4
            },
            floors: 1,
            rooms: ['crop_field', 'storage_barn', 'animal_pen'],
            style: 'functional'
         },
         castle: {
            name: 'Medieval Castle',
            size: { width: 40, length: 40, height: 25 },
            materials: {
               'stone_bricks': 3000,
               'cobblestone': 2000,
               'oak_planks': 800,
               'glass': 150,
               'iron_bars': 100,
               'oak_door': 12,
               'torch': 200,
               'ladder': 80,
               'chest': 20
            },
            floors: 4,
            rooms: ['throne_room', 'armory', 'barracks', 'kitchen', 'storage', 'tower_1', 'tower_2', 'tower_3', 'tower_4', 'walls'],
            style: 'medieval'
         },
         shop: {
            name: 'Trading Shop',
            size: { width: 10, length: 12, height: 7 },
            materials: {
               'spruce_planks': 400,
               'glass': 100,
               'oak_planks': 200,
               'chest': 15,
               'oak_sign': 20,
               'torch': 40,
               'spruce_door': 2
            },
            floors: 2,
            rooms: ['showroom', 'storage', 'office'],
            style: 'commercial'
         }
      };
   }

   async buildStructure(structureType, x, y, z, options = {}) {
      const template = this.templates[structureType];
      if (!template) {
         throw new Error(`Unknown structure: ${structureType}`);
      }

      this.currentProject = {
         type: structureType,
         template: template,
         position: new Vec3(x, y, z),
         progress: 0,
         stage: 'foundation',
         options: options
      };

      console.log(`🏗️  Starting ${template.name} construction at ${x}, ${y}, ${z}`);
      console.log(`📦 Required materials:`, template.materials);

      await this.buildFoundation();
      await this.buildWalls();
      await this.buildFloors();
      await this.buildRoof();
      await this.buildInterior();
      await this.addDetails();

      console.log(`✅ ${template.name} completed!`);
      return this.currentProject;
   }

   async buildFoundation() {
      const { template, position } = this.currentProject;
      const { width, length } = template.size;
      
      console.log('🔨 Building foundation...');
      this.currentProject.stage = 'foundation';

      const foundationMaterial = template.style === 'luxury' ? 'stone_bricks' : 'cobblestone';

      for (let x = 0; x < width; x++) {
         for (let z = 0; z < length; z++) {
            await this.placeBlock(
               position.x + x,
               position.y - 1,
               position.z + z,
               foundationMaterial
            );
         }
      }

      for (let x = -1; x <= width; x++) {
         for (let z = -1; z <= length; z++) {
            if (x === -1 || x === width || z === -1 || z === length) {
               await this.placeBlock(
                  position.x + x,
                  position.y - 1,
                  position.z + z,
                  foundationMaterial
               );
            }
         }
      }
   }

   async buildWalls() {
      const { template, position } = this.currentProject;
      const { width, length, height } = template.size;
      
      console.log('🧱 Building walls...');
      this.currentProject.stage = 'walls';

      const wallMaterial = template.style === 'luxury' ? 'oak_planks' : 
                          template.style === 'defensive' ? 'stone_bricks' : 'cobblestone';

      for (let y = 0; y < height; y++) {
         for (let x = 0; x < width; x++) {
            await this.placeBlock(position.x + x, position.y + y, position.z, wallMaterial);
            await this.placeBlock(position.x + x, position.y + y, position.z + length - 1, wallMaterial);
         }

         for (let z = 0; z < length; z++) {
            await this.placeBlock(position.x, position.y + y, position.z + z, wallMaterial);
            await this.placeBlock(position.x + width - 1, position.y + y, position.z + z, wallMaterial);
         }
      }

      await this.addWindows();
      await this.addDoors();
   }

   async buildFloors() {
      const { template, position } = this.currentProject;
      const { width, length, floors } = template;
      
      console.log('🏢 Building floors...');
      this.currentProject.stage = 'floors';

      const floorMaterial = 'oak_planks';
      const floorHeight = Math.floor(template.size.height / floors);

      for (let floor = 1; floor < floors; floor++) {
         const y = position.y + (floor * floorHeight);
         
         for (let x = 1; x < width - 1; x++) {
            for (let z = 1; z < length - 1; z++) {
               await this.placeBlock(position.x + x, y, position.z + z, floorMaterial);
            }
         }
      }
   }

   async buildRoof() {
      const { template, position } = this.currentProject;
      const { width, length, height } = template.size;
      
      console.log('🏠 Building roof...');
      this.currentProject.stage = 'roof';

      if (template.style === 'luxury' || template.style === 'cozy') {
         await this.buildPyramidRoof();
      } else {
         await this.buildFlatRoof();
      }
   }

   async buildPyramidRoof() {
      const { template, position } = this.currentProject;
      const { width, length, height } = template.size;
      const roofMaterial = 'oak_stairs';

      const centerX = Math.floor(width / 2);
      const centerZ = Math.floor(length / 2);
      const maxDist = Math.max(centerX, centerZ);

      for (let layer = 0; layer < maxDist; layer++) {
         const y = position.y + height + layer;
         const inset = layer;

         for (let x = inset; x < width - inset; x++) {
            await this.placeBlock(position.x + x, y, position.z + inset, roofMaterial);
            await this.placeBlock(position.x + x, y, position.z + length - 1 - inset, roofMaterial);
         }

         for (let z = inset; z < length - inset; z++) {
            await this.placeBlock(position.x + inset, y, position.z + z, roofMaterial);
            await this.placeBlock(position.x + width - 1 - inset, y, position.z + z, roofMaterial);
         }
      }
   }

   async buildFlatRoof() {
      const { template, position } = this.currentProject;
      const { width, length, height } = template.size;
      const roofMaterial = template.style === 'defensive' ? 'stone_bricks' : 'oak_planks';

      for (let x = 0; x < width; x++) {
         for (let z = 0; z < length; z++) {
            await this.placeBlock(position.x + x, position.y + height, position.z + z, roofMaterial);
         }
      }
   }

   async buildInterior() {
      const { template, position } = this.currentProject;
      
      console.log('🪑 Building interior...');
      this.currentProject.stage = 'interior';

      await this.addFurniture();
      await this.addLighting();
      await this.addStorage();
   }

   async addWindows() {
      const { template, position } = this.currentProject;
      const { width, length, height } = template.size;
      const windowInterval = 3;

      for (let y = 2; y < height - 1; y += 3) {
         for (let x = 2; x < width - 2; x += windowInterval) {
            await this.placeBlock(position.x + x, position.y + y, position.z, 'glass');
            await this.placeBlock(position.x + x, position.y + y, position.z + length - 1, 'glass');
         }

         for (let z = 2; z < length - 2; z += windowInterval) {
            await this.placeBlock(position.x, position.y + y, position.z + z, 'glass');
            await this.placeBlock(position.x + width - 1, position.y + y, position.z + z, 'glass');
         }
      }
   }

   async addDoors() {
      const { template, position } = this.currentProject;
      const { width } = template.size;
      const doorType = template.style === 'luxury' ? 'spruce_door' : 'oak_door';

      const doorX = Math.floor(width / 2);
      await this.placeBlock(position.x + doorX, position.y, position.z, doorType);
      await this.placeBlock(position.x + doorX, position.y + 1, position.z, doorType);
   }

   async addFurniture() {
      const { template, position } = this.currentProject;
      const { width, length, floors } = template;

      if (template.rooms.includes('bedroom') || template.rooms.includes('bedroom_master')) {
         await this.placeBlock(position.x + 2, position.y, position.z + 2, 'bed');
      }

      if (template.rooms.includes('kitchen')) {
         await this.placeBlock(position.x + 2, position.y, position.z + length - 3, 'crafting_table');
         await this.placeBlock(position.x + 3, position.y, position.z + length - 3, 'furnace');
      }
   }

   async addLighting() {
      const { template, position } = this.currentProject;
      const { width, length, height } = template.size;

      for (let y = 2; y < height; y += 4) {
         for (let x = 3; x < width - 1; x += 4) {
            for (let z = 3; z < length - 1; z += 4) {
               await this.placeBlock(position.x + x, position.y + y, position.z + z, 'torch');
            }
         }
      }
   }

   async addStorage() {
      const { template, position } = this.currentProject;
      const { width, length } = template.size;

      if (template.rooms.includes('storage')) {
         for (let i = 0; i < 6; i++) {
            await this.placeBlock(
               position.x + width - 2,
               position.y,
               position.z + 2 + i,
               'chest'
            );
         }
      }
   }

   async addDetails() {
      const { template, position } = this.currentProject;
      
      console.log('✨ Adding decorative details...');
      this.currentProject.stage = 'details';

      if (template.style === 'luxury') {
         await this.addLuxuryDetails();
      } else if (template.style === 'defensive') {
         await this.addDefensiveDetails();
      }
   }

   async addLuxuryDetails() {
      const { position } = this.currentProject;
      const { width, length } = this.currentProject.template.size;

      for (let x = 1; x < width - 1; x += 2) {
         await this.placeBlock(position.x + x, position.y, position.z + 1, 'red_carpet');
      }

      await this.placeBlock(position.x + 2, position.y, position.z + 2, 'oak_fence');
   }

   async addDefensiveDetails() {
      const { position } = this.currentProject;
      const { width, length, height } = this.currentProject.template.size;

      for (let x = 0; x < width; x += 3) {
         await this.placeBlock(position.x + x, position.y + height + 1, position.z, 'cobblestone');
      }
   }

   async placeBlock(x, y, z, blockType) {
      try {
         const mcData = require('minecraft-data')(this.bot.version);
         const block = mcData.blocksByName[blockType];
         
         if (!block) {
            console.log(`⚠️  Block type ${blockType} not found`);
            return false;
         }

         const referenceBlock = this.bot.blockAt(new Vec3(x, y - 1, z));
         if (!referenceBlock) return false;

         await this.bot.equip(block.id, 'hand');
         await this.bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
         
         return true;
      } catch (error) {
         console.log(`❌ Failed to place ${blockType} at ${x},${y},${z}:`, error.message);
         return false;
      }
   }

   getMaterialsList(structureType) {
      const template = this.templates[structureType];
      return template ? template.materials : null;
   }

   getAvailableStructures() {
      return Object.keys(this.templates).map(key => ({
         type: key,
         name: this.templates[key].name,
         size: this.templates[key].size,
         floors: this.templates[key].floors,
         style: this.templates[key].style
      }));
   }
}

module.exports = StructureBuilder;
