/**
 * BuildX AI – Engineering Calculator
 * Standard civil engineering formulas for foundation, concrete mix, and material estimation.
 * References: IS 456:2000, ACI 318, general civil engineering standards.
 */

// ─── Standard Concrete Mix Ratios ───────────────────────────────────────────
const CONCRETE_MIXES = {
  M15: { grade: 'M15', ratio: '1:2:4', cement: 1, sand: 2, aggregate: 4, strength: '15 MPa', use: 'Light residential, pathways' },
  M20: { grade: 'M20', ratio: '1:1.5:3', cement: 1, sand: 1.5, aggregate: 3, strength: '20 MPa', use: 'Standard residential buildings' },
  M25: { grade: 'M25', ratio: '1:1:2', cement: 1, sand: 1, aggregate: 2, strength: '25 MPa', use: 'Multi-story, commercial buildings' },
  M30: { grade: 'M30', ratio: '1:0.75:1.5', cement: 1, sand: 0.75, aggregate: 1.5, strength: '30 MPa', use: 'Heavy structures, bridges' },
};

// ─── Foundation Type Recommendations ────────────────────────────────────────
const FOUNDATION_TYPES = {
  strip: {
    name: 'Strip Foundation',
    description: 'Continuous strip of concrete under load-bearing walls. Most common for residential buildings.',
    suitableFor: 'Stable soil, 1-3 floor buildings',
    minDepth: 0.9, // meters
  },
  raft: {
    name: 'Raft Foundation',
    description: 'Large concrete slab covering the entire building footprint. Distributes load over a wide area.',
    suitableFor: 'Weak/soft soil, heavy buildings, high water table',
    minDepth: 0.3,
  },
  isolated: {
    name: 'Isolated Footing',
    description: 'Individual pad foundations under each column. Economical for well-spaced columns.',
    suitableFor: 'Good bearing soil, framed structures',
    minDepth: 0.75,
  },
  pile: {
    name: 'Pile Foundation',
    description: 'Deep foundations driven into the ground to reach strong soil layers.',
    suitableFor: 'Very weak surface soil, marshy areas, tall buildings',
    minDepth: 3.0,
  },
};

/**
 * Convert between imperial (ft) and metric (m)
 */
export function convertUnits(value, from, to) {
  if (from === to) return value;
  if (from === 'ft' && to === 'm') return value * 0.3048;
  if (from === 'm' && to === 'ft') return value / 0.3048;
  return value;
}

/**
 * Recommend foundation type based on building parameters
 */
export function recommendFoundation(floors, wallType, soilType = 'medium') {
  if (floors >= 4 || soilType === 'very_weak') {
    return FOUNDATION_TYPES.pile;
  }
  if (soilType === 'weak' || soilType === 'soft' || floors >= 3) {
    return FOUNDATION_TYPES.raft;
  }
  if (wallType === 'stone' || wallType === 'concrete_block') {
    return FOUNDATION_TYPES.strip;
  }
  return FOUNDATION_TYPES.strip;
}

/**
 * Calculate foundation dimensions
 * @param {number} length - Building length in meters
 * @param {number} width - Building width in meters
 * @param {number} floors - Number of floors
 * @param {string} wallType - Type of wall (brick, concrete_block, stone)
 * @returns {Object} Foundation specs
 */
