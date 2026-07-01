import React, { useState } from 'react';
import { calculateDetailedCost, formatIndianCurrency, crossValidateAnalysis } from '../services/engineeringDB';
import { saveProject } from '../services/api';

/**
 * Engineering glossary for beginner-friendly tooltips
 */
const GLOSSARY = {
  'foundation': 'The base of the building that sits in the ground and transfers the building weight to the soil.',
  'footing': 'The lowest part of the foundation that directly contacts the soil.',
  'reinforcement': 'Steel bars (rebar) placed inside concrete to make it stronger against bending and cracking.',
  'concrete mix': 'A mixture of cement, sand, gravel, and water that hardens into a strong material.',
  'bearing capacity': 'How much weight the soil can safely support without sinking.',
  'curing': 'Keeping concrete wet for several days after pouring so it becomes strong properly.',
  'M20': 'A concrete grade with 20 MPa strength — standard for residential buildings.',
  'M25': 'A concrete grade with 25 MPa strength — used for multi-story buildings.',
  'aggregate': 'Small crushed stones or gravel mixed into concrete for strength.',
  'mortar': 'A paste of cement and sand used to join bricks or blocks together.',
  'plinth': 'The raised base of a building between the ground and the floor level.',
  'lintel': 'A horizontal beam above doors and windows to support the wall above.',
  'DPC': 'Damp Proof Course — a waterproof layer to prevent ground moisture from rising up the walls.',
  'rebar': 'Reinforcement steel bar — provides tensile strength to concrete.',
  'TMT': 'Thermo-Mechanically Treated steel bars — the most common type of rebar used in construction.',
  'PCC': 'Plain Cement Concrete — concrete without steel reinforcement, used for leveling.',
  'RCC': 'Reinforced Cement Concrete — concrete with steel bars inside for strength.',
  'shuttering': 'Temporary molds (usually wood/plywood) used to hold wet concrete in shape until it hardens.',
  'water-cement ratio': 'The ratio of water to cement in a mix. Lower ratio = stronger concrete.',
  'earthing': 'Connecting electrical systems to the ground for safety against electric shock.',
  'conduit': 'Protective pipe/tube through which electrical wires are routed inside walls.',
  'seismic zone': 'Geographic areas classified by earthquake risk level. Higher zone = more reinforcement needed.',
};

function GlossaryText({ text }) {
  if (!text || typeof text !== 'string') return text;
  const parts = [];
  let remaining = text;
  const sortedTerms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  
  // Simple scan: just add tooltip spans for first occurrence of each term
  sortedTerms.forEach(term => {
    const lowerRemaining = remaining.toLowerCase();
    const idx = lowerRemaining.indexOf(term.toLowerCase());
    if (idx !== -1) {
      const before = remaining.substring(0, idx);
      const match = remaining.substring(idx, idx + term.length);
      const after = remaining.substring(idx + term.length);
      if (before) parts.push(before);
      parts.push(<span key={term} className="glossary-term" title={GLOSSARY[term]}>{match}<span className="glossary-badge">?</span></span>);
      remaining = after;
    }
  });
  if (remaining) parts.push(remaining);
  return parts.length > 1 ? <>{parts}</> : text;
}

