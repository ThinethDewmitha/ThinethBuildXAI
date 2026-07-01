import React, { useState, useEffect } from 'react';

/**
 * Context-aware questions per building type when details are insufficient
 */
const BUILDING_TYPE_QUESTIONS = {
    water_tank: [
        { id: 'tank_purpose', label: 'Tank Purpose', message: 'What will this tank store? (drinking water, rainwater, septic, etc.)', inputType: 'text', placeholder: 'e.g., Drinking water storage' },
        { id: 'tank_position', label: 'Tank Position', message: 'Will the tank be underground, ground-level, or overhead (on pillars)?', inputType: 'text', placeholder: 'e.g., Underground' },
    ],
    retaining_wall: [
        { id: 'earth_height', label: 'Earth Height', message: 'How high is the earth/soil that the wall needs to hold back?', inputType: 'text', placeholder: 'e.g., 6 feet of soil behind the wall' },
        { id: 'slope_angle', label: 'Slope Details', message: 'Is the ground sloped? If yes, describe the slope direction and steepness.', inputType: 'text', placeholder: 'e.g., Steep slope downward from road to plot' },
    ],
    compound_wall: [
        { id: 'pillar_spacing', label: 'Pillar Spacing', message: 'Do you want pillars? If yes, how far apart? (common: 8-12 ft)', inputType: 'text', placeholder: 'e.g., Pillars every 10 feet' },
        { id: 'wall_finish', label: 'Wall Finish', message: 'Do you want any finish on the wall? (plastered, painted, exposed brick, railing on top)', inputType: 'text', placeholder: 'e.g., Plastered and painted with iron railing on top' },
    ],
    commercial_building: [
        { id: 'business_type', label: 'Business Type', message: 'What business will operate here? (shop, office, restaurant, clinic)', inputType: 'text', placeholder: 'e.g., Retail shop with storage room' },
        { id: 'special_needs', label: 'Special Requirements', message: 'Any special needs? (heavy machinery, large display windows, cold storage)', inputType: 'text', placeholder: 'e.g., Large glass front with display area' },
    ],
    warehouse: [
        { id: 'storage_type', label: 'Storage Type', message: 'What will be stored? (general goods, heavy equipment, food grains, chemicals)', inputType: 'text', placeholder: 'e.g., Agricultural produce and farming equipment' },
        { id: 'vehicle_access', label: 'Vehicle Access', message: 'Do trucks need to enter the building? If yes, what size?', inputType: 'text', placeholder: 'e.g., Yes, medium trucks need to enter for loading' },
    ],
    multi_story: [
        { id: 'units_per_floor', label: 'Units Per Floor', message: 'How many apartments/units per floor?', inputType: 'text', placeholder: 'e.g., 2 apartments per floor' },
        { id: 'lift_required', label: 'Lift/Elevator', message: 'Do you need a lift/elevator? How many?', inputType: 'text', placeholder: 'e.g., Yes, 1 passenger lift' },
    ],
};

/**
 * SpecValidator – AI-powered validation step.
 * Checks if the user provided enough details before running full analysis.
 * Uses a quick Gemini call to determine what's missing.
 * Now actively requests missing details with context-aware questions.
 */
