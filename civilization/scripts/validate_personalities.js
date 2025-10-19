#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const personalitiesDir = path.join(__dirname, '../personalities');

console.log('Validating personality files...\n');

let valid = 0;
let invalid = 0;

const requiredFields = ['name', 'description', 'traits', 'preferences', 'motivation_weights'];
const requiredTraits = ['curiosity', 'sociability', 'ambition', 'aggression', 'empathy', 'creativity', 'risk_tolerance', 'work_ethic'];
const requiredWeights = ['survival', 'exploration', 'social', 'building', 'resource_gathering', 'trading', 'resting'];
const requiredPreferences = ['preferred_biomes', 'building_style', 'favorite_activities', 'social_frequency'];

try {
  const files = fs.readdirSync(personalitiesDir);
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    const filePath = path.join(personalitiesDir, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      let errors = [];
      
      if (typeof data !== 'object' || data === null) {
        errors.push('Root must be an object');
      }
      
      for (const field of requiredFields) {
        if (!data[field]) {
          errors.push(`Missing field: ${field}`);
        }
      }
      
      if (data.traits && typeof data.traits !== 'object') {
        errors.push('traits must be an object');
      }
      
      if (data.preferences && typeof data.preferences !== 'object') {
        errors.push('preferences must be an object');
      }
      
      if (data.motivation_weights && typeof data.motivation_weights !== 'object') {
        errors.push('motivation_weights must be an object');
      }
      
      if (data.traits) {
        for (const trait of requiredTraits) {
          if (data.traits[trait] === undefined) {
            errors.push(`Missing trait: ${trait}`);
          } else if (typeof data.traits[trait] !== 'number' || data.traits[trait] < 0 || data.traits[trait] > 1) {
            errors.push(`Invalid trait value for ${trait}: ${data.traits[trait]} (must be 0-1)`);
          }
        }
      }
      
      if (data.motivation_weights) {
        for (const weight of requiredWeights) {
          if (data.motivation_weights[weight] === undefined) {
            errors.push(`Missing motivation weight: ${weight}`);
          } else if (typeof data.motivation_weights[weight] !== 'number' || data.motivation_weights[weight] < 0) {
            errors.push(`Invalid motivation weight for ${weight}: ${data.motivation_weights[weight]} (must be number >= 0)`);
          }
        }
      }
      
      if (data.preferences) {
        for (const pref of requiredPreferences) {
          if (!data.preferences[pref]) {
            errors.push(`Missing preference: ${pref}`);
          }
        }
        
        if (data.preferences.preferred_biomes && !Array.isArray(data.preferences.preferred_biomes)) {
          errors.push('preferred_biomes must be an array');
        }
        
        if (data.preferences.favorite_activities && !Array.isArray(data.preferences.favorite_activities)) {
          errors.push('favorite_activities must be an array');
        }
      }
      
      if (errors.length === 0) {
        console.log(`✓ ${file} - VALID`);
        valid++;
      } else {
        console.log(`✗ ${file} - INVALID:`);
        errors.forEach(err => console.log(`  - ${err}`));
        invalid++;
      }
      
    } catch (error) {
      console.log(`✗ ${file} - ERROR: ${error.message}`);
      invalid++;
    }
  }
  
  console.log(`\n${valid} valid, ${invalid} invalid`);
  
  if (invalid > 0) {
    console.log('\nFix invalid files before running the civilization system!');
    process.exit(1);
  } else {
    console.log('\nAll personality files are valid!');
    process.exit(0);
  }
  
} catch (error) {
  console.error('Failed to read personalities directory:', error.message);
  process.exit(1);
}