function AiFloorPlanImage({ specs, analysis }) {
  const [imgUrl, setImgUrl] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const buildingType = specs.buildingType?.replace(/_/g, ' ') || 'residential house';
    const desc = `Architectural floor plan blueprint of a ${specs.floors}-floor ${buildingType}, ${specs.length}x${specs.width} ${specs.unit}, showing room layout, walls, doors, and windows, top-down view, professional engineering drawing style, blue and white colors, detailed dimensions`;
    const encoded = encodeURIComponent(desc);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=800&height=600&nologo=true`;
    setImgUrl(url);
    setLoading(false);
  }, [specs]);

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Generating AI floor plan...</div>;
  if (!imgUrl) return null;

  return (
    <div className="ai-floorplan-wrap">
      <img
        src={imgUrl}
        alt="AI-generated floor plan"
        style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>
        🤖 AI-generated conceptual floor plan — for visualization only, not to scale
      </p>
    </div>
  );
}

export default function BlueprintView({ analysis, estimate, specs, blueprintImage, siteLocation, photos = {}, user, onRequestLogin, onNewProject, onRefine }) {
    const [feedback, setFeedback] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [activeSection, setActiveSection] = useState(null);
    const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
    const [saveError, setSaveError] = useState('');

    if (!analysis) return null;

    const {
        siteAssessment = {},
        foundationEngineering = {},
        wiringAndElectrical = {},
        concreteMixDesign = {},
        materialEstimateSummary = {},
        stepByStepGuide = [],
        safetyWarnings = [],
        blueprintDescription = "",
        formulasAndCalculations = []
    } = analysis;

    // Cross-validate AI output against engineering database
    const validation = crossValidateAnalysis(analysis, specs);
    const allWarnings = [
        ...validation.warnings,
        ...safetyWarnings.map(w => ({ severity: 'warning', message: w })),
    ];

    // Calculate detailed cost from estimate data
    const costData = estimate?.summary ? calculateDetailedCost({
        cementBags: estimate.summary.cementBags,
        sandCft: estimate.summary.sandCft,
        aggregateCft: estimate.summary.aggregateCft,
        steelKg: estimate.summary.steelKg,
        bricks: specs.wallType === 'brick' ? estimate.summary.wallUnits : 0,
        blocks: specs.wallType === 'concrete_block' ? estimate.summary.wallUnits : 0,
        waterLiters: estimate.summary.waterLiters,
    }) : null;

    const handleRefineSubmit = async () => {
        if (!feedback.trim()) return;
        setIsRefining(true);
        try {
            await onRefine(feedback);
            setFeedback('');
        } finally {
            setIsRefining(false);
        }
    };

    const handleSaveProject = async () => {
        if (!user) {
            onRequestLogin?.();
            return;
        }
        setSaveState('saving');
        setSaveError('');
        try {
            const projectName = `${specs.length}x${specs.width} ${specs.unit} — ${specs.floors}F ${specs.buildingType?.replace(/_/g, ' ') || 'build'}`;
            const photosMeta = Object.entries(photos).map(([side, file]) => ({
                side,
                name: file?.name || side,
                size: file?.size,
            }));
            await saveProject({
                projectName,
                specs,
                aiAnalysis: analysis,
                estimate,
                photosMeta,
            });
            setSaveState('saved');
        } catch (err) {
            setSaveState('error');
            setSaveError(err.message);
        }
    };

    const toggleSection = (id) => setActiveSection(activeSection === id ? null : id);

    return (
        <div className="blueprint-container animate-in">
            {/* Header */}
            <div className="blueprint-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div className="welcome-badge" style={{ marginBottom: '12px' }}>⚙️ Engineering Report</div>
                        <h1>Comprehensive Construction Blueprint</h1>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                        🖨️ Download / Print Report
                    </button>
                </div>
                <p className="specs-summary">
                    {specs.length} × {specs.width} {specs.unit} • {specs.floors} Floor{specs.floors > 1 ? 's' : ''} • {specs.totalHeight} {specs.unit} Height
                </p>
            </div>

            {/* ─── Disclaimer ─── */}
            {analysis._isMockFallback && (
                <div className="mock-fallback-banner">
                    <strong>⚠️ Demo data:</strong> The Gemini API quota was exceeded or unavailable.
                    This report uses sample engineering data — not a real AI analysis. Retry later with a valid API key.
                </div>
            )}
            <div className="disclaimer-banner">
                <strong>⚠️ Important Disclaimer:</strong> This report is AI-generated and cross-validated against IS 456/ACI 318 standards.
                While calculations follow engineering rules, always consult a licensed structural engineer before actual construction.
                Material costs are estimates based on average 2026 market rates — verify locally.
            </div>

            {/* ─── Safety Warnings Panel ─── */}
            {allWarnings.length > 0 && (
                <div className="safety-panel">
                    <div className="safety-panel-header" onClick={() => toggleSection('safety')}>
                        <h3>🛡️ Safety Warnings & Validation ({allWarnings.length})</h3>
                        <span className="toggle-icon">{activeSection === 'safety' ? '▲' : '▼'}</span>
                    </div>
                    <div className={`safety-panel-body ${activeSection === 'safety' || activeSection === null ? 'open' : ''}`}>
                        {allWarnings.map((w, i) => (
                            <div key={i} className={`safety-item severity-${w.severity}`}>
                                <span className="safety-icon">
                                    {w.severity === 'critical' ? '🔴' : w.severity === 'warning' ? '🟡' : 'ℹ️'}
                                </span>
                                <span>{w.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* ─── Site Location Info ─── */}
            {siteLocation && (
                <div className="location-info-banner">
                    <span className="location-info-icon">📍</span>
                    <div>
                        <strong>Site Location:</strong> {siteLocation.address}
                        {siteLocation.region && <span className="location-region-badge">{siteLocation.region}</span>}
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>GPS: {siteLocation.lat}, {siteLocation.lng}</div>
                    </div>
                </div>
            )}

            <div className="blueprint-grid blueprint-grid-results">
                {/* ─── Site & Soil Analysis ─── */}
                <div className="glass-card blueprint-card">
                    <div className="blueprint-card-header">
                        <div className="blueprint-card-icon blue">🌍</div>
                        <div>
                            <div className="blueprint-card-title">Site & Soil Analysis</div>
                            <div className="blueprint-card-subtitle">AI Terrain Assessment</div>
                        </div>
                    </div>
                    <div className="report-section">
                        <h4>Nature of Soil</h4>
                        <p><GlossaryText text={siteAssessment.soilNature} /></p>
                        <h4>Terrain & Drainage</h4>
                        <p><GlossaryText text={siteAssessment.terrainAnalysis} /></p>
                    </div>
                    {siteAssessment.safetyConcerns?.length > 0 && (
                        <div className="mini-safety-list">
                            {siteAssessment.safetyConcerns.map((s, i) => <div key={i} className="safety-tag">⚠️ {s}</div>)}
                        </div>
                    )}
                </div>

                {/* ─── Foundation Engineering ─── */}
                <div className="glass-card blueprint-card">
                    <div className="blueprint-card-header">
                        <div className="blueprint-card-icon amber">🏗️</div>
                        <div>
                            <div className="blueprint-card-title">Foundation Engineering</div>
                            <div className="blueprint-card-subtitle">{foundationEngineering.recommendedType}</div>
                        </div>
                    </div>
                    <div className="data-row">
                        <span className="data-label">Depth</span>
                        <span className="data-value">{foundationEngineering.depth}</span>
                    </div>
                    <div className="data-row">
                        <span className="data-label">Width</span>
                        <span className="data-value">{foundationEngineering.width}</span>
                    </div>
                    <div className="report-section" style={{ marginTop: '12px' }}>
                        <h4>Reinforcement (Steel)</h4>
                        <p>{foundationEngineering.reinforcement}</p>
                    </div>
                    {foundationEngineering.formulasUsed?.length > 0 && (
                        <div className="formula-block">
                            {foundationEngineering.formulasUsed.map((f, i) => <div key={i}>λ {f}</div>)}
                        </div>
                    )}
                </div>

                {/* ─── Concrete Mix Design ─── */}
                <div className="glass-card blueprint-card">
                    <div className="blueprint-card-header">
                        <div className="blueprint-card-icon emerald">🧪</div>
                        <div>
                            <div className="blueprint-card-title">Concrete Mix Design</div>
                            <div className="blueprint-card-subtitle">Grade {concreteMixDesign.targetGrade}</div>
                        </div>
                    </div>
                    <div className="data-row">
                        <span className="data-label">Mix Ratio</span>
                        <span className="data-value">{concreteMixDesign.ratio}</span>
                    </div>
                    <div className="report-section" style={{ marginTop: '12px' }}>
                        <h4>Mixing Procedure (Beginners)</h4>
                        <p>{concreteMixDesign.mixingInstructions}</p>
                        <h4>Curing Process</h4>
                        <p>💧 {concreteMixDesign.curingProcess}</p>
                    </div>
                </div>

                {/* ─── Wiring & Electrical ─── */}
                <div className="glass-card blueprint-card">
                    <div className="blueprint-card-header">
                        <div className="blueprint-card-icon purple">⚡</div>
                        <div>
                            <div className="blueprint-card-title">Wiring & Electrical</div>
                            <div className="blueprint-card-subtitle">Layout & Safety</div>
                        </div>
                    </div>
                    <div className="report-section">
                        <h4>Layout Strategy</h4>
                        <p>{wiringAndElectrical.layoutStrategy}</p>
                        <h4>Estimated Points</h4>
                        <p>{wiringAndElectrical.estimatedPoints}</p>
                        <div className="safety-note">
                            🛡️ <strong>Safety:</strong> {wiringAndElectrical.safetyProtocols}
                        </div>
                    </div>
                </div>

                {/* ─── Floor Plan SVG ─── */}
                <div className="glass-card blueprint-card blueprint-full-width">
                    <div className="blueprint-card-header">
                        <div className="blueprint-card-icon blue">📏</div>
                        <div>
                            <div className="blueprint-card-title">Building Footprint</div>
                            <div className="blueprint-card-subtitle">Scale diagram of {specs.length}×{specs.width} {specs.unit}</div>
                        </div>
                    </div>
                    <FloorPlanSVG specs={specs} foundation={foundationEngineering} />

                    {/* AI Floor Plan */}
                    <div style={{ marginTop: '16px' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', marginBottom: '12px' }}>🤖 AI-Generated Floor Plan</h4>
                        <AiFloorPlanImage specs={specs} analysis={analysis} />
                    </div>
                </div>

                {/* ─── Detailed Cost Breakdown ─── */}
                {costData && (
                    <div className="glass-card blueprint-card blueprint-full-width">
                        <div className="blueprint-card-header">
                            <div className="blueprint-card-icon amber">💰</div>
                            <div>
                                <div className="blueprint-card-title">Detailed Cost Breakdown</div>
                                <div className="blueprint-card-subtitle">Based on 2026 market rates (INR)</div>
                            </div>
                        </div>
                        <div className="cost-table-wrap">
                            <table className="cost-table">
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Quantity</th>
                                        <th>Unit</th>
                                        <th>Rate (₹)</th>
                                        <th>Amount (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {costData.items.map((item, i) => (
                                        <tr key={i}>
                                            <td>{item.item}</td>
                                            <td>{typeof item.quantity === 'number' ? item.quantity.toLocaleString() : item.quantity}</td>
                                            <td>{item.unit}</td>
                                            <td>{item.unitRate.toLocaleString('en-IN')}</td>
                                            <td className="cost-amount">{item.total.toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="cost-total-row">
                                        <td colSpan="4"><strong>Estimated Total</strong></td>
                                        <td className="cost-total">{formatIndianCurrency(costData.total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="cost-note">
                            💡 <strong>Note:</strong> Prices are approximate 2026 market rates. Actual costs may vary 15-25% based on location,
                            transport, brand, and seasonal fluctuations. Always get local quotations before purchasing.
                        </div>
                    </div>
                )}

                {/* ─── Material Summary Cards ─── */}
                <div className="glass-card blueprint-card blueprint-full-width">
                    <div className="blueprint-card-header">
                        <div className="blueprint-card-icon emerald">📦</div>
                        <div>
                            <div className="blueprint-card-title">Material Quantities Summary</div>
                            <div className="blueprint-card-subtitle">Calculated from engineering formulas</div>
                        </div>
                    </div>
                    <div className="estimate-grid">
                        <div className="estimate-item">
                            <span className="est-val">{materialEstimateSummary.cementBags || estimate?.summary?.cementBags || '—'}</span>
                            <span className="est-label">Cement Bags</span>
                        </div>
                        <div className="estimate-item">
                            <span className="est-val">{materialEstimateSummary.bricksBlocks || estimate?.summary?.wallUnits || '—'}</span>
                            <span className="est-label">Bricks / Blocks</span>
                        </div>
                        <div className="estimate-item">
                            <span className="est-val">{materialEstimateSummary.steelTons || (estimate?.summary?.steelKg ? (estimate.summary.steelKg / 1000).toFixed(2) : '—')}</span>
                            <span className="est-label">Steel (Tons)</span>
                        </div>
                        <div className="estimate-item">
                            <span className="est-val">{materialEstimateSummary.sandCft || estimate?.summary?.sandCft || '—'}</span>
                            <span className="est-label">Sand (Cft)</span>
                        </div>
                        <div className="estimate-item">
                            <span className="est-val">{materialEstimateSummary.aggregateCft || estimate?.summary?.aggregateCft || '—'}</span>
                            <span className="est-label">Aggregate (Cft)</span>
                        </div>
                    </div>
                    {materialEstimateSummary.currentMarketRateNotes && (
                        <div className="market-note">
                            💡 <strong>AI Market Note:</strong> {materialEstimateSummary.currentMarketRateNotes}
                        </div>
                    )}
                </div>

                {/* ─── Step-by-Step Construction Guide ─── */}
                <div className="glass-card blueprint-card blueprint-full-width">
                    <div className="blueprint-card-header">
                        <div className="blueprint-card-icon amber">📋</div>
                        <div>
                            <div className="blueprint-card-title">Construction Roadmap</div>
                            <div className="blueprint-card-subtitle">Phase-wise execution guide for beginners</div>
                        </div>
                    </div>
                    <div className="roadmap-list">
                        {stepByStepGuide.map((phase, idx) => (
                            <div key={idx} className="roadmap-phase">
                                <div className="phase-header">
                                    <span className="phase-num">{idx + 1}</span>
                                    <h4>{phase.phase}</h4>
                                </div>
                                <ul className="phase-steps">
                                    {phase.steps.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                                {phase.safetyWarning && <div className="phase-safety">⚠️ {phase.safetyWarning}</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── AI Visualization ─── */}
                {blueprintImage && (
                    <div className="glass-card blueprint-card blueprint-full-width">
                        <div className="blueprint-card-header">
                            <div className="blueprint-card-icon emerald">🏙️</div>
                            <div>
                                <div className="blueprint-card-title">AI Architectural Visualization</div>
                                <div className="blueprint-card-subtitle">3D rendering of your project vision</div>
                            </div>
                        </div>
                        <div className="blueprint-image-wrap">
                            <img src={blueprintImage.imageData} alt="AI Blueprint" />
                        </div>
                        <p className="image-desc">{blueprintDescription}</p>
                    </div>
                )}

                {/* ─── Engineering Formulas ─── */}
                <div className="glass-card blueprint-card blueprint-full-width">
                    <div className="blueprint-card-header">
                        <div className="blueprint-card-icon blue">📐</div>
                        <div>
                            <div className="blueprint-card-title">Engineering Formulas & Calculations</div>
                            <div className="blueprint-card-subtitle">Mathematical grounding (IS 456 / ACI 318)</div>
                        </div>
                    </div>
                    <div className="formula-list">
                        {formulasAndCalculations.map((f, i) => (
                            <div key={i} className="formula-card">
                                <div className="formula-num">F{i + 1}</div>
                                <div className="formula-text">{f}</div>
                            </div>
                        ))}
                    </div>
                    {/* Local calculator formulas */}
                    {estimate?.foundation?.formulas && (
                        <div className="formula-list" style={{ marginTop: '16px' }}>
                            <div className="formula-section-label">📊 Verified Calculator Formulas</div>
                            {Object.values(estimate.foundation.formulas).map((f, i) => (
                                <div key={`calc-${i}`} className="formula-card verified">
                                    <div className="formula-num">✓</div>
                                    <div className="formula-text">{f}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ─── Refinement Loop ─── */}
                <div className="glass-card blueprint-card blueprint-full-width refinement-card">
                    <div className="blueprint-card-header">
                        <div className="blueprint-card-icon purple">💬</div>
                        <div>
                            <div className="blueprint-card-title">Request Changes or Ask Questions</div>
                            <div className="blueprint-card-subtitle">Talk to your AI Structural Engineer</div>
                        </div>
                    </div>
                    <div className="refinement-input-box">
                        <textarea
                            placeholder="e.g., 'Can we use a raft foundation instead?' or 'Give me more details about the plumbing.' or 'What if I want to add a second floor later?'"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                        <button
                            className="btn btn-primary"
                            disabled={isRefining || !feedback.trim()}
                            onClick={handleRefineSubmit}
                        >
                            {isRefining ? '🔄 Analyzing...' : '🚀 Send Request'}
                        </button>
                    </div>
                </div>

                {/* ─── Actions ─── */}
                <div className="blueprint-actions">
                    <button className="btn btn-secondary btn-large" onClick={() => window.print()}>🖨️ Print Report</button>
                    <button
                        className="btn btn-secondary btn-large"
                        onClick={handleSaveProject}
                        disabled={saveState === 'saving' || saveState === 'saved'}
                    >
                        {saveState === 'saving' ? '💾 Saving...' : saveState === 'saved' ? '✅ Saved' : user ? '💾 Save Project' : '🔐 Sign in to Save'}
                    </button>
                    <button className="btn btn-primary btn-large" onClick={onNewProject}>🆕 Start New Project</button>
                </div>
                {saveError && <p className="field-error" style={{ textAlign: 'center', marginTop: '12px' }}>{saveError}</p>}
            </div>

            <style>{`
                .blueprint-container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
                .blueprint-header { text-align: center; margin-bottom: 24px; }
                .blueprint-header h1 { font-size: 2.2rem; margin-bottom: 8px; }
                .specs-summary { color: var(--text-secondary); font-size: 0.95rem; margin-top: 8px; }

                .disclaimer-banner {
                    background: rgba(59, 130, 246, 0.08);
                    border: 1px solid rgba(59, 130, 246, 0.25);
                    border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;
                    font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;
                }

                /* Safety Warnings Panel */
                .safety-panel {
                    background: var(--bg-card); border: 1px solid rgba(239,68,68,0.2);
                    border-radius: 12px; margin-bottom: 24px; overflow: hidden;
                }
                .safety-panel-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 16px 20px; cursor: pointer; background: rgba(239,68,68,0.05);
                }
                .safety-panel-header h3 { margin: 0; font-size: 1rem; color: #ef4444; }
                .toggle-icon { color: var(--text-secondary); font-size: 0.8rem; }
                .safety-panel-body { display: none; padding: 16px 20px; }
                .safety-panel-body.open { display: block; }
                .safety-item {
                    display: flex; align-items: flex-start; gap: 10px;
                    padding: 10px 12px; border-radius: 8px; margin-bottom: 8px;
                    font-size: 0.85rem; line-height: 1.5;
                }
                .safety-item.severity-critical { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); }
                .safety-item.severity-warning { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); }
                .safety-item.severity-info { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); }
                .safety-icon { font-size: 1rem; min-width: 20px; }

                /* Blueprint Cards */
                .blueprint-card { padding: 24px; }
                .blueprint-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
                .blueprint-card-icon {
                    width: 44px; height: 44px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center; font-size: 1.3rem;
                }
                .blueprint-card-icon.blue { background: var(--accent-blue-glow); }
                .blueprint-card-icon.amber { background: var(--accent-amber-dim); }
                .blueprint-card-icon.emerald { background: var(--accent-emerald-glow); }
                .blueprint-card-icon.purple { background: rgba(139,92,246,0.15); }
                .blueprint-card-title { font-weight: 700; font-size: 1rem; }
                .blueprint-card-subtitle { font-size: 0.8rem; color: var(--text-secondary); }

                .data-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
                .data-label { color: var(--text-secondary); font-size: 0.85rem; }
                .data-value { font-weight: 600; font-size: 0.9rem; }

                .report-section h4 { font-size: 0.9rem; color: var(--accent-blue); margin: 12px 0 4px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;}
                .report-section p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; }

                .mini-safety-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
                .safety-tag { font-size: 0.75rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.2); }
                .safety-note { margin-top: 12px; padding: 10px; background: rgba(16,185,129,0.05); border-radius: 8px; font-size: 0.8rem; color: var(--accent-emerald); }

                .formula-block { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-top: 12px; font-family: monospace; font-size: 0.8rem; color: var(--accent-blue); }

                /* Cost Table */
                .cost-table-wrap { overflow-x: auto; margin-top: 16px; }
                .cost-table { width: 100%; border-collapse: collapse; }
                .cost-table th { text-align: left; padding: 10px 16px; background: rgba(255,255,255,0.03); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); border-bottom: 1px solid rgba(255,255,255,0.08); }
                .cost-table td { padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.85rem; }
                .cost-amount { font-weight: 600; color: var(--accent-emerald); }
                .cost-total-row { background: rgba(245,158,11,0.08); }
                .cost-total { font-weight: 800; font-size: 1.1rem; color: var(--accent-amber); }
                .cost-note { margin-top: 16px; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; }
                .market-note { margin-top: 16px; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; }

                /* Estimate Grid */
                .estimate-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 16px; }
                .estimate-item { background: rgba(255,255,255,0.03); padding: 16px 8px; border-radius: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.05); }
                .est-val { display: block; font-size: 1.25rem; font-weight: 700; color: var(--accent-emerald); }
                .est-label { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }

                /* Roadmap */
                .roadmap-list { display: flex; flex-direction: column; gap: 20px; margin-top: 16px; }
                .roadmap-phase { border-left: 2px solid var(--accent-amber); padding-left: 20px; position: relative; }
                .phase-num { position: absolute; left: -11px; top: 0; width: 20px; height: 20px; background: var(--accent-amber); color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; }
                .phase-header h4 { margin: 0 0 8px; font-size: 1rem; color: var(--accent-amber); }
                .phase-steps { padding-left: 20px; margin: 0; font-size: 0.85rem; color: var(--text-secondary); }
                .phase-steps li { margin-bottom: 4px; line-height: 1.5; }
                .phase-safety { margin-top: 8px; font-size: 0.8rem; color: #ef4444; background: rgba(239,68,68,0.05); padding: 6px 10px; border-radius: 4px; }

                /* AI Image */
                .blueprint-image-wrap { margin: 16px 0; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
                .blueprint-image-wrap img { width: 100%; display: block; }
                .image-desc { font-size: 0.85rem; color: var(--text-secondary); margin-top: 12px; line-height: 1.5; }

                /* Formulas */
                .formula-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
                .formula-section-label { font-size: 0.8rem; font-weight: 700; color: var(--accent-emerald); margin-bottom: 4px; }
                .formula-card {
                    display: flex; align-items: flex-start; gap: 12px;
                    padding: 10px 14px; background: rgba(255,255,255,0.03); border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.04);
                }
                .formula-card.verified { border-color: rgba(16,185,129,0.2); background: rgba(16,185,129,0.03); }
                .formula-num {
                    min-width: 28px; height: 28px; border-radius: 50%;
                    background: var(--accent-blue-glow); color: var(--accent-blue);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.7rem; font-weight: 700;
                }
                .formula-card.verified .formula-num { background: var(--accent-emerald-glow); color: var(--accent-emerald); }
                .formula-text { font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; }

                /* Refinement */
                .refinement-input-box { margin-top: 16px; }
                .refinement-input-box textarea { width: 100%; min-height: 100px; background: var(--bg-input); border: 1px solid var(--border-medium); border-radius: 8px; padding: 12px; color: var(--text-primary); font-family: inherit; resize: vertical; margin-bottom: 12px; }
                .refinement-input-box textarea:focus { outline: none; border-color: var(--accent-purple); box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2); }

                /* Actions */
                .blueprint-actions { grid-column: span 2; display: flex; justify-content: center; gap: 16px; margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); }

                /* Floor Plan SVG */
                .floor-plan-container { margin: 16px auto; padding: 20px; background: rgba(255,255,255,0.02); border-radius: 12px; text-align: center; }
                .floor-plan-container svg { max-width: 100%; height: auto; }

                @media (max-width: 768px) {
                    .blueprint-container { padding: 20px 14px 40px; }
                    .blueprint-header h1 { font-size: 1.5rem; }
                    .blueprint-card { padding: 18px; }
                    .estimate-grid { grid-template-columns: repeat(2, 1fr); }
                    .blueprint-actions { flex-direction: column; }
                    .blueprint-actions .btn { width: 100%; }
                    .location-info-banner { flex-direction: column; }
                }

                @media (max-width: 480px) {
                    .estimate-grid { grid-template-columns: 1fr 1fr; }
                    .est-val { font-size: 1.1rem; }
                    .cost-table { min-width: 420px; }
                }

                /* Location Info Banner */
                .location-info-banner {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    padding: 14px 18px;
                    background: rgba(16,185,129,0.06);
                    border: 1px solid rgba(16,185,129,0.2);
                    border-radius: 12px;
                    margin-bottom: 24px;
                    font-size: 0.85rem;
                }
                .location-info-icon { font-size: 1.3rem; }
                .location-region-badge {
                    display: inline-block;
                    margin-left: 8px;
                    font-size: 0.72rem;
                    background: rgba(16,185,129,0.12);
                    color: var(--accent-emerald);
                    padding: 2px 8px;
                    border-radius: 4px;
                }

                /* Glossary */
                .glossary-term {
                    position: relative;
                    border-bottom: 1px dotted rgba(59,130,246,0.5);
                    cursor: help;
                }
                .glossary-badge {
                    font-size: 0.55rem;
                    vertical-align: super;
                    color: var(--accent-blue);
                    margin-left: 1px;
                }
                .glossary-term:hover::after {
                    content: attr(title);
                    position: absolute;
                    bottom: 120%;
                    left: 0;
                    width: 220px;
                    background: rgba(15,17,23,0.95);
                    border: 1px solid rgba(255,255,255,0.15);
                    color: var(--text-secondary);
                    font-size: 0.72rem;
                    padding: 8px 10px;
                    border-radius: 6px;
                    z-index: 1000;
                    line-height: 1.4;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    pointer-events: none;
                }

                @media print {
                    .blueprint-container { padding: 0; max-width: none; }
                    .header, .refinement-card, .blueprint-actions { display: none !important; }
                    .glass-card { break-inside: avoid; border: 1px solid #ddd; }
                    .blueprint-grid { display: block; }
                    .blueprint-card { margin-bottom: 24px; }
                    .safety-panel-body { display: block !important; }
                    body { background: white; color: black; }
                    .blueprint-card-title, .report-section h4 { color: #333; }
                    .data-label, .report-section p, .phase-steps { color: #555; }
                    .glossary-badge { display: none; }
                    .glossary-term { border-bottom: none; }
                    .location-info-banner { border: 1px solid #ccc; background: #f9f9f9; }
                }
            `}</style>
        </div>
    );
}

// ─── Floor Plan SVG Component ────────────────────────────────────────────────
function FloorPlanSVG({ specs, foundation }) {
    const l = parseFloat(specs.length) || 30;
    const w = parseFloat(specs.width) || 20;
    const unit = specs.unit || 'ft';

    // Scale to fit in SVG viewport
    const maxDim = Math.max(l, w);
    const scale = 300 / maxDim;
    const svgW = l * scale + 100;
    const svgH = w * scale + 100;
    const ox = 50; // offset
    const oy = 40;

    const rw = l * scale; // rectangle width
    const rh = w * scale; // rectangle height

    return (
        <div className="floor-plan-container">
            <svg width={svgW} height={svgH + 20} viewBox={`0 0 ${svgW} ${svgH + 20}`}>
                {/* Foundation outline (slightly larger) */}
                <rect x={ox - 8} y={oy - 8} width={rw + 16} height={rh + 16}
                    fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="6,4" opacity="0.5"
                />
                <text x={ox + rw + 12} y={oy + rh / 2} fill="#f59e0b" fontSize="9" textAnchor="start" opacity="0.7">Foundation</text>

                {/* Building outline */}
                <rect x={ox} y={oy} width={rw} height={rh}
                    fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth="2"
                />

                {/* Dimensions */}
                {/* Top dimension */}
                <line x1={ox} y1={oy - 20} x2={ox + rw} y2={oy - 20} stroke="#94a3b8" strokeWidth="1" />
                <line x1={ox} y1={oy - 25} x2={ox} y2={oy - 15} stroke="#94a3b8" strokeWidth="1" />
                <line x1={ox + rw} y1={oy - 25} x2={ox + rw} y2={oy - 15} stroke="#94a3b8" strokeWidth="1" />
                <text x={ox + rw / 2} y={oy - 24} fill="#e2e8f0" fontSize="11" textAnchor="middle" fontWeight="600">{l} {unit}</text>

                {/* Left dimension */}
                <line x1={ox - 20} y1={oy} x2={ox - 20} y2={oy + rh} stroke="#94a3b8" strokeWidth="1" />
                <line x1={ox - 25} y1={oy} x2={ox - 15} y2={oy} stroke="#94a3b8" strokeWidth="1" />
                <line x1={ox - 25} y1={oy + rh} x2={ox - 15} y2={oy + rh} stroke="#94a3b8" strokeWidth="1" />
                <text x={ox - 28} y={oy + rh / 2} fill="#e2e8f0" fontSize="11" textAnchor="middle" fontWeight="600"
                    transform={`rotate(-90, ${ox - 28}, ${oy + rh / 2})`}>{w} {unit}</text>

                {/* Area label */}
                <text x={ox + rw / 2} y={oy + rh / 2 - 8} fill="#e2e8f0" fontSize="13" textAnchor="middle" fontWeight="700">
                    {(l * w).toFixed(0)} {unit}²
                </text>
                <text x={ox + rw / 2} y={oy + rh / 2 + 8} fill="#94a3b8" fontSize="10" textAnchor="middle">
                    {specs.floors} Floor{specs.floors > 1 ? 's' : ''} • {specs.wallType}
                </text>

                {/* Compass */}
                <g transform={`translate(${svgW - 30}, ${svgH - 10})`}>
                    <line x1="0" y1="0" x2="0" y2="-20" stroke="#f59e0b" strokeWidth="2" />
                    <polygon points="0,-22 -4,-16 4,-16" fill="#f59e0b" />
                    <text x="0" y="-24" fill="#f59e0b" fontSize="9" textAnchor="middle" fontWeight="700">N</text>
                </g>

                {/* Door representation */}
                <rect x={ox + rw / 2 - 12} y={oy + rh - 2} width={24} height={4} fill="#10b981" rx="2" />
                <text x={ox + rw / 2} y={oy + rh + 14} fill="#10b981" fontSize="8" textAnchor="middle">Entry</text>
            </svg>
        </div>
    );
}
