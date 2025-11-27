/**
 * WrapMeApp - Configuration v1.8.7
 * CLO values guided by ASHRAE Standard 55 and ISO 9920 (simplified for practical use)
 * Temperature requirements informed by UKHSA Cold Weather Plan, NHS, WHO guidelines
 *
 * v1.8.7: Simplified warmth indicator - removed CLO references, added color gradient
 * v1.8.1: Fixed unrealistic CLO requirements for cold weather (0°C and below)
 * v1.6.0: Boosted t-shirt and common household item frequencies
 */

// CLO = Clothing Insulation Unit (1 CLO = 0.155 m²·K/W)

export const CLOTHING_ITEMS = {
  // Base Layers (Core)
  base: {
    'vest': {
      clo: 0.15,
      name: 'Vest',
      file: 'base/vest-underlayer.png',
      category: 'base',
      zone: 'core'
    },
    't-shirt': {
      clo: 0.2,
      name: 'T-shirt',
      file: 'base/t-shirt.png',
      category: 'base',
      zone: 'core'
    },
    'long-sleeve-top': {
      clo: 0.25,
      name: 'Long-sleeve top',
      file: 'base/long-sleeve-top.png',
      category: 'base',
      zone: 'core'
    },
    'long-sleeve-shirt': {
      clo: 0.25,
      name: 'Long-sleeve shirt',
      file: 'base/long-sleeve-shirt.png',
      category: 'base',
      zone: 'core'
    },
    'thermal-top': {
      clo: 0.35,
      name: 'Thermal top',
      file: 'base/thermal-top.png',
      category: 'base',
      zone: 'core'
    },
    'thermal-leggings': {
      clo: 0.35,
      name: 'Thermal leggings',
      file: 'base/thermal-leggings.png',
      category: 'base',
      zone: 'core'
    },
  },

  // Mid Layers (Core)
  mid: {
    'vest-top': {
      clo: 0.13,
      name: 'Vest-top',
      file: 'base/vest.png',
      category: 'mid',
      zone: 'core'
    },
    'light-cardigan': {
      clo: 0.2,
      name: 'Light cardigan',
      file: 'mid/cardigan.png',
      category: 'mid',
      zone: 'core'
    },
    'cardigan': {
      clo: 0.25,
      name: 'Cardigan',
      file: 'mid/cardigan.png',
      category: 'mid',
      zone: 'core'
    },
    'jumper': {
      clo: 0.28,
      name: 'Jumper',
      file: 'mid/jumper.png',
      category: 'mid',
      zone: 'core'
    },
    'turtleneck': {
      clo: 0.29,
      name: 'Turtleneck',
      file: 'mid/turtleneck.png',
      category: 'mid',
      zone: 'core'
    },
    'hoodie': {
      clo: 0.34,
      name: 'Hoodie',
      file: 'mid/hoodie.png',
      category: 'mid',
      zone: 'core'
    },
    'fleece': {
      clo: 0.37,
      name: 'Fleece',
      file: 'mid/fleece.png',
      category: 'mid',
      zone: 'core'
    },
    'thick-jumper': {
      clo: 0.4,
      name: 'Thick jumper',
      file: 'mid/jumper.png',
      category: 'mid',
      zone: 'core'
    },
    'thick-shirt': {
      clo: 0.35,
      name: 'Thick shirt',
      file: 'mid/thick-shirt.svg',
      category: 'mid',
      zone: 'core'
    }
  },

  // Outer Layers (Core)
  outer: {
    'light-jacket': {
      clo: 0.27,
      name: 'Light jacket',
      file: 'outer/light-jacket.png',
      category: 'outer',
      zone: 'core'
    },
    'coat': {
      clo: 0.5,
      name: 'Coat',
      file: 'outer/coat.png',
      category: 'outer',
      zone: 'core'
    },
    'padded-coat': {
      clo: 0.62,
      name: 'Padded coat',
      file: 'outer/coat.png',
      category: 'outer',
      zone: 'core'
    },
    'winter-coat': {
      clo: 0.85,
      name: 'Winter coat',
      file: 'outer/winter-coat.png',
      category: 'outer',
      zone: 'core'
    }
  },

  // Accessories - Head
  head: {
    'hat': {
      clo: 0.05,
      name: 'Hat',
      file: 'accessories/hat.png',
      category: 'accessory',
      zone: 'head'
    },
    'warm-hat': {
      clo: 0.08,
      name: 'Warm hat',
      file: 'accessories/warm-hat.png',
      category: 'accessory',
      zone: 'head'
    },
    'balaclava': {
      clo: 0.10,
      name: 'Balaclava',
      file: 'accessories/balaclava.png',
      category: 'accessory',
      zone: 'head'
    }
  },

  // Accessories - Hands
  hands: {
    'gloves': {
      clo: 0.05,
      name: 'Gloves',
      file: 'accessories/gloves.png',
      category: 'accessory',
      zone: 'hands'
    },
    'insulated-gloves': {
      clo: 0.10,
      name: 'Insulated gloves',
      file: 'accessories/insulated-gloves.png',
      category: 'accessory',
      zone: 'hands'
    },
    'mittens': {
      clo: 0.15,
      name: 'Mittens',
      file: 'accessories/mittens.png',
      category: 'accessory',
      zone: 'hands'
    }
  },

  // Accessories - Neck
  neck: {
    'scarf': {
      clo: 0.05,
      name: 'Scarf',
      file: 'accessories/scarf.png',
      category: 'accessory',
      zone: 'neck'
    },
    'thick-scarf': {
      clo: 0.08,
      name: 'Thick scarf',
      file: 'accessories/thick-scarf.png',
      category: 'accessory',
      zone: 'neck'
    }
  },

  // Accessories - Feet
  feet: {
    'thick-socks': {
      clo: 0.04,
      name: 'Thick socks',
      file: 'accessories/thick-socks.png',
      category: 'accessory',
      zone: 'feet'
    },
    'thermal-socks': {
      clo: 0.06,
      name: 'Thermal socks',
      file: 'accessories/thermal-socks.png',
      category: 'accessory',
      zone: 'feet'
    }
  }
};