export function calculateFoundation(length, width, floors, wallType = 'brick') {
  // Foundation depth: minimum 1m + 0.3m per additional floor
  const depthBase = 1.0;
  const depthPerFloor = 0.3;
  const foundationDepth = depthBase + (floors - 1) * depthPerFloor;

  // Foundation width: typically 2-3x wall width depending on load
  const wallWidths = { brick: 0.23, concrete_block: 0.20, stone: 0.45 };
  const wallWidth = wallWidths[wallType] || 0.23;
  const foundationWidth = Math.max(wallWidth * 2.5, 0.6); // minimum 600mm

  // Perimeter for strip foundation
  const perimeter = 2 * (length + width);

  // Volume of concrete for strip foundation
  const stripVolume = perimeter * foundationWidth * foundationDepth;

  // Raft foundation volume (full slab)
  const raftThickness = 0.3 + (floors - 1) * 0.1; // 300mm + 100mm per floor
  const raftVolume = length * width * raftThickness;

  // Area
  const buildingArea = length * width;
  const totalBuiltUpArea = buildingArea * floors;

  return {
    depth: Math.round(foundationDepth * 100) / 100,
    width: Math.round(foundationWidth * 100) / 100,
    perimeter: Math.round(perimeter * 100) / 100,
    stripVolume: Math.round(stripVolume * 100) / 100,
    raftThickness: Math.round(raftThickness * 100) / 100,
    raftVolume: Math.round(raftVolume * 100) / 100,
    buildingArea: Math.round(buildingArea * 100) / 100,
    totalBuiltUpArea: Math.round(totalBuiltUpArea * 100) / 100,
    wallWidth,
    formulas: {
      depth: `Foundation Depth = ${depthBase}m (base) + ${floors - 1} × ${depthPerFloor}m = ${foundationDepth}m`,
      width: `Foundation Width = Wall Width (${wallWidth}m) × 2.5 = ${foundationWidth.toFixed(2)}m (min 0.6m)`,
      perimeter: `Perimeter = 2 × (${length}m + ${width}m) = ${perimeter}m`,
      stripVolume: `Strip Volume = ${perimeter}m × ${foundationWidth.toFixed(2)}m × ${foundationDepth}m = ${stripVolume.toFixed(2)} m³`,
      raftVolume: `Raft Volume = ${length}m × ${width}m × ${raftThickness.toFixed(2)}m = ${raftVolume.toFixed(2)} m³`,
    },
  };
}

/**
 * Calculate concrete mix quantities for a given volume
 * @param {string} grade - Concrete grade (M15, M20, M25, M30)
 * @param {number} volumeM3 - Volume of concrete needed in cubic meters
 * @returns {Object} Material quantities
 */
export function calculateConcreteMix(grade = 'M20', volumeM3) {
  const mix = CONCRETE_MIXES[grade] || CONCRETE_MIXES.M20;

  // Dry volume = Wet volume × 1.54 (52-54% bulking factor)
  const dryVolume = volumeM3 * 1.54;

  // Total parts
  const totalParts = mix.cement + mix.sand + mix.aggregate;

  // Cement in m³, then convert to bags (1 bag = 0.0347 m³ = 50kg)
  const cementVolume = (mix.cement / totalParts) * dryVolume;
  const cementBags = Math.ceil(cementVolume / 0.0347);
  const cementKg = cementBags * 50;

  // Sand in m³, convert to cubic feet (1m³ = 35.3147 cft)
  const sandVolume = (mix.sand / totalParts) * dryVolume;
  const sandCft = sandVolume * 35.3147;

  // Aggregate in m³, convert to cubic feet
  const aggregateVolume = (mix.aggregate / totalParts) * dryVolume;
  const aggregateCft = aggregateVolume * 35.3147;

  // Water: 0.45-0.5 water-cement ratio (liters)
  const waterLiters = cementKg * 0.45;

  return {
    grade: mix.grade,
    ratio: mix.ratio,
    strength: mix.strength,
    use: mix.use,
    wetVolume: Math.round(volumeM3 * 100) / 100,
    dryVolume: Math.round(dryVolume * 100) / 100,
    cement: { bags: cementBags, kg: cementKg, volume: Math.round(cementVolume * 100) / 100 },
    sand: { cft: Math.round(sandCft * 100) / 100, volume: Math.round(sandVolume * 100) / 100 },
    aggregate: { cft: Math.round(aggregateCft * 100) / 100, volume: Math.round(aggregateVolume * 100) / 100 },
    water: { liters: Math.round(waterLiters) },
    formulas: {
      dryVolume: `Dry Volume = ${volumeM3} m³ × 1.54 = ${dryVolume.toFixed(2)} m³`,
      cement: `Cement = (${mix.cement}/${totalParts}) × ${dryVolume.toFixed(2)} = ${cementVolume.toFixed(3)} m³ = ${cementBags} bags (50kg each)`,
      sand: `Sand = (${mix.sand}/${totalParts}) × ${dryVolume.toFixed(2)} = ${sandVolume.toFixed(3)} m³ = ${sandCft.toFixed(1)} cft`,
      aggregate: `Aggregate = (${mix.aggregate}/${totalParts}) × ${dryVolume.toFixed(2)} = ${aggregateVolume.toFixed(3)} m³ = ${aggregateCft.toFixed(1)} cft`,
      water: `Water = ${cementKg} kg × 0.45 (w/c ratio) = ${waterLiters.toFixed(0)} liters`,
    },
  };
}

