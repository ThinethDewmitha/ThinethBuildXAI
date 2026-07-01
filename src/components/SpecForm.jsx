import React, { useState, useRef, useEffect } from 'react';

/**
 * Building type definitions with presets for each type
 */
const BUILDING_TYPES = [
    {
        id: 'residential_house',
        label: '🏠 Residential House',
        description: 'Standard home (1BHK, 2BHK, 3BHK, villa)',
        presets: [
            { label: 'Small 1BHK (20×25ft)', length: 20, width: 25, height: 10, floors: 1, wall: 'brick', thickness: 230, desc: 'Small single-bedroom house with hall and kitchen' },
            { label: '2BHK House (30×40ft)', length: 30, width: 40, height: 10, floors: 1, wall: 'brick', thickness: 230, desc: 'Two-bedroom house with living room, kitchen, and 2 bathrooms' },
            { label: '2-Floor 3BHK (30×40ft)', length: 30, width: 40, height: 20, floors: 2, wall: 'concrete_block', thickness: 200, desc: 'Two-floor three-bedroom house with balcony, 3 bathrooms, and covered parking' },
            { label: 'Large Villa (50×60ft)', length: 50, width: 60, height: 22, floors: 2, wall: 'brick', thickness: 230, desc: 'Spacious villa with 4 bedrooms, servant room, garage, garden area' },
        ],
    },
    {
        id: 'compound_wall',
        label: '🧱 Compound / Boundary Wall',
        description: 'Boundary wall, garden wall, compound fence',
        presets: [
            { label: 'Small Compound (40ft × 4ft)', length: 40, width: 0.75, height: 4, floors: 1, wall: 'brick', thickness: 230, desc: 'Boundary wall for small plot, 4 feet height with pillars every 10ft' },
            { label: 'Medium Compound (80ft × 5ft)', length: 80, width: 0.75, height: 5, floors: 1, wall: 'concrete_block', thickness: 200, desc: 'Compound wall for medium plot, 5 feet height' },
            { label: 'Tall Security Wall (100ft × 7ft)', length: 100, width: 1, height: 7, floors: 1, wall: 'concrete_block', thickness: 200, desc: 'Tall compound wall with reinforced pillars for security' },
        ],
    },
    {
        id: 'retaining_wall',
        label: '🏔️ Retaining Wall',
        description: 'Wall to hold back earth or soil',
        presets: [
            { label: 'Garden Retaining (20ft × 4ft)', length: 20, width: 1.5, height: 4, floors: 1, wall: 'stone', thickness: 450, desc: 'Small garden retaining wall for slope management' },
            { label: 'Road-side Retaining (50ft × 8ft)', length: 50, width: 3, height: 8, floors: 1, wall: 'concrete_block', thickness: 300, desc: 'Retaining wall for road-side earth retention' },
        ],
    },
    {
        id: 'water_tank',
        label: '💧 Water Tank / Reservoir',
        description: 'Underground, overhead or ground-level tank',
        presets: [
            { label: 'Small Tank (8×8×6ft)', length: 8, width: 8, height: 6, floors: 1, wall: 'concrete_block', thickness: 200, desc: 'Underground water storage tank for residential use, 2500 liters capacity' },
            { label: 'Medium Tank (12×12×8ft)', length: 12, width: 12, height: 8, floors: 1, wall: 'concrete_block', thickness: 250, desc: 'Ground-level water tank for multi-family use, ~8000 liters' },
            { label: 'Large Overhead (10×10×6ft)', length: 10, width: 10, height: 6, floors: 1, wall: 'concrete_block', thickness: 200, desc: 'Overhead water tank on pillars, 5000 liters capacity' },
        ],
    },
    {
        id: 'commercial_building',
        label: '🏢 Commercial Building',
        description: 'Shop, office, showroom',
        presets: [
            { label: 'Small Shop (15×20ft)', length: 15, width: 20, height: 12, floors: 1, wall: 'concrete_block', thickness: 200, desc: 'Single-story shop/showroom with roller shutter' },
            { label: 'Office Building (40×50ft)', length: 40, width: 50, height: 30, floors: 3, wall: 'concrete_block', thickness: 200, desc: 'Three-floor office building with reception and parking' },
        ],
    },
    {
        id: 'warehouse',
        label: '🏭 Warehouse / Shed',
        description: 'Storage, industrial shed, factory',
        presets: [
            { label: 'Small Godown (30×40ft)', length: 30, width: 40, height: 15, floors: 1, wall: 'concrete_block', thickness: 200, desc: 'Single-story storage godown with loading area' },
            { label: 'Industrial Shed (60×80ft)', length: 60, width: 80, height: 20, floors: 1, wall: 'concrete_block', thickness: 200, desc: 'Large industrial shed with steel truss roof' },
        ],
    },
    {
        id: 'garage',
        label: '🚗 Garage / Parking',
        description: 'Car parking, covered shed',
        presets: [
            { label: 'Single Car (12×20ft)', length: 12, width: 20, height: 10, floors: 1, wall: 'brick', thickness: 115, desc: 'Single car garage with roller door' },
            { label: 'Double Car (20×20ft)', length: 20, width: 20, height: 10, floors: 1, wall: 'concrete_block', thickness: 150, desc: 'Double car garage with side entrance' },
        ],
    },
    {
        id: 'multi_story',
        label: '🏗️ Multi-Story (3+ Floors)',
        description: 'Apartment, multi-family building',
        presets: [
            { label: '3-Floor Apartment (40×50ft)', length: 40, width: 50, height: 30, floors: 3, wall: 'concrete_block', thickness: 200, desc: 'Three-floor apartment building with 6 units' },
            { label: '5-Floor Complex (50×60ft)', length: 50, width: 60, height: 50, floors: 5, wall: 'concrete_block', thickness: 200, desc: 'Five-floor residential complex with lift and parking' },
        ],
    },
    {
        id: 'boundary_fence',
        label: '🏗️ Fence / Pillar Structure',
        description: 'Pillar fence, gate pillars',
        presets: [
            { label: 'Front Gate Pillars (10ft × 8ft)', length: 10, width: 2, height: 8, floors: 1, wall: 'brick', thickness: 350, desc: 'Two entrance gate pillars with arch design' },
            { label: 'Pillar Fence (60ft × 5ft)', length: 60, width: 0.5, height: 5, floors: 1, wall: 'brick', thickness: 230, desc: 'Boundary fence with brick pillars and iron grills' },
        ],
    },
];

