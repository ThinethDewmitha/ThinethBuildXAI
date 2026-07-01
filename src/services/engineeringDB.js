/**
 * BuildX AI – Engineering Rules Database
 * Local database of engineering standards, material properties, and cost rates.
 * References: IS 456:2000, ACI 318, IS 1893, SP-16, SP-34, general civil engineering standards.
 */

// ─── Soil Bearing Capacity (kN/m²) per IS 1904 ──────────────────────────────
export const SOIL_TYPES = {
    hard_rock: { name: 'Hard Rock', bearing: 3300, description: 'Granite, basalt, hard trap', category: 'excellent' },
    soft_rock: { name: 'Soft Rock', bearing: 1650, description: 'Laterite, sandstone, limestone', category: 'very_good' },
    gravel_sand: { name: 'Gravel & Sand', bearing: 440, description: 'Well-graded gravel-sand mixture', category: 'good' },
    coarse_sand: { name: 'Coarse Sand', bearing: 300, description: 'Coarse sand, compact', category: 'good' },
    medium_sand: { name: 'Medium Sand', bearing: 250, description: 'Medium sand, moderately compact', category: 'medium' },
    fine_sand: { name: 'Fine Sand', bearing: 150, description: 'Fine sand, loose to medium', category: 'fair' },
    stiff_clay: { name: 'Stiff Clay', bearing: 300, description: 'Stiff clay, low plasticity', category: 'good' },
    medium_clay: { name: 'Medium Clay', bearing: 150, description: 'Medium clay', category: 'medium' },
    soft_clay: { name: 'Soft Clay', bearing: 75, description: 'Soft clay or silt, high plasticity', category: 'poor' },
    filled_soil: { name: 'Filled/Made Ground', bearing: 50, description: 'Filled-up or reclaimed soil', category: 'very_poor' },
    black_cotton: { name: 'Black Cotton Soil', bearing: 80, description: 'Expansive black cotton soil', category: 'poor' },
};

// ─── Concrete Mix Ratios per IS 10262 ────────────────────────────────────────
export const CONCRETE_GRADES = {
    M10: { grade: 'M10', ratio: '1:3:6', strength: 10, use: 'PCC, leveling, non-structural', waterCement: 0.6 },
    M15: { grade: 'M15', ratio: '1:2:4', strength: 15, use: 'Light residential, pathways', waterCement: 0.55 },
    M20: { grade: 'M20', ratio: '1:1.5:3', strength: 20, use: 'Standard residential', waterCement: 0.50 },
    M25: { grade: 'M25', ratio: '1:1:2', strength: 25, use: 'Multi-story, commercial', waterCement: 0.45 },
    M30: { grade: 'M30', ratio: '1:0.75:1.5', strength: 30, use: 'Heavy structures, bridges', waterCement: 0.40 },
    M35: { grade: 'M35', ratio: 'Design Mix', strength: 35, use: 'Pre-stressed concrete', waterCement: 0.38 },
    M40: { grade: 'M40', ratio: 'Design Mix', strength: 40, use: 'High-rise, dams', waterCement: 0.35 },
};

// ─── Reinforcement Steel per IS 1786 ─────────────────────────────────────────
export const STEEL_GRADES = {
    Fe415: { grade: 'Fe 415', yieldStrength: 415, tensileStrength: 485, elongation: '14.5%', use: 'General RCC construction' },
    Fe500: { grade: 'Fe 500', yieldStrength: 500, tensileStrength: 545, elongation: '12%', use: 'Multi-story buildings, bridges' },
    Fe550: { grade: 'Fe 550', yieldStrength: 550, tensileStrength: 585, elongation: '10%', use: 'High-rise, heavy load structures' },
};

// ─── Steel Reinforcement Percentages per IS 456 ─────────────────────────────
export const STEEL_PERCENTAGES = {
    slab: { min: 0.12, max: 2.0, typical: 0.5, note: 'Minimum 0.12% for Fe 500 (IS 456 Cl 26.5.2.1)' },
    beam: { min: 0.2, max: 2.5, typical: 1.0, note: 'Balanced section beam reinforcement' },
    column: { min: 0.8, max: 6.0, typical: 2.0, note: 'IS 456 Cl 26.5.3.1' },
    foundation: { min: 0.12, max: 1.5, typical: 0.5, note: 'Foundation footing reinforcement' },
    wall: { min: 0.4, max: 1.5, typical: 0.5, note: 'Minimum for load-bearing walls' },
};