export default function SpecValidator({ specs, photos, onProceed, onBack, onCancel, validateFn }) {
    const [status, setStatus] = useState('checking'); // checking | needs_more | ready
    const [missingItems, setMissingItems] = useState([]);
    const [additionalInputs, setAdditionalInputs] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        runValidation();
    }, []);

    const runValidation = async () => {
        setStatus('checking');
        setError(null);

        try {
            // Local validation first
            const localIssues = [];

            if (!photos || Object.keys(photos).length < 4) {
                localIssues.push({ id: 'photos', label: 'Site Photos', message: 'All 4 photos are required (Front, Left, Right, Ground close-up).', critical: true });
            }
            if (!specs.description || specs.description.length < 20) {
                localIssues.push({ id: 'description', label: 'Building Description', message: 'Please describe the building purpose and type in detail (at least 20 characters).', critical: true, inputType: 'text', placeholder: 'Describe your building...' });
            }
            if (!specs.totalHeight || parseFloat(specs.totalHeight) <= 0) {
                localIssues.push({ id: 'height', label: 'Building Height', message: 'Total height is required for structural calculations.', critical: true });
            }

            // Height vs floors sanity check
            if (specs.totalHeight && specs.floors) {
                const heightPerFloor = parseFloat(specs.totalHeight) / parseInt(specs.floors);
                const unit = specs.unit || 'ft';
                const minFloorHeight = unit === 'ft' ? 8 : 2.4;
                const maxFloorHeight = unit === 'ft' ? 16 : 5;
                if (heightPerFloor < minFloorHeight || heightPerFloor > maxFloorHeight) {
                    localIssues.push({
                        id: 'height_floors',
                        label: 'Height/Floors Mismatch',
                        message: `Height per floor = ${heightPerFloor.toFixed(1)} ${unit} seems unusual. Typical floor height is ${minFloorHeight}-${maxFloorHeight} ${unit}. Please verify.`,
                        critical: false,
                    });
                }
            }

            // Add building-type-specific questions
            const buildingType = specs.buildingType || 'residential_house';
            const typeQuestions = BUILDING_TYPE_QUESTIONS[buildingType] || [];
            typeQuestions.forEach(q => {
                localIssues.push({ ...q, critical: false });
            });

            // AI-powered validation if available
            let aiIssues = [];
            if (validateFn) {
                try {
                    aiIssues = await validateFn(specs, photos);
                    // Mark AI issues as having input fields so users can answer
                    aiIssues = aiIssues.map(issue => ({
                        ...issue,
                        inputType: issue.inputType || 'text',
                        placeholder: issue.placeholder || 'Provide the requested details...',
                        critical: false,
                    }));
                } catch (err) {
                    console.warn('AI validation skipped:', err.message);
                }
            }

            const allIssues = [...localIssues, ...aiIssues];

            if (allIssues.length > 0) {
                setMissingItems(allIssues);
                setStatus('needs_more');
            } else {
                setStatus('ready');
                // Auto-proceed after a short delay
                setTimeout(() => onProceed(specs), 1000);
            }
        } catch (err) {
            setError(err.message);
            setStatus('needs_more');
        }
    };

    const handleFixAndContinue = () => {
        // Check that all critical items are resolved
        const unresolved = missingItems.filter(item =>
            item.critical && item.inputType && !additionalInputs[item.id]?.trim()
        );
        if (unresolved.length > 0) {
            setError(`Please fill in the required fields: ${unresolved.map(u => u.label).join(', ')}`);
            return;
        }

        // Merge additional inputs into specs description for AI context
        const extraContext = Object.entries(additionalInputs)
            .filter(([, v]) => v && v.trim())
            .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
            .join('. ');

        const updatedSpecs = {
            ...specs,
            ...additionalInputs,
            description: extraContext
                ? `${specs.description || ''}. Additional details: ${extraContext}`
                : specs.description,
        };
        onProceed(updatedSpecs);
    };

    const handleSkip = () => {
        // Only allow skip if no critical items are unresolved
        const criticalMissing = missingItems.filter(item => item.critical && !item.inputType);
        if (criticalMissing.length > 0) {
            setError('You must fix the critical items (marked with 🔴) before proceeding.');
            return;
        }
        // Merge whatever was entered
        const extraContext = Object.entries(additionalInputs)
            .filter(([, v]) => v && v.trim())
            .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
            .join('. ');

        const updatedSpecs = {
            ...specs,
            description: extraContext
                ? `${specs.description || ''}. Additional details: ${extraContext}`
                : specs.description,
        };
        onProceed(updatedSpecs);
    };

    const criticalCount = missingItems.filter(i => i.critical).length;
    const optionalCount = missingItems.filter(i => !i.critical).length;

    return (
        <div className="validator-container animate-in">
            <div className="glass-card validator-card">
                <div className="validator-header">
                    <div className="validator-icon">
                        {status === 'checking' ? '🔍' : status === 'ready' ? '✅' : '⚠️'}
                    </div>
                    <h2>
                        {status === 'checking' ? 'Validating Your Specs...' :
                            status === 'ready' ? 'All Good! Starting Analysis...' :
                                'Additional Details Needed'}
                    </h2>
                    <p>
                        {status === 'checking' ? 'Checking if we have enough information for an accurate analysis.' :
                            status === 'ready' ? 'Your specifications are complete. Analysis will begin shortly.' :
                                'To give you the most accurate blueprint, please provide these details:'}
                    </p>
                </div>

                {status === 'checking' && (
                    <div className="validator-loading">
                        <div className="loader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
                        <span>Running engineering validation checks...</span>
                    </div>
                )}

                {status === 'needs_more' && (
                    <div className="missing-items-list">
                        {/* Critical items first */}
                        {criticalCount > 0 && (
                            <div className="section-label critical-label">🔴 Required ({criticalCount})</div>
                        )}
                        {missingItems.filter(i => i.critical).map((item, i) => (
                            <div key={item.id || i} className="missing-item missing-critical">
                                <div className="missing-badge">
                                    <span className="missing-num critical-num">!</span>
                                    <div>
                                        <div className="missing-label">{item.label}</div>
                                        <div className="missing-msg">{item.message}</div>
                                    </div>
                                </div>
                                {item.inputType && (
                                    <input
                                        type={item.inputType || 'text'}
                                        className="form-input"
                                        placeholder={item.placeholder || ''}
                                        value={additionalInputs[item.id] || ''}
                                        onChange={(e) => setAdditionalInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                        style={{ marginTop: '8px' }}
                                    />
                                )}
                            </div>
                        ))}

                        {/* Optional / additional info items */}
                        {optionalCount > 0 && (
                            <div className="section-label optional-label">💡 Recommended — Answer for better results ({optionalCount})</div>
                        )}
                        {missingItems.filter(i => !i.critical).map((item, i) => (
                            <div key={item.id || `opt-${i}`} className="missing-item missing-optional">
                                <div className="missing-badge">
                                    <span className="missing-num optional-num">{i + 1}</span>
                                    <div>
                                        <div className="missing-label">{item.label}</div>
                                        <div className="missing-msg">{item.message}</div>
                                    </div>
                                </div>
                                {item.inputType && (
                                    <input
                                        type={item.inputType || 'text'}
                                        className="form-input"
                                        placeholder={item.placeholder || ''}
                                        value={additionalInputs[item.id] || ''}
                                        onChange={(e) => setAdditionalInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                        style={{ marginTop: '8px' }}
                                    />
                                )}
                            </div>
                        ))}

                        {error && <div className="auth-error" style={{ marginTop: '16px' }}>{error}</div>}

                        <div className="validator-actions">
                            <button className="btn btn-secondary" onClick={onBack}>
                                ← Go Back & Fix
                            </button>
                            <button className="btn btn-secondary" onClick={handleSkip}>
                                Skip Optional & Continue ⚡
                            </button>
                            <button className="btn btn-primary" onClick={handleFixAndContinue}>
                                Continue with Analysis →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