// Temperature-based CLO requirements (medical guidelines)
export const TEMP_REQUIREMENTS = {
  // temp >= 15°C
  15: {
    core: { min: 0.2, max: 0.4, optimal: 0.3 },
    head: { min: 0.0, max: 0.0, optimal: 0.0 },
    hands: { min: 0.0, max: 0.0, optimal: 0.0 },
    neck: { min: 0.0, max: 0.0, optimal: 0.0 },
    feet: { min: 0.0, max: 0.0, optimal: 0.0 },
    riskLevel: 'low',
    alert: 'green'
  },
  // 10-15°C
  10: {
    core: { min: 0.3, max: 0.7, optimal: 0.5 },
    head: { min: 0.0, max: 0.05, optimal: 0.0 },
    hands: { min: 0.0, max: 0.0, optimal: 0.0 },
    neck: { min: 0.0, max: 0.05, optimal: 0.0 },
    feet: { min: 0.0, max: 0.0, optimal: 0.0 },
    riskLevel: 'low-moderate',
    alert: 'green'
  },
  // 7-10°C
  7: {
    core: { min: 0.6, max: 0.9, optimal: 0.85 },
    head: { min: 0.0, max: 0.05, optimal: 0.05 },
    hands: { min: 0.0, max: 0.05, optimal: 0.0 },
    neck: { min: 0.0, max: 0.05, optimal: 0.05 },
    feet: { min: 0.0, max: 0.04, optimal: 0.0 },
    riskLevel: 'low',
    alert: 'green'
  },
  // 5-7°C (UKHSA 6°C threshold)
  5: {
    core: { min: 0.8, max: 1.0, optimal: 0.9 },
    head: { min: 0.05, max: 0.08, optimal: 0.05 },
    hands: { min: 0.05, max: 0.10, optimal: 0.05 },
    neck: { min: 0.05, max: 0.08, optimal: 0.05 },
    feet: { min: 0.0, max: 0.04, optimal: 0.0 },
    riskLevel: 'moderate',
    alert: 'yellow'
  },
  // 2-5°C
  2: {
    core: { min: 1.1, max: 1.4, optimal: 1.25 },
    head: { min: 0.05, max: 0.08, optimal: 0.08 },
    hands: { min: 0.05, max: 0.10, optimal: 0.10 },
    neck: { min: 0.00, max: 0.08, optimal: 0.08 },
    feet: { min: 0.00, max: 0.06, optimal: 0.04 },
    riskLevel: 'moderate',
    alert: 'yellow'
  },
  // 0-2°C (Freezing point)
  0: {
    core: { min: 1.2, max: 1.55, optimal: 1.4 },
    head: { min: 0.05, max: 0.10, optimal: 0.08 },
    hands: { min: 0.05, max: 0.15, optimal: 0.10 },
    neck: { min: 0.05, max: 0.08, optimal: 0.08 },
    feet: { min: 0.04, max: 0.06, optimal: 0.06 },
    riskLevel: 'moderate',
    alert: 'yellow',
    maxExposure: 45
  },
  // <0°C (Below freezing)
  '-5': {
    core: { min: 1.5, max: 1.9, optimal: 1.7 },
    head: { min: 0.08, max: 0.10, optimal: 0.10 },
    hands: { min: 0.10, max: 0.15, optimal: 0.15 },
    neck: { min: 0.05, max: 0.08, optimal: 0.08 },
    feet: { min: 0.04, max: 0.06, optimal: 0.06 },
    riskLevel: 'high',
    alert: 'amber',
    maxExposure: 20,
    warning: 'Severe cold. Minimize outdoor time. High risk of frostbite.'
  },
  // -10°C and below (Extreme cold - minimum supported temperature)
  '-10': {
    core: { min: 1.6, max: 2.0, optimal: 1.8 },
    head: { min: 0.10, max: 0.10, optimal: 0.10 },
    hands: { min: 0.15, max: 0.15, optimal: 0.15 },
    neck: { min: 0.08, max: 0.08, optimal: 0.08 },
    feet: { min: 0.06, max: 0.06, optimal: 0.06 },
    riskLevel: 'severe',
    alert: 'red',
    maxExposure: 10,
    warning: 'Extreme cold. Get inside quick as you can! Frostbite risk within minutes.'
  }
};