/**
 * Tooltip data for form fields
 */
const FIELD_TOOLTIPS = {
    length: "The longer side of your building's footprint. Measure from one end to the other. For walls, this is the total length of the wall.",
    width: "The shorter side of your building's footprint. For walls, this is the thickness. For tanks, this is one side of the tank.",
    totalHeight: "Total height from ground level to the top of the roof. For each floor, typically 9-10 feet (3 meters).",
    wallThickness: "How thick the walls will be. Standard brick wall = 230mm (9 inches). Half-brick wall = 115mm. Concrete block = 150-200mm.",
    floors: "Number of levels/stories. Ground floor = 1. Ground + First floor = 2.",
    wallType: "The material used to build the walls. Brick is most common for homes. Concrete blocks are faster to build. Stone is heaviest.",
    description: "Describe what you want to build in your own words. The more detail you give, the better the AI can help you.",
};

function Tooltip({ text }) {
    const [show, setShow] = useState(false);
    return (
        <span className="tooltip-trigger" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onClick={() => setShow(!show)}>
            ℹ️
            {show && <span className="tooltip-popup">{text}</span>}
        </span>
    );
}

export default function SpecForm({ onSubmit, onBack }) {
    const formRef = useRef(null);
    const [specs, setSpecs] = useState({
        length: '',
        width: '',
        totalHeight: '',
        wallThickness: '230', // mm
        floors: '1',
        wallType: 'brick',
        unit: 'ft',
        description: '',
        buildingType: 'residential_house',
    });

    const [calculatedArea, setCalculatedArea] = useState(0);
    const [errors, setErrors] = useState({});
    const [showPresets, setShowPresets] = useState(true);

    const selectedType = BUILDING_TYPES.find(t => t.id === specs.buildingType) || BUILDING_TYPES[0];

    useEffect(() => {
        if (specs.length && specs.width) {
            const area = parseFloat(specs.length) * parseFloat(specs.width);
            setCalculatedArea(area.toFixed(2));
        } else {
            setCalculatedArea(0);
        }
    }, [specs.length, specs.width]);

    const update = (field, value) => {
        setSpecs(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const applyPreset = (preset) => {
        setSpecs(prev => ({
            ...prev,
            length: String(preset.length),
            width: String(preset.width),
            totalHeight: String(preset.height),
            floors: String(preset.floors),
            wallType: preset.wall,
            wallThickness: String(preset.thickness),
            description: preset.desc,
        }));
        setShowPresets(false);
    };

    const validate = () => {
        const newErrors = {};
        if (!specs.length || parseFloat(specs.length) <= 0) newErrors.length = 'Enter a valid length';
        if (!specs.width || parseFloat(specs.width) <= 0) newErrors.width = 'Enter a valid width';
        if (!specs.totalHeight || parseFloat(specs.totalHeight) <= 0) newErrors.totalHeight = 'Enter building height';
        if (!specs.wallThickness || parseFloat(specs.wallThickness) <= 0) newErrors.wallThickness = 'Enter wall thickness';
        if (!specs.floors || parseInt(specs.floors) < 1) newErrors.floors = 'At least 1 floor';

        // Check description depth
        if (specs.description.length < 20) {
            newErrors.description = 'Please provide more details (at least 20 characters) about the building use or structure to help the AI be more accurate.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit({
                ...specs,
                length: parseFloat(specs.length),
                width: parseFloat(specs.width),
                totalHeight: parseFloat(specs.totalHeight),
                wallThickness: parseFloat(specs.wallThickness),
                floors: parseInt(specs.floors),
                area: calculatedArea
            });
        } else {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="spec-form animate-in" ref={formRef}>
            {/* Building Type Selector */}
            <div className="form-group">
                <label className="form-label">
                    What do you want to build? <Tooltip text="Select the type of structure. This helps the AI give specific engineering advice for your project type." />
                </label>
                <div className="building-type-grid">
                    {BUILDING_TYPES.map(type => (
                        <button
                            key={type.id}
                            className={`building-type-btn ${specs.buildingType === type.id ? 'active' : ''}`}
                            onClick={() => { update('buildingType', type.id); setShowPresets(true); }}
                        >
                            <span className="bt-label">{type.label}</span>
                            <span className="bt-desc">{type.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Common Presets */}
            {showPresets && selectedType.presets && (
                <div className="form-group">
                    <label className="form-label">⚡ Quick Start — Common Sizes</label>
                    <div className="presets-grid">
                        {selectedType.presets.map((preset, i) => (
                            <button
                                key={i}
                                className="preset-btn glass-card"
                                onClick={() => applyPreset(preset)}
                            >
                                <span className="preset-label">{preset.label}</span>
                                <span className="preset-desc">{preset.desc.substring(0, 50)}...</span>
                            </button>
                        ))}
                        <button className="preset-btn preset-custom" onClick={() => setShowPresets(false)}>
                            <span className="preset-label">✏️ Custom Size</span>
                            <span className="preset-desc">Enter your own dimensions</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Unit Toggle */}
            <div className="form-group">
                <label className="form-label">Measurement Unit</label>
                <div className="unit-toggle">
                    <button
                        className={`unit-btn ${specs.unit === 'ft' ? 'active' : ''}`}
                        onClick={() => update('unit', 'ft')}
                    >
                        Feet (ft)
                    </button>
                    <button
                        className={`unit-btn ${specs.unit === 'm' ? 'active' : ''}`}
                        onClick={() => update('unit', 'm')}
                    >
                        Meters (m)
                    </button>
                </div>
            </div>

            {/* Dimensions */}
            <div className="spec-row">
                <div className="form-group">
                    <label className="form-label">Length ({specs.unit}) <Tooltip text={FIELD_TOOLTIPS.length} /></label>
                    <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 30"
                        value={specs.length}
                        onChange={(e) => update('length', e.target.value)}
                    />
                    {errors.length && <span className="error-text">{errors.length}</span>}
                </div>
                <div className="form-group">
                    <label className="form-label">Width ({specs.unit}) <Tooltip text={FIELD_TOOLTIPS.width} /></label>
                    <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 20"
                        value={specs.width}
                        onChange={(e) => update('width', e.target.value)}
                    />
                    {errors.width && <span className="error-text">{errors.width}</span>}
                </div>
            </div>

            {/* Height & Area (ReadOnly) */}
            <div className="spec-row">
                <div className="form-group">
                    <label className="form-label">Total Height ({specs.unit}) <Tooltip text={FIELD_TOOLTIPS.totalHeight} /></label>
                    <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 10"
                        value={specs.totalHeight}
                        onChange={(e) => update('totalHeight', e.target.value)}
                    />
                    {errors.totalHeight && <span className="error-text">{errors.totalHeight}</span>}
                </div>
                <div className="form-group">
                    <label className="form-label">Calculated Footprint Area</label>
                    <input
                        type="text"
                        className="form-input"
                        readOnly
                        value={`${calculatedArea} ${specs.unit}²`}
                        style={{ background: 'rgba(255,255,255,0.05)', cursor: 'default' }}
                    />
                </div>
            </div>

            {/* Floors & Wall Type */}
            <div className="spec-row">
                <div className="form-group">
                    <label className="form-label">Number of Floors <Tooltip text={FIELD_TOOLTIPS.floors} /></label>
                    <select
                        className="form-select"
                        value={specs.floors}
                        onChange={(e) => update('floors', e.target.value)}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <option key={n} value={n}>{n} Floor{n > 1 ? 's' : ''}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Wall Thickness (mm) <Tooltip text={FIELD_TOOLTIPS.wallThickness} /></label>
                    <input
                        type="number"
                        className="form-input"
                        placeholder="e.g., 230"
                        value={specs.wallThickness}
                        onChange={(e) => update('wallThickness', e.target.value)}
                    />
                    {errors.wallThickness && <span className="error-text">{errors.wallThickness}</span>}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Wall Material <Tooltip text={FIELD_TOOLTIPS.wallType} /></label>
                <select
                    className="form-select"
                    value={specs.wallType}
                    onChange={(e) => update('wallType', e.target.value)}
                >
                    <option value="brick">🧱 Brick Wall</option>
                    <option value="concrete_block">🏗️ Concrete Block</option>
                    <option value="stone">🪨 Stone Wall</option>
                </select>
            </div>

            {/* Description */}
            <div className="form-group">
                <label className="form-label">Detailed Project Description <Tooltip text={FIELD_TOOLTIPS.description} /></label>
                <textarea
                    className="form-textarea"
                    placeholder="Describe the building type, purpose, and any specific requirements. Example: A single-story residential 3-bedroom house with a reinforced concrete slab, to be used as a primary residence."
                    value={specs.description}
                    onChange={(e) => update('description', e.target.value)}
                    rows={4}
                />
                {errors.description && <span className="error-text error-text-warn">{errors.description}</span>}
            </div>

            {/* Actions */}
            <div className="spec-actions">
                <button className="btn btn-secondary" onClick={onBack}>
                    ← Back
                </button>
                <button className="btn btn-primary btn-large" onClick={handleSubmit}>
                    🔬 Analyze & Generate Blueprint
                </button>
            </div>
        </div>
    );
}