// ─── Rebar Standard Sizes (mm) ──────────────────────────────────────────────
export const REBAR_SIZES = [6, 8, 10, 12, 16, 20, 25, 32];

export const REBAR_WEIGHT_PER_METER = {
    6: 0.222, 8: 0.395, 10: 0.617, 12: 0.888,
    16: 1.579, 20: 2.466, 25: 3.854, 32: 6.313,
};

// ─── Foundation Rules per IS 1080 ────────────────────────────────────────────
export const FOUNDATION_RULES = {
    minimum_depth: 0.9, // meters (IS 1080)
    depth_below_ground_water: 0.3, // meters below lowest anticipated water table
    safety_factor: 2.5, // Factor of Safety for shallow foundations (IS 6403)
    depth_width_ratio: {
        strip: { minDepth: 0.9, widthMultiplier: 2.5 },
        isolated: { minDepth: 0.75, widthMultiplier: 1.5 },
        raft: { minThickness: 0.3, thicknessPerFloor: 0.1 },
        pile: { minLength: 3.0, maxLength: 30.0 },
    },
    cover: {
        foundation_cast_against_ground: 75, // mm (IS 456 Table 16)
        foundation_with_pcc: 50, // mm
        column: 40, // mm
        beam: 25, // mm
        slab: 20, // mm
    },
};

// ─── Material Unit Rates (INR – Indian Rupees, 2026 market estimate) ────────
export const MATERIAL_RATES = {
    cement: { unit: 'bag (50kg)', rate: 420, currency: 'INR', note: 'OPC 43/53 grade' },
    sand_river: { unit: 'cft', rate: 75, currency: 'INR', note: 'River sand / M-Sand' },
    sand_msand: { unit: 'cft', rate: 55, currency: 'INR', note: 'Manufactured sand' },
    aggregate_20mm: { unit: 'cft', rate: 62, currency: 'INR', note: '20mm coarse aggregate' },
    aggregate_40mm: { unit: 'cft', rate: 55, currency: 'INR', note: '40mm coarse aggregate' },
    steel_fe500: { unit: 'kg', rate: 72, currency: 'INR', note: 'TMT Fe500 rebar' },
    brick_first_class: { unit: 'piece', rate: 12, currency: 'INR', note: 'First class burnt clay brick' },
    concrete_block_6inch: { unit: 'piece', rate: 48, currency: 'INR', note: '6-inch (150mm) solid block' },
    concrete_block_8inch: { unit: 'piece', rate: 58, currency: 'INR', note: '8-inch (200mm) solid block' },
    stone_rubble: { unit: 'cft', rate: 40, currency: 'INR', note: 'Rubble stone masonry' },
    water: { unit: 'kL', rate: 50, currency: 'INR', note: 'Water for construction' },
    plywood_form: { unit: 'sqft', rate: 85, currency: 'INR', note: 'Formwork plywood 12mm' },
};

// ─── Labor Rates (INR per day, 2026 estimate) ───────────────────────────────
export const LABOR_RATES = {
    mason: { rate: 1000, currency: 'INR', note: 'Skilled mason' },
    helper: { rate: 600, currency: 'INR', note: 'Unskilled helper/laborer' },
    carpenter: { rate: 950, currency: 'INR', note: 'Formwork carpenter' },
    bar_bender: { rate: 900, currency: 'INR', note: 'Steel bar bender/fixer' },
    plumber: { rate: 1000, currency: 'INR', note: 'Plumber' },
    electrician: { rate: 1100, currency: 'INR', note: 'Licensed electrician' },
    painter: { rate: 850, currency: 'INR', note: 'Painter' },
};