// Age/Gender CLO adjustments (medical guidelines)
export const ADJUSTMENTS = {
  gender: {
    female: { core: 0.15 },  // Women feel cold ~3°C warmer
    male: { core: 0.0 }
  },
  age: {
    infant: { core: 0.25 },        // 0-2: Heat loss 4x faster
    child: { core: 0.10 },          // 3-12
    teen: { core: 0.05 },           // 13-17
    adult: { core: 0.0 },           // 18-64
    elderly: { core: 0.15 },        // 65-80: Reduced thermoregulation, thinner fat layer
    'very-elderly': { core: 0.30 }  // 80+: Further metabolic decline, reduced vasoconstriction
  }
};

// Practicality scores for sorting combinations
export const PRACTICALITY_WEIGHTS = {
  fewerItems: 2.0,          // Prefer fewer items
  commonItems: 1.5,         // Prefer common items (t-shirt, jumper)
  properLayering: 3.0,      // Base < Mid < Outer
  avoidRedundancy: 2.5      // Don't mix similar items
};

// Common item frequency (likelihood of items being in people's homes)
export const ITEM_FREQUENCY = {
  // More common = higher score (t-shirt prioritized as most common base layer)
  't-shirt': 1.3, 
  'vest': 1.0,             // Very common household item - boosted
  'long-sleeve-top': 0.9,      // Common household item
  'jumper': 1.2,               // Very common household item
  'coat': 0.8,
  'vest-top': 0.6,
  'cardigan': 0.5,
  'hoodie': 0.9,               // Common household item - boosted slightly
  'thermal-top': 0.5,
  'fleece': 1.0,
  'thick-jumper': 0.9,
  'thick-shirt': 0.8,
  'turtleneck': 0.5,
  'light-jacket': 0.7,
  'winter-coat': 0.6,
  'heavy-winter-coat': 0.4,
  'hat': 0.8,
  'warm-hat': 0.7,
  'balaclava': 0.3,
  'gloves': 0.8,
  'insulated-gloves': 0.6,
  'mittens': 0.5,
  'scarf': 0.8,
  'thick-scarf': 0.6,
  'thick-socks': 0.6,
  'thermal-socks': 0.5
};
