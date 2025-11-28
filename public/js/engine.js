/**
 * WrapMeApp - Calculation Engine v1.9.0
 * Warmth calculation guided by CLO values (approximate)
 *
 * v1.9.0: SMOOTH TEMPERATURE REQUIREMENTS - Linear interpolation for CLO requirements
 *         COMPLETE FIX: -15°C and -1°C now generate different recommendations
 *         Temperature requirements scale smoothly across all temperatures
 * v1.8.6: Fixed Rule 4 bug - changed from outerCLO < 0.37 to outerCLO === 0 (allow light jackets)
 *         Resolved 0-1°C recommendation failures
 * v1.8.5: SMOOTH TEMPERATURE SCALING - Replaced hard thresholds with linear interpolation
 *         Fixed temperature discontinuity bug in validation rules
 *         Comprehensive test suite (23 tests, 100% pass) + full documentation
 * v1.8.4: Temperature-dependent mid-layer limits - allow more layers in severe cold (<0°C)
 * v1.8.3: Fixed validation - allow mid-layer only combinations at 5°C+
 * v1.8.2: Removed overly strict winter coat validation (allow heavy layering in severe cold)
 * v1.8.1: Fixed unrealistic CLO requirements for cold weather
 * v1.8.0: T-shirt foundation layering system (t-shirt + thermal combinations)
 * v1.6.0: Auto-rebalancing after substitutions, simple math operations
 */

import { CLOTHING_ITEMS, TEMP_REQUIREMENTS, ADJUSTMENTS, PRACTICALITY_WEIGHTS, ITEM_FREQUENCY } from './config.js';

/**
 * Get temperature requirement band for given temperature
 * v1.9.0: SMOOTH INTERPOLATION - Linear interpolation between temperature bands
 * This ensures -15°C and -1°C are treated differently
 */
export function getTemperatureBand(temp) {
  // Define temperature breakpoints in descending order
  const bands = [
    { temp: 15, key: 15 },
    { temp: 10, key: 10 },
    { temp: 7, key: 7 },
    { temp: 5, key: 5 },
    { temp: 2, key: 2 },
    { temp: 0, key: 0 },
    { temp: -5, key: '-5' }
  ];

  // Handle temperatures at or above highest band
  if (temp >= 15) {
    return TEMP_REQUIREMENTS[15];
  }

  // Handle temperatures at or below lowest band
  if (temp <= -5) {
    return TEMP_REQUIREMENTS['-5'];
  }

  // Find the two bands to interpolate between
  let upperBand, lowerBand;
  for (let i = 0; i < bands.length - 1; i++) {
    if (temp >= bands[i + 1].temp && temp < bands[i].temp) {
      upperBand = bands[i];
      lowerBand = bands[i + 1];
      break;
    }
  }

  // If exact match, return that band
  for (const band of bands) {
    if (temp === band.temp) {
      return TEMP_REQUIREMENTS[band.key];
    }
  }

  // Interpolate between upper and lower bands
  const upperReq = TEMP_REQUIREMENTS[upperBand.key];
  const lowerReq = TEMP_REQUIREMENTS[lowerBand.key];

  // Calculate interpolation factor (0 = lower temp, 1 = upper temp)
  const factor = (temp - lowerBand.temp) / (upperBand.temp - lowerBand.temp);

  // Interpolate all CLO values
  const interpolate = (lower, upper) => lower + factor * (upper - lower);

  return {
    core: {
      min: interpolate(lowerReq.core.min, upperReq.core.min),
      max: interpolate(lowerReq.core.max, upperReq.core.max),
      optimal: interpolate(lowerReq.core.optimal, upperReq.core.optimal)
    },
    head: {
      min: interpolate(lowerReq.head.min, upperReq.head.min),
      max: interpolate(lowerReq.head.max, upperReq.head.max),
      optimal: interpolate(lowerReq.head.optimal, upperReq.head.optimal)
    },
    hands: {
      min: interpolate(lowerReq.hands.min, upperReq.hands.min),
      max: interpolate(lowerReq.hands.max, upperReq.hands.max),
      optimal: interpolate(lowerReq.hands.optimal, upperReq.hands.optimal)
    },
    neck: {
      min: interpolate(lowerReq.neck.min, upperReq.neck.min),
      max: interpolate(lowerReq.neck.max, upperReq.neck.max),
      optimal: interpolate(lowerReq.neck.optimal, upperReq.neck.optimal)
    },
    feet: {
      min: interpolate(lowerReq.feet.min, upperReq.feet.min),
      max: interpolate(lowerReq.feet.max, upperReq.feet.max),
      optimal: interpolate(lowerReq.feet.optimal, upperReq.feet.optimal)
    },
    riskLevel: lowerReq.riskLevel, // Use lower (colder) band's risk level
    alert: lowerReq.alert,
    maxExposure: lowerReq.maxExposure,
    warning: lowerReq.warning
  };
}

/**
 * Apply age/gender adjustments to requirements
 */
export function getAdjustedRequirements(temp, ageCategory, gender) {
  const baseReqs = getTemperatureBand(temp);

  // Clone requirements
  const adjusted = JSON.parse(JSON.stringify(baseReqs));

  // Apply age adjustment
  const ageAdj = ADJUSTMENTS.age[ageCategory] || { core: 0 };
  adjusted.core.min += ageAdj.core;
  adjusted.core.max += ageAdj.core;
  adjusted.core.optimal += ageAdj.core;

  // Apply gender adjustment
  const genderAdj = ADJUSTMENTS.gender[gender] || { core: 0 };
  adjusted.core.min += genderAdj.core;
  adjusted.core.max += genderAdj.core;
  adjusted.core.optimal += genderAdj.core;

  // Adjust exposure time for elderly
  if (ageCategory === 'elderly' && adjusted.maxExposure) {
    adjusted.maxExposure = Math.floor(adjusted.maxExposure * 0.7);
  }

  return adjusted;
}