// ─── Electrical Estimation Rules ────────────────────────────────────────────
export const ELECTRICAL_RULES = {
    light_points_per_sqm: 0.15, // 1 light per ~6.5 sqm
    fan_points_per_sqm: 0.08,  // 1 fan per ~12.5 sqm
    power_points_per_sqm: 0.1, // 1 power socket per ~10 sqm
    ac_points_per_room: 1,
    wire_gauge: {
        lighting: '1.5 sq mm',
        power: '2.5 sq mm',
        ac: '4 sq mm',
        main_line: '6 sq mm',
    },
    earthing: {
        rods_per_building: 2,
        rod_length: '3m copper rod',
        resistance_max: '5 ohms',
    },
};

// ─── Plumbing Estimation Rules ──────────────────────────────────────────────
export const PLUMBING_RULES = {
    water_supply_pipe: '25mm CPVC for main, 20mm for branches',
    drainage_pipe: '100mm PVC for soil line, 75mm for waste',
    water_tank_liters_per_person: 135,
    bathroom_per_100sqm: 1,
    kitchen_per_unit: 1,
};

// ─── Safety Factors per IS Codes ────────────────────────────────────────────
export const SAFETY_FACTORS = {
    concrete: 1.5,    // Partial safety factor for concrete (IS 456 Cl 36.4.2)
    steel: 1.15,      // Partial safety factor for steel (IS 456 Cl 36.4.2)
    dead_load: 1.5,   // Load factor for dead load
    live_load: 1.5,   // Load factor for live load
    wind_load: 1.5,   // Load factor for wind load
    seismic: 1.5,     // Load factor for seismic
};

// ─── Live Load Values per IS 875 Part 2 ─────────────────────────────────────
export const LIVE_LOADS = {
    residential: { load: 2.0, unit: 'kN/m²', note: 'Residential floor' },
    office: { load: 2.5, unit: 'kN/m²', note: 'Office space' },
    shop: { load: 4.0, unit: 'kN/m²', note: 'Retail/shop floor' },
    garage: { load: 5.0, unit: 'kN/m²', note: 'Car parking area' },
    roof_accessible: { load: 1.5, unit: 'kN/m²', note: 'Accessible roof terrace' },
    roof_inaccessible: { load: 0.75, unit: 'kN/m²', note: 'Non-accessible roof' },
    staircase: { load: 3.0, unit: 'kN/m²', note: 'Staircase and corridors' },
    storage: { load: 5.0, unit: 'kN/m²', note: 'Storage rooms' },
};

// ─── Validation Functions ───────────────────────────────────────────────────

/**
 * Validate AI-generated foundation depth against engineering rules
 */
export function validateFoundationDepth(aiDepth, floors, soilType = 'medium_sand') {
    const soil = SOIL_TYPES[soilType] || SOIL_TYPES.medium_sand;
    const minDepth = FOUNDATION_RULES.minimum_depth;
    const recommendedDepth = minDepth + (floors - 1) * 0.3;
    const issues = [];

    if (aiDepth < minDepth) {
        issues.push(`Foundation depth ${aiDepth}m is below IS 1080 minimum of ${minDepth}m`);
    }
    if (soil.category === 'poor' || soil.category === 'very_poor') {
        if (aiDepth < 1.5) issues.push(`Weak soil (${soil.name}) requires deeper foundation, minimum 1.5m recommended`);
    }
    return { valid: issues.length === 0, issues, recommended: Math.max(recommendedDepth, minDepth) };
}

/**
 * Calculate detailed cost estimate using market rates
 */