/**
 * Calculate steel reinforcement estimate
 * @param {number} concreteVolume - Volume of concrete in m³
 * @param {number} floors - Number of floors
 * @returns {Object} Steel estimate
 */
export function calculateSteel(concreteVolume, floors = 1) {
  // Steel percentage: 1% of concrete volume for residential (varies 0.8-2%)
  const steelPercentage = floors <= 2 ? 0.01 : 0.015;
  const steelVolumeM3 = concreteVolume * steelPercentage;

  // Steel density: 7850 kg/m³
  const steelKg = steelVolumeM3 * 7850;

  return {
    percentage: steelPercentage * 100,
    volumeM3: Math.round(steelVolumeM3 * 1000) / 1000,
    kg: Math.round(steelKg),
    tons: Math.round(steelKg / 1000 * 100) / 100,
    formula: `Steel = ${concreteVolume} m³ × ${steelPercentage * 100}% × 7850 kg/m³ = ${steelKg.toFixed(0)} kg`,
  };
}

/**
 * Calculate brick/block estimate for walls
 * @param {number} length - Building length in meters
 * @param {number} width - Building width in meters
 * @param {number} floorHeight - Height per floor in meters (default 3m)
 * @param {number} floors - Number of floors
 * @param {string} wallType - Type of wall material
 * @returns {Object} Brick/block estimate
 */
export function calculateWallMaterials(length, width, floors, floorHeight = 3.0, wallType = 'brick') {
  const perimeter = 2 * (length + width);
  const totalWallArea = perimeter * floorHeight * floors;

  // Deduct ~15% for doors and windows
  const netWallArea = totalWallArea * 0.85;

  const specs = {
    brick: { name: 'Bricks', perSqm: 500, mortarPerSqm: 0.03 }, // 500 bricks per m² of 230mm thick wall
    concrete_block: { name: 'Concrete Blocks', perSqm: 12.5, mortarPerSqm: 0.012 }, // 400x200mm blocks
    stone: { name: 'Stone Blocks', perSqm: 8, mortarPerSqm: 0.04 },
  };

  const spec = specs[wallType] || specs.brick;
  const units = Math.ceil(netWallArea * spec.perSqm);
  const mortarVolume = netWallArea * spec.mortarPerSqm;

  return {
    wallType: spec.name,
    totalWallArea: Math.round(totalWallArea * 100) / 100,
    netWallArea: Math.round(netWallArea * 100) / 100,
    units,
    mortarVolume: Math.round(mortarVolume * 100) / 100,
    formula: `${spec.name} = ${netWallArea.toFixed(1)} m² × ${spec.perSqm}/m² = ${units} units`,
  };
}

/**
 * Get all concrete mix data for display
 */
export function getAllMixGrades() {
  return CONCRETE_MIXES;
}

/**
 * Get all foundation types for display
 */
export function getAllFoundationTypes() {
  return FOUNDATION_TYPES;
}

/**
 * Generate a comprehensive estimate combining all calculations
 */
export function generateFullEstimate(lengthM, widthM, floors, wallType = 'brick', concreteGrade = 'M20') {
  const foundation = calculateFoundation(lengthM, widthM, floors, wallType);
  const foundationType = recommendFoundation(floors, wallType);
  const concreteVolume = foundationType.name === 'Raft Foundation' ? foundation.raftVolume : foundation.stripVolume;
  const concreteMix = calculateConcreteMix(concreteGrade, concreteVolume);
  const steel = calculateSteel(concreteVolume, floors);
  const walls = calculateWallMaterials(lengthM, widthM, floors, 3.0, wallType);

  return {
    foundation,
    foundationType,
    concreteMix,
    steel,
    walls,
    summary: {
      buildingArea: foundation.buildingArea,
      totalBuiltUpArea: foundation.totalBuiltUpArea,
      concreteVolume,
      cementBags: concreteMix.cement.bags,
      sandCft: concreteMix.sand.cft,
      aggregateCft: concreteMix.aggregate.cft,
      waterLiters: concreteMix.water.liters,
      steelKg: steel.kg,
      wallUnits: walls.units,
    },
  };
}