/**
 * Get all clothing items as flat array
 * Filters items based on temperature restrictions
 */
function getAllItems(temp = 10) {
  const items = [];
  for (const zone in CLOTHING_ITEMS) {
    for (const key in CLOTHING_ITEMS[zone]) {
      const item = { key, ...CLOTHING_ITEMS[zone][key] };

      // Check temperature restrictions
      if (item.tempRestriction) {
        if (item.tempRestriction.max !== undefined && temp > item.tempRestriction.max) {
          continue; // Skip this item if temp is above max
        }
        if (item.tempRestriction.min !== undefined && temp < item.tempRestriction.min) {
          continue; // Skip this item if temp is below min
        }
      }

      items.push(item);
    }
  }
  return items;
}

/**
 * Find all combinations that meet CLO requirements
 * Uses dynamic programming / knapsack approach
 */
export function findCombinations(requirements, maxCombinations = 50, temp = 10, ageCategory = 'adult') {
  const allItems = getAllItems(temp);
  const combinations = [];

  // Separate items by zone
  const itemsByZone = {
    core: allItems.filter(item => item.zone === 'core'),
    head: allItems.filter(item => item.zone === 'head'),
    hands: allItems.filter(item => item.zone === 'hands'),
    neck: allItems.filter(item => item.zone === 'neck'),
    feet: allItems.filter(item => item.zone === 'feet')
  };

  // Generate combinations for each zone
  const coreCombos = generateZoneCombinations(itemsByZone.core, requirements.core, temp, ageCategory);
  const headCombos = generateZoneCombinations(itemsByZone.head, requirements.head, temp, ageCategory);
  const handsCombos = generateZoneCombinations(itemsByZone.hands, requirements.hands, temp, ageCategory);
  const neckCombos = generateZoneCombinations(itemsByZone.neck, requirements.neck, temp, ageCategory);
  const feetCombos = generateZoneCombinations(itemsByZone.feet, requirements.feet, temp, ageCategory);


  // Combine all zones
  for (const core of coreCombos.slice(0, 20)) {  // Limit to top 20 core combinations
    for (const head of headCombos.slice(0, 3)) {
      for (const hands of handsCombos.slice(0, 3)) {
        for (const neck of neckCombos.slice(0, 3)) {
          for (const feet of feetCombos.slice(0, 3)) {
            const combo = {
              core: core.items,
              head: head.items,
              hands: hands.items,
              neck: neck.items,
              feet: feet.items,
              totalCLO: core.clo + head.clo + hands.clo + neck.clo + feet.clo,
              coreCLO: core.clo,
              meetsRequirements: true
            };

            combinations.push(combo);

            if (combinations.length >= maxCombinations) {
              return combinations;
            }
          }
        }
      }
    }
  }

  return combinations;
}

/**
 * Generate combinations for a single zone
 * For core zone: Build from t-shirt as foundation, allow layering thermals on top
 * Allow up to 3 base layers for vulnerable populations in extreme cold
 */