export function calculateDetailedCost(materials) {
    const items = [];
    let total = 0;

    if (materials.cementBags) {
        const cost = materials.cementBags * MATERIAL_RATES.cement.rate;
        items.push({ item: 'Cement (OPC 53)', quantity: materials.cementBags, unit: 'bags', unitRate: MATERIAL_RATES.cement.rate, total: cost });
        total += cost;
    }
    if (materials.sandCft) {
        const cost = materials.sandCft * MATERIAL_RATES.sand_river.rate;
        items.push({ item: 'River Sand', quantity: Math.round(materials.sandCft), unit: 'cft', unitRate: MATERIAL_RATES.sand_river.rate, total: cost });
        total += cost;
    }
    if (materials.aggregateCft) {
        const cost = materials.aggregateCft * MATERIAL_RATES.aggregate_20mm.rate;
        items.push({ item: 'Aggregate (20mm)', quantity: Math.round(materials.aggregateCft), unit: 'cft', unitRate: MATERIAL_RATES.aggregate_20mm.rate, total: cost });
        total += cost;
    }
    if (materials.steelKg) {
        const cost = materials.steelKg * MATERIAL_RATES.steel_fe500.rate;
        items.push({ item: 'Steel TMT Fe500', quantity: Math.round(materials.steelKg), unit: 'kg', unitRate: MATERIAL_RATES.steel_fe500.rate, total: cost });
        total += cost;
    }
    if (materials.bricks) {
        const cost = materials.bricks * MATERIAL_RATES.brick_first_class.rate;
        items.push({ item: 'Bricks (First Class)', quantity: materials.bricks, unit: 'pcs', unitRate: MATERIAL_RATES.brick_first_class.rate, total: cost });
        total += cost;
    }
    if (materials.blocks) {
        const cost = materials.blocks * MATERIAL_RATES.concrete_block_8inch.rate;
        items.push({ item: 'Concrete Blocks (8")', quantity: materials.blocks, unit: 'pcs', unitRate: MATERIAL_RATES.concrete_block_8inch.rate, total: cost });
        total += cost;
    }
    if (materials.waterLiters) {
        const cost = (materials.waterLiters / 1000) * MATERIAL_RATES.water.rate;
        items.push({ item: 'Water', quantity: Math.round(materials.waterLiters / 1000 * 100) / 100, unit: 'kL', unitRate: MATERIAL_RATES.water.rate, total: Math.round(cost) });
        total += cost;
    }

    // Add estimated labor cost (typically 30-40% of material cost)
    const laborCost = Math.round(total * 0.35);
    items.push({ item: 'Labor (estimated 35%)', quantity: 1, unit: 'lump sum', unitRate: laborCost, total: laborCost });
    total += laborCost;

    // Add miscellaneous (5%)
    const misc = Math.round(total * 0.05);
    items.push({ item: 'Miscellaneous (plumbing, electrical, finishes) ~5%', quantity: 1, unit: 'lump sum', unitRate: misc, total: misc });
    total += misc;

    return { items, total: Math.round(total), currency: 'INR' };
}

/**
 * Format cost in Indian currency format (lakhs/crores)
 */
export function formatIndianCurrency(amount) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Get recommended concrete grade based on building parameters
 */
export function recommendConcreteGrade(floors, buildingType = 'residential') {
    if (buildingType === 'commercial' || floors >= 5) return 'M30';
    if (floors >= 3) return 'M25';
    if (floors >= 2) return 'M20';
    return 'M20';
}

/**
 * Cross-validate AI output against engineering database
 */
export function crossValidateAnalysis(aiAnalysis, specs) {
    const warnings = [];
    const corrections = [];

    // Validate concrete grade
    const recommendedGrade = recommendConcreteGrade(specs.floors);
    if (aiAnalysis.concreteMixDesign?.targetGrade) {
        const aiGrade = aiAnalysis.concreteMixDesign.targetGrade;
        const aiStrength = CONCRETE_GRADES[aiGrade]?.strength || 0;
        const recStrength = CONCRETE_GRADES[recommendedGrade]?.strength || 20;
        if (aiStrength < recStrength) {
            warnings.push({
                severity: 'warning',
                message: `AI recommended ${aiGrade} (${aiStrength}MPa) but for ${specs.floors}-floor building, ${recommendedGrade} (${recStrength}MPa) is standard per IS 456.`,
            });
        }
    }

    // Check foundation depth
    if (aiAnalysis.foundationEngineering?.depth) {
        const depthStr = aiAnalysis.foundationEngineering.depth;
        const depthMatch = depthStr.match(/([\d.]+)\s*m/);
        if (depthMatch) {
            const depth = parseFloat(depthMatch[1]);
            const validation = validateFoundationDepth(depth, specs.floors);
            if (!validation.valid) {
                validation.issues.forEach(issue => {
                    warnings.push({ severity: 'critical', message: issue });
                });
            }
        }
    }

    return { warnings, corrections };
}