function generateZoneCombinations(items, requirement, temp = 10, ageCategory = 'adult') {
  const combinations = [];
  const { min, max, optimal } = requirement;

  // Determine max base layers based on temperature and age
  // Allow 3 base layers for vulnerable populations (elderly, very-elderly, infant, child) in cold weather (≤5°C)
  const isVulnerable = ['elderly', 'very-elderly', 'infant', 'child'].includes(ageCategory);
  const isCold = temp <= 5;
  const maxBaseLayers = (isVulnerable && isCold) ? 3 : 2;

  // If no requirement (min = max = 0), return empty combination
  if (max === 0) {
    return [{ items: [], clo: 0 }];
  }

  // Group items by category for core zone
  const itemsByCategory = {};
  for (const item of items) {
    const cat = item.category || 'other';
    if (!itemsByCategory[cat]) itemsByCategory[cat] = [];
    itemsByCategory[cat].push(item);
  }

  // For core zone: enforce smart layering constraints during generation
  const isCore = items.some(item => item.zone === 'core');

  // Generate all possible combinations using recursive approach
  function recurse(index, currentItems, currentCLO) {
    // Smart constraints during generation
    if (isCore) {
      const baseItems = currentItems.filter(i => i.category === 'base');
      const baseCount = baseItems.length;
      const midCount = currentItems.filter(i => i.category === 'mid').length;
      const outerCount = currentItems.filter(i => i.category === 'outer').length;

      // NEW LAYERING RULES:
      // - Can have up to 2-3 base layers depending on vulnerability and temperature
      // - If 2+ base layers, must include t-shirt as foundation
      // - max 2 mid, max 1 outer
      if (baseCount > maxBaseLayers || midCount > 2 || outerCount > 1) {
        return; // Skip this branch
      }

      // If we have 2+ base layers, one MUST be t-shirt
      if (baseCount >= 2) {
        const hasTShirt = baseItems.some(item => item.key === 't-shirt');
        if (!hasTShirt) {
          return; // Skip - must have t-shirt as foundation
        }
      }
    }

    // Check if current combination is valid
    if (currentCLO >= min && currentCLO <= max * 1.3) {  // Allow 30% over max
      combinations.push({
        items: [...currentItems],
        clo: currentCLO,
        score: Math.abs(optimal - currentCLO)  // Distance from optimal
      });
    }

    // Stop if exceeded max significantly or reached end
    if (currentCLO > max * 1.5 || index >= items.length) {
      return;
    }

    // Try adding next item
    for (let i = index; i < items.length; i++) {
      const nextItem = items[i];

      // Additional constraint: don't add another item of same category if already at limit
      if (isCore) {
        const baseItems = currentItems.filter(it => it.category === 'base');
        const baseCount = baseItems.length;
        const midCount = currentItems.filter(it => it.category === 'mid').length;
        const outerCount = currentItems.filter(it => it.category === 'outer').length;

        // Allow up to 2-3 base layers depending on vulnerability and temperature
        if (nextItem.category === 'base' && baseCount >= maxBaseLayers) continue;

        // If adding second base layer, ensure we already have t-shirt OR we're adding t-shirt
        if (nextItem.category === 'base' && baseCount === 1) {
          const hasTShirt = baseItems.some(it => it.key === 't-shirt');
          const addingTShirt = nextItem.key === 't-shirt';
          if (!hasTShirt && !addingTShirt) continue; // Skip - need t-shirt as foundation
        }

        if (nextItem.category === 'mid' && midCount >= 2) continue;
        if (nextItem.category === 'outer' && outerCount >= 1) continue;
      }

      recurse(i + 1, [...currentItems, nextItem], currentCLO + nextItem.clo);
    }
  }

  // Start recursion
  recurse(0, [], 0);

  // Debug: Log why core zone might have 0 combinations
  if (isCore && combinations.length === 0) {
    console.log(`❌ Core zone generated 0 combinations!`);
    console.log(`Requirements: min=${min}, max=${max}, optimal=${optimal}`);
    console.log(`Available items:`, items.length);

    // Calculate maximum achievable CLO
    const maxBase = items.filter(i => i.category === 'base').slice(0, maxBaseLayers).reduce((sum, i) => sum + i.clo, 0);
    const maxMid = items.filter(i => i.category === 'mid').slice(0, 2).reduce((sum, i) => sum + i.clo, 0);
    const maxOuter = items.filter(i => i.category === 'outer').slice(0, 1).reduce((sum, i) => sum + i.clo, 0);
    const maxAchievable = maxBase + maxMid + maxOuter;
    console.log(`Max achievable CLO: ${maxAchievable.toFixed(2)} (base: ${maxBase.toFixed(2)}, mid: ${maxMid.toFixed(2)}, outer: ${maxOuter.toFixed(2)})`);
  }

  // Sort by score (closest to optimal)
  combinations.sort((a, b) => a.score - b.score);

  // Return top combinations
  return combinations.slice(0, 30);
}

// ===================================
// VALIDATION HELPER FUNCTIONS
// ===================================

/**
 * Calculate temperature-scaled max mid-layer CLO for outer layers
 */
function getMaxMidCLOForOuter(outerCLO, temp) {
  // Heavy coat (0.49+): Allow 1.00 CLO at -15°C, scaling down to 0.50 at 15°C
  if (outerCLO >= 0.49) {
    return Math.max(0.50, Math.min(1.00, 1.00 - ((temp + 15) / 30) * 0.50));
  }
  // Regular coat (0.37-0.48): Allow 0.95 CLO at -15°C, scaling down to 0.55 at 15°C
  if (outerCLO >= 0.37) {
    return Math.max(0.55, Math.min(0.95, 0.95 - ((temp + 15) / 30) * 0.40));
  }
  return Infinity; // No limit for lighter outer layers
}

/**
 * Check if combination has redundant mid-layer items
 */
function hasRedundantMidLayers(midItems) {
  const hasJumper = midItems.some(item => item.key === 'jumper');
  const hasThickJumper = midItems.some(item => item.key === 'thick-jumper');
  return hasJumper && hasThickJumper;
}

/**
 * Check if combination has too many heavy mid-layers
 */
function hasTooManyHeavyMidLayers(midItems) {
  const heavyMids = midItems.filter(item =>
    ['thick-jumper', 'fleece', 'hoodie'].includes(item.key)
  );
  return heavyMids.length > 2;
}

/**
 * Check if base layer configuration is valid
 */
function hasValidBaseLayers(baseItems, maxBaseLayers) {
  if (baseItems.length > maxBaseLayers) {
    return { valid: false, reason: `Too many base layers (>${maxBaseLayers})` };
  }

  // If 2+ base layers, one MUST be t-shirt
  if (baseItems.length >= 2) {
    const hasTShirt = baseItems.some(item => item.key === 't-shirt');
    if (!hasTShirt) {
      return { valid: false, reason: `${baseItems.length} base layers without t-shirt foundation` };
    }
  }

  // Vest cannot be worn alone - needs a top layer (t-shirt, long-sleeve, etc.)
  const hasVest = baseItems.some(item => item.key === 'tank-top');
  if (hasVest && baseItems.length === 1) {
    return { valid: false, reason: 'Vest cannot be worn alone (needs t-shirt or long-sleeve top)' };
  }

  return { valid: true };
}

// ===================================
// MAIN VALIDATION FUNCTION
// ===================================

/**
 * Validate combination for practical wearability
 * Returns true if valid, false if not (or {isValid, reason} if debug=true)
 */
export function isValidCombination(combination, debug = false, temp = 10, ageCategory = 'adult') {
  const reject = (reason) => debug ? { isValid: false, reason } : false;
  const accept = () => debug ? { isValid: true } : true;

  // Extract items by category
  const baseItems = combination.core.filter(item => item.category === 'base');
  const midItems = combination.core.filter(item => item.category === 'mid');
  const outerItems = combination.core.filter(item => item.category === 'outer');

  // Calculate CLO values
  const midCLO = midItems.reduce((sum, item) => sum + item.clo, 0);
  const outerCLO = outerItems.reduce((sum, item) => sum + item.clo, 0);

  // Determine max base layers
  const isVulnerable = ['elderly', 'very-elderly', 'infant', 'child'].includes(ageCategory);
  const maxBaseLayers = (isVulnerable && temp <= 5) ? 3 : 2;

  // Validate layer counts
  if (outerItems.length > 1) return reject('Multiple outer layers');
  if (midItems.length > 2) return reject('Too many mid-layers (>2)');

  // Validate base layers
  const baseValidation = hasValidBaseLayers(baseItems, maxBaseLayers);
  if (!baseValidation.valid) return reject(baseValidation.reason);

  // Check for redundant items
  if (hasRedundantMidLayers(midItems)) {
    return reject('Jumper and thick-jumper together (redundant)');
  }

  // Check for too many heavy mid-layers
  if (hasTooManyHeavyMidLayers(midItems)) {
    return reject('Too many heavy mid-layers (bulky)');
  }

  // Validate outer + mid layer combinations
  const maxMidCLO = getMaxMidCLOForOuter(outerCLO, temp);
  if (midCLO > maxMidCLO) {
    return reject('Excessive mid-layers for outer layer');
  }

  // Check for heavy mids without outer in cold weather
  if (temp < 2 && outerCLO === 0) {
    const threshold = 0.50 + (2 - temp) * 0.05;
    if (midCLO > threshold) {
      return reject('Heavy mid-layers need outer layer in cold weather');
    }
  }

  // Don't stack 3+ mid layers with outer (unless all light)
  if (midItems.length >= 3 && outerItems.length >= 1) {
    const allLightMids = midItems.every(item => item.clo <= 0.20);
    if (!allLightMids) {
      return reject('Too many mid-layers with outer (bulky)');
    }
  }

  return accept();
}

/**
 * Calculate practicality score for a combination
 */
export function calculatePracticalityScore(combination) {
  let score = 100;

  const allItems = [
    ...combination.core,
    ...combination.head,
    ...combination.hands,
    ...combination.neck,
    ...combination.feet
  ];

  // 1. Fewer items = higher score
  const itemCount = allItems.length;
  score += (10 - itemCount) * PRACTICALITY_WEIGHTS.fewerItems;

  // 2. Common items = higher score
  for (const item of allItems) {
    const frequency = ITEM_FREQUENCY[item.key] || 0.5;
    score += frequency * PRACTICALITY_WEIGHTS.commonItems;
  }

  // 3. Proper layering (base < mid < outer)
  const hasBase = combination.core.some(item => item.category === 'base');
  const hasMid = combination.core.some(item => item.category === 'mid');
  const hasOuter = combination.core.some(item => item.category === 'outer');

  if (hasBase && hasMid && hasOuter) {
    score += PRACTICALITY_WEIGHTS.properLayering * 2;
  } else if ((hasBase && hasMid) || (hasBase && hasOuter) || (hasMid && hasOuter)) {
    score += PRACTICALITY_WEIGHTS.properLayering;
  }

  // 4. Avoid redundancy (e.g. two jumpers, two jackets)
  const categoryCount = {};
  for (const item of combination.core) {
    const cat = `${item.category}-${item.zone}`;
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }

  for (const count of Object.values(categoryCount)) {
    if (count <= 1) {
      score += PRACTICALITY_WEIGHTS.avoidRedundancy;
    } else {
      score -= PRACTICALITY_WEIGHTS.avoidRedundancy * (count - 1);
    }
  }

  // 5. Prefer closer to optimal CLO
  const optimalScore = 100 / (1 + Math.abs(combination.coreCLO - combination.targetOptimal || 0) * 10);
  score += optimalScore;

  // 6. STRONG preference for t-shirt as base layer (most common household item)
  const hasTShirt = combination.core.some(item => item.key === 't-shirt');
  if (hasTShirt) {
    score += 25; // Large bonus for t-shirt foundation
  }

  // 7. Bonus for t-shirt + thermal layering (realistic cold weather approach)
  const hasThermal = combination.core.some(item =>
    item.key === 'thermal-top'
  );
  if (hasTShirt && hasThermal) {
    score += 15; // Additional bonus for proper layering
  }

  return score;
}

/**
 * Calculate diversity score between two combinations
 * Higher score = more different
 */
function calculateDiversity(combo1, combo2) {
  let diversityScore = 0;

  // 1. Item count difference (major diversity factor)
  const allItems1 = [...combo1.core, ...combo1.head, ...combo1.hands, ...combo1.neck, ...combo1.feet];
  const allItems2 = [...combo2.core, ...combo2.head, ...combo2.hands, ...combo2.neck, ...combo2.feet];
  const itemCountDiff = Math.abs(allItems1.length - allItems2.length);
  diversityScore += itemCountDiff * 20; // Heavy weight on item count difference

  // 2. Different items used (check key overlap)
  const keys1 = new Set(allItems1.map(item => item.key));
  const keys2 = new Set(allItems2.map(item => item.key));
  const overlap = [...keys1].filter(key => keys2.has(key)).length;
  const totalUnique = keys1.size + keys2.size - overlap;
  const differentItems = totalUnique - overlap;
  diversityScore += differentItems * 10;

  // 3. Layer distribution difference
  const layerDist1 = {
    base: combo1.core.filter(i => i.category === 'base').length,
    mid: combo1.core.filter(i => i.category === 'mid').length,
    outer: combo1.core.filter(i => i.category === 'outer').length
  };
  const layerDist2 = {
    base: combo2.core.filter(i => i.category === 'base').length,
    mid: combo2.core.filter(i => i.category === 'mid').length,
    outer: combo2.core.filter(i => i.category === 'outer').length
  };
  const layerDiff = Math.abs(layerDist1.base - layerDist2.base) +
                    Math.abs(layerDist1.mid - layerDist2.mid) +
                    Math.abs(layerDist1.outer - layerDist2.outer);
  diversityScore += layerDiff * 15;

  // 4. CLO distribution difference (heavy outer + light mid vs light outer + heavy mid)
  const baseCLO1 = combo1.core.filter(i => i.category === 'base').reduce((sum, i) => sum + i.clo, 0);
  const midCLO1 = combo1.core.filter(i => i.category === 'mid').reduce((sum, i) => sum + i.clo, 0);
  const outerCLO1 = combo1.core.filter(i => i.category === 'outer').reduce((sum, i) => sum + i.clo, 0);

  const baseCLO2 = combo2.core.filter(i => i.category === 'base').reduce((sum, i) => sum + i.clo, 0);
  const midCLO2 = combo2.core.filter(i => i.category === 'mid').reduce((sum, i) => sum + i.clo, 0);
  const outerCLO2 = combo2.core.filter(i => i.category === 'outer').reduce((sum, i) => sum + i.clo, 0);

  const cloDiff = Math.abs(baseCLO1 - baseCLO2) +
                  Math.abs(midCLO1 - midCLO2) +
                  Math.abs(outerCLO1 - outerCLO2);
  diversityScore += cloDiff * 30;

  // 5. Accessory difference
  const hasHead1 = combo1.head.length > 0;
  const hasHead2 = combo2.head.length > 0;
  const hasHands1 = combo1.hands.length > 0;
  const hasHands2 = combo2.hands.length > 0;

  if (hasHead1 !== hasHead2) diversityScore += 5;
  if (hasHands1 !== hasHands2) diversityScore += 5;

  return diversityScore;
}

/**
 * Select diverse combinations
 * Returns exactly 3 distinctly different options
 */
function selectDiverseCombinations(validCombinations) {
  if (validCombinations.length === 0) return [];
  if (validCombinations.length === 1) return validCombinations;

  const selected = [];

  // 1. Pick the best overall (highest practicality score)
  selected.push(validCombinations[0]);

  // 2. Pick the most different from the first
  let maxDiversity = -1;
  let mostDifferent = null;
  for (let i = 1; i < validCombinations.length; i++) {
    const diversity = calculateDiversity(selected[0], validCombinations[i]);
    if (diversity > maxDiversity) {
      maxDiversity = diversity;
      mostDifferent = validCombinations[i];
    }
  }
  if (mostDifferent) selected.push(mostDifferent);

  // 3. Pick third option that maximizes total diversity from both existing picks
  if (validCombinations.length > 2) {
    let maxTotalDiversity = -1;
    let thirdPick = null;
    for (let i = 1; i < validCombinations.length; i++) {
      const combo = validCombinations[i];
      if (selected.includes(combo)) continue;

      const diversity1 = calculateDiversity(selected[0], combo);
      const diversity2 = calculateDiversity(selected[1], combo);
      const totalDiversity = diversity1 + diversity2;

      if (totalDiversity > maxTotalDiversity) {
        maxTotalDiversity = totalDiversity;
        thirdPick = combo;
      }
    }
    if (thirdPick) selected.push(thirdPick);
  }

  return selected;
}

/**
 * Count common household items in a combination
 * These are items most people already own: t-shirt, jumper, hoodie, fleece, coat, thick jumper, thick shirt, light jacket
 */
function countCommonItems(combination) {
  const veryCommonItems = ['t-shirt', 'jumper', 'hoodie', 'fleece', 'coat', 'long-sleeve-top', 'light-jacket'];
  let count = 0;

  const allItems = [
    ...combination.core,
    ...combination.head,
    ...combination.hands,
    ...combination.neck,
    ...combination.feet
  ];

  for (const item of allItems) {
    if (veryCommonItems.includes(item.key)) {
      count++;
    }
  }

  return count;
}

/**
 * Main function: Get clothing recommendations
 */
export function getRecommendations(temp, ageCategory, gender, warmthAdjustment = 0) {
  // 1. Get adjusted requirements
  let requirements = getAdjustedRequirements(temp, ageCategory, gender);

  // Apply heat calibration:
  // Positive values = "more layers" (increase target CLO requirement)
  // Negative values = "less layers" (decrease target CLO requirement)
  // Range: -2 (fewer layers) to +2 (more layers)
  // ±2 = ±0.5 CLO (major item like coat), ±1 = ±0.25 CLO (minor item like t-shirt/jumper)
  if (warmthAdjustment !== 0) {
    const adjustment = warmthAdjustment * 0.25;
    requirements = {
      core: {
        min: Math.max(0, requirements.core.min + adjustment),
        max: requirements.core.max + adjustment,
        optimal: requirements.core.optimal + adjustment
      },
      head: requirements.head,
      hands: requirements.hands,
      neck: requirements.neck,
      feet: requirements.feet,
      alert: requirements.alert,
      warning: requirements.warning,
      maxExposure: requirements.maxExposure,
      riskLevel: requirements.riskLevel
    };
  }

  // 2. Find all valid combinations
  const combinations = findCombinations(requirements, 50, temp, ageCategory);

  // 3. Filter out impractical combinations
  let rejectionReasons = {};
  const validCombinations = combinations.filter(combo => {
    const validationResult = isValidCombination(combo, true, temp, ageCategory); // Pass debug flag, temperature, and age
    if (!validationResult.isValid) {
      rejectionReasons[validationResult.reason] = (rejectionReasons[validationResult.reason] || 0) + 1;
    }
    return validationResult.isValid || validationResult.isValid === true;
  });

  // Log rejection summary if no valid combinations found
  if (validCombinations.length === 0 && Object.keys(rejectionReasons).length > 0) {
    console.log('Rejection reasons:', rejectionReasons);
  }

  // 4. Calculate practicality scores for valid combinations
  for (const combo of validCombinations) {
    combo.targetOptimal = requirements.core.optimal;
    combo.practicalityScore = calculatePracticalityScore(combo);
    combo.requirements = requirements;

    // Calculate "common items bonus" for tie-breaking
    // Prioritize combinations with very common household items
    combo.commonItemsCount = countCommonItems(combo);
  }

  // 5. Sort by practicality score (descending), with tie-breaker for common items
  validCombinations.sort((a, b) => {
    const scoreDiff = b.practicalityScore - a.practicalityScore;

    // If scores are very close (within 5 points), prefer combination with more common items
    if (Math.abs(scoreDiff) <= 5) {
      return b.commonItemsCount - a.commonItemsCount;
    }

    return scoreDiff;
  });

  // 6. Select 3 diverse combinations
  if (validCombinations.length === 0) {
    console.error('ERROR: No valid combinations found! Requirements may be too strict.');
    console.log('Requirements:', requirements);
    // Return empty array - app will handle this gracefully
    return [];
  }

  const diverseCombos = selectDiverseCombinations(validCombinations);

  return diverseCombos;
}

/**
 * Find substitutes for a specific item
 * Returns items from any zone that provide similar warmth
 */
export function findSubstitutes(currentRecommendation, itemToReplace, temp = 10) {
  const { requirements } = currentRecommendation;
  const zone = itemToReplace.zone;

  // Get all items (filtered by temperature)
  const allItems = getAllItems(temp);

  // For core items, only substitute with other core items (same category logic)
  if (zone === 'core') {
    const category = itemToReplace.category;
    const sameCategory = allItems.filter(item =>
      item.zone === 'core' &&
      item.category === category &&
      item.key !== itemToReplace.key
    );

    const currentZoneItems = currentRecommendation.core;
    const currentZoneCLO = currentZoneItems.reduce((sum, item) => sum + item.clo, 0);
    const cloWithoutItem = currentZoneCLO - itemToReplace.clo;

    const zoneRequirement = requirements.core;
    const { min, max, optimal } = zoneRequirement;

    const validSubstitutes = sameCategory.filter(substitute => {
      const newCLO = cloWithoutItem + substitute.clo;
      return newCLO >= min * 0.9 && newCLO <= max * 1.3;
    });

    validSubstitutes.sort((a, b) => {
      const aDistance = Math.abs((cloWithoutItem + a.clo) - optimal);
      const bDistance = Math.abs((cloWithoutItem + b.clo) - optimal);
      return aDistance - bDistance;
    });

    return validSubstitutes.slice(0, 5);
  }

  // For accessories (head, hands, neck, feet), only allow like-for-like substitution
  // Define accessory groups that can be exchanged
  const accessoryGroups = {
    // Neck items: scarf with balaclava and neck warmer
    'scarf': ['thick-scarf', 'balaclava', 'neck-warmer'],
    'thick-scarf': ['scarf', 'balaclava', 'neck-warmer'],
    'balaclava': ['scarf', 'thick-scarf', 'neck-warmer'],
    'neck-warmer': ['scarf', 'thick-scarf', 'balaclava'],

    // Head items: hat with warm-hat
    'hat': ['warm-hat'],
    'warm-hat': ['hat'],

    // Hand items: gloves with mittens and insulated-gloves
    'gloves': ['insulated-gloves', 'mittens'],
    'insulated-gloves': ['gloves', 'mittens'],
    'mittens': ['gloves', 'insulated-gloves'],

    // Feet items: thermal-socks with "double up on socks"
    'thermal-socks': ['thick-socks', 'double-socks'],
    'thick-socks': ['thermal-socks', 'double-socks']
  };

  // Get allowed substitutes for this item
  const allowedKeys = accessoryGroups[itemToReplace.key] || [];

  // Find matching items from the allowed list
  const validSubstitutes = allItems.filter(item =>
    allowedKeys.includes(item.key)
  );

  return validSubstitutes;
}

/**
 * Replace an item in a recommendation with smart substitution logic
 * Handles cross-zone accessory replacement and automatic adjustments
 */
export function replaceItem(currentRecommendation, oldItem, newItem) {
  const oldZone = oldItem.zone;
  const newZone = newItem.zone;

  // Create a copy of the recommendation
  const updated = {
    ...currentRecommendation,
    core: [...currentRecommendation.core],
    head: [...currentRecommendation.head],
    hands: [...currentRecommendation.hands],
    neck: [...currentRecommendation.neck],
    feet: [...currentRecommendation.feet],
    requirements: currentRecommendation.requirements
  };

  // Remove old item from its zone
  const oldZoneItems = oldZone === 'core' ? updated.core :
                       oldZone === 'head' ? updated.head :
                       oldZone === 'hands' ? updated.hands :
                       oldZone === 'neck' ? updated.neck :
                       updated.feet;

  const oldIndex = oldZoneItems.findIndex(item => item.key === oldItem.key);
  if (oldIndex !== -1) {
    oldZoneItems.splice(oldIndex, 1);
  }

  // Add new item to its zone (may be different for accessories)
  const newZoneItems = newZone === 'core' ? updated.core :
                       newZone === 'head' ? updated.head :
                       newZone === 'hands' ? updated.hands :
                       newZone === 'neck' ? updated.neck :
                       updated.feet;

  newZoneItems.push(newItem);

  // Cross-zone substitution handling
  // (no logging needed - visual feedback in UI)

  // Smart substitution: Adjust accessories based on outer layer warmth
  if (oldItem.category === 'outer' && newItem.category === 'outer') {
    const cloChange = newItem.clo - oldItem.clo;

    // CASE 1: Upgrading to a warmer coat (e.g., light jacket → winter coat)
    // Check if new coat is heavy (>= 0.45 CLO) regardless of what we're replacing
    const isUpgradingToHeavyCoat = newItem.clo >= 0.45;

    if (cloChange >= 0.15 || isUpgradingToHeavyCoat) {
      // Calculate current CLO for each zone
      const coreCLO = updated.core.reduce((sum, item) => sum + item.clo, 0);
      const headCLO = updated.head.reduce((sum, item) => sum + item.clo, 0);
      const handsCLO = updated.hands.reduce((sum, item) => sum + item.clo, 0);
      const neckCLO = updated.neck.reduce((sum, item) => sum + item.clo, 0);
      const feetCLO = updated.feet.reduce((sum, item) => sum + item.clo, 0);

      // Check if we're over the max for core
      const coreMax = updated.requirements.core.max;
      if (coreCLO > coreMax * 1.1) {
        // We need to remove some accessories to compensate
        // Priority: remove in order that keeps us closest to optimal

        // Build list of removable accessories with their zones
        const removableAccessories = [
          ...updated.head.map(item => ({ item, zone: 'head', currentCLO: headCLO, req: updated.requirements.head })),
          ...updated.neck.map(item => ({ item, zone: 'neck', currentCLO: neckCLO, req: updated.requirements.neck })),
          ...updated.hands.map(item => ({ item, zone: 'hands', currentCLO: handsCLO, req: updated.requirements.hands })),
          ...updated.feet.map(item => ({ item, zone: 'feet', currentCLO: feetCLO, req: updated.requirements.feet }))
        ];

        // Sort by priority: remove items from zones that are most over their minimum
        removableAccessories.sort((a, b) => {
          const aOverMin = a.currentCLO - a.req.min;
          const bOverMin = b.currentCLO - b.req.min;
          return bOverMin - aOverMin; // Remove items from zones most over minimum first
        });

        // Remove accessories until we're under max
        let currentCoreCLO = coreCLO;
        for (const accessory of removableAccessories) {
          if (currentCoreCLO <= coreMax * 1.05) break; // Stop when we're close to max

          // Remove this accessory
          const zoneArray = accessory.zone === 'head' ? updated.head :
                           accessory.zone === 'hands' ? updated.hands :
                           accessory.zone === 'neck' ? updated.neck :
                           updated.feet;

          const idx = zoneArray.findIndex(item => item.key === accessory.item.key);
          if (idx !== -1) {
            zoneArray.splice(idx, 1);
            // Update current CLO (rough approximation)
            currentCoreCLO -= accessory.item.clo * 0.3; // Accessories contribute less to core warmth
          }
        }
      }
    }

    // CASE 2: Downgrading to a lighter coat (e.g., winter coat → light jacket)
    if (cloChange <= -0.15) {
      // Calculate current CLO
      const coreCLO = updated.core.reduce((sum, item) => sum + item.clo, 0);
      const coreMin = updated.requirements.core.min;

      // Check if we're below minimum for core
      if (coreCLO < coreMin) {
        // We need to add accessories to compensate for the lighter coat
        const cloDeficit = coreMin - coreCLO;

        // Priority order: scarf > gloves > hat (neck warmth is most important)
        const accessoriesToAdd = [];

        // Check what we don't have and add them from config
        if (updated.neck.length === 0 && updated.requirements.neck.max > 0) {
          // Add scarf
          if (CLOTHING_ITEMS.neck && CLOTHING_ITEMS.neck['scarf']) {
            const scarf = { key: 'scarf', ...CLOTHING_ITEMS.neck['scarf'] };
            accessoriesToAdd.push({ item: scarf, zone: 'neck' });
          }
        }

        if (updated.hands.length === 0 && updated.requirements.hands.max > 0 && coreCLO + 0.05 < coreMin) {
          // Add gloves
          if (CLOTHING_ITEMS.hands && CLOTHING_ITEMS.hands['gloves']) {
            const gloves = { key: 'gloves', ...CLOTHING_ITEMS.hands['gloves'] };
            accessoriesToAdd.push({ item: gloves, zone: 'hands' });
          }
        }

        if (updated.head.length === 0 && updated.requirements.head.max > 0 && coreCLO + 0.10 < coreMin) {
          // Add hat
          if (CLOTHING_ITEMS.head && CLOTHING_ITEMS.head['hat']) {
            const hat = { key: 'hat', ...CLOTHING_ITEMS.head['hat'] };
            accessoriesToAdd.push({ item: hat, zone: 'head' });
          }
        }

        // Add the accessories
        for (const accessory of accessoriesToAdd) {
          if (accessory.zone === 'head') updated.head.push(accessory.item);
          else if (accessory.zone === 'hands') updated.hands.push(accessory.item);
          else if (accessory.zone === 'neck') updated.neck.push(accessory.item);
          else if (accessory.zone === 'feet') updated.feet.push(accessory.item);
        }
      }
    }
  }

  // Recalculate CLO before rebalancing
  let allItems = [...updated.core, ...updated.head, ...updated.hands, ...updated.neck, ...updated.feet];
  updated.totalCLO = allItems.reduce((sum, item) => sum + item.clo, 0);
  updated.coreCLO = updated.core.reduce((sum, item) => sum + item.clo, 0);

  // AUTO-REBALANCING: Adjust items if we're too far from optimal
  const optimal = updated.requirements.core.optimal;
  const threshold = 0.20; // Trigger rebalance if more than 0.20 CLO away from optimal
  const currentDistance = updated.coreCLO - optimal;

  // CASE 1: Too warm - remove smallest non-base item to get closer to optimal
  if (currentDistance > threshold) {
    // Build list of removable items (no base layers)
    const removableItems = [];

    // Mid layers from core
    for (const item of updated.core) {
      if (item.category === 'mid') {
        removableItems.push({ item, zone: 'core', clo: item.clo });
      }
    }

    // All accessories
    for (const item of updated.head) removableItems.push({ item, zone: 'head', clo: item.clo });
    for (const item of updated.hands) removableItems.push({ item, zone: 'hands', clo: item.clo });
    for (const item of updated.neck) removableItems.push({ item, zone: 'neck', clo: item.clo });
    for (const item of updated.feet) removableItems.push({ item, zone: 'feet', clo: item.clo });

    // Sort by CLO value (smallest first)
    removableItems.sort((a, b) => a.clo - b.clo);

    // Try removing items until we get closer to optimal
    for (const { item, zone, clo } of removableItems) {
      const newCoreCLO = updated.coreCLO - clo;
      const newDistance = newCoreCLO - optimal;

      // Check if removing this item gets us closer to optimal (and doesn't overshoot)
      if (Math.abs(newDistance) < Math.abs(currentDistance) && newDistance >= -threshold) {
        // Remove from appropriate zone
        const zoneArray = zone === 'core' ? updated.core :
                         zone === 'head' ? updated.head :
                         zone === 'hands' ? updated.hands :
                         zone === 'neck' ? updated.neck :
                         updated.feet;

        const idx = zoneArray.findIndex(i => i.key === item.key);
        if (idx !== -1) {
          zoneArray.splice(idx, 1);
          updated.coreCLO = newCoreCLO;
          break; // Only remove one item
        }
      }
    }
  }

  // CASE 2: Too cold - add an accessory to get closer to optimal
  if (currentDistance < -threshold) {
    // Find possible accessories to add (only if zone is empty and allowed)
    const possibleAdds = [];

    if (updated.neck.length === 0 && updated.requirements.neck.max > 0) {
      if (CLOTHING_ITEMS.neck && CLOTHING_ITEMS.neck['scarf']) {
        const scarf = { key: 'scarf', ...CLOTHING_ITEMS.neck['scarf'] };
        possibleAdds.push({ item: scarf, zone: 'neck', clo: scarf.clo });
      }
    }

    if (updated.head.length === 0 && updated.requirements.head.max > 0) {
      if (CLOTHING_ITEMS.head && CLOTHING_ITEMS.head['hat']) {
        const hat = { key: 'hat', ...CLOTHING_ITEMS.head['hat'] };
        possibleAdds.push({ item: hat, zone: 'head', clo: hat.clo });
      }
    }

    if (updated.hands.length === 0 && updated.requirements.hands.max > 0) {
      if (CLOTHING_ITEMS.hands && CLOTHING_ITEMS.hands['gloves']) {
        const gloves = { key: 'gloves', ...CLOTHING_ITEMS.hands['gloves'] };
        possibleAdds.push({ item: gloves, zone: 'hands', clo: gloves.clo });
      }
    }

    // Find item that gets us closest to optimal without overshooting
    let bestAdd = null;
    let bestDistance = Math.abs(currentDistance);

    for (const { item, zone, clo } of possibleAdds) {
      const newCoreCLO = updated.coreCLO + clo;
      const newDistance = newCoreCLO - optimal;

      // Check if adding this item gets us closer to optimal (and doesn't overshoot too much)
      if (Math.abs(newDistance) < bestDistance && newDistance <= threshold) {
        bestDistance = Math.abs(newDistance);
        bestAdd = { item, zone, clo };
      }
    }

    // Add the best item
    if (bestAdd) {
      const { item, zone, clo } = bestAdd;
      const zoneArray = zone === 'head' ? updated.head :
                       zone === 'hands' ? updated.hands :
                       updated.neck;

      zoneArray.push(item);
      updated.coreCLO += clo;
    }
  }

  // Final CLO recalculation after potential rebalancing
  allItems = [...updated.core, ...updated.head, ...updated.hands, ...updated.neck, ...updated.feet];
  updated.totalCLO = allItems.reduce((sum, item) => sum + item.clo, 0);
  updated.coreCLO = updated.core.reduce((sum, item) => sum + item.clo, 0);

  return updated;
}
