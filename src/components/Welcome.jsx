import React from 'react';
import {
  Zap, Camera, MapPin, Ruler, FlaskConical, IndianRupee,
  FileText, Shield, ArrowRight, Layers, HardHat, CheckCircle2,
  Building2, Droplets, Hammer, BarChart3,
} from 'lucide-react';
import { SlidingNumber } from '@/components/animate-ui/primitives/texts/sliding-number';

const DELIVERABLES = [
  { icon: Building2, title: 'Foundation Design', detail: 'Type, depth, width, rebar spacing & footing layout' },
  { icon: FlaskConical, title: 'Concrete Mix (M15–M30)', detail: 'Cement, sand, aggregate ratios with bag counts' },
  { icon: Hammer, title: 'Steel & Reinforcement', detail: 'TMT bar sizes, weight in kg/tons per element' },
  { icon: Droplets, title: 'Soil Assessment', detail: 'Bearing capacity, drainage & terrain from your photos' },
  { icon: IndianRupee, title: 'Material Cost Table', detail: 'Cement, bricks, sand, aggregate at 2026 market rates' },
  { icon: BarChart3, title: 'Quantity Schedule', detail: 'Full BOQ — cement bags, CFT sand, wall units, steel tons' },
];

const FEATURES = [
  {
    icon: Camera,
    title: 'Site Photo Analysis',
    desc: 'AI reads terrain, soil type, slope, and ground conditions from 4 site photos.',
    bullets: ['Front, side & ground close-up', 'Soil type classification', 'Drainage & slope notes'],
  },
  {
    icon: FlaskConical,
    title: 'Concrete Mix Design',
    desc: 'Grade-specific ratios cross-checked against IS 10262 and your building load.',
    bullets: ['M15, M20, M25, M30 grades', 'Water–cement ratio', 'Per-floor volume estimates'],
  },
  {
    icon: IndianRupee,
    title: 'Detailed Cost Estimate',
    desc: 'Line-item material costs you can verify with local suppliers.',
    bullets: ['Cement & steel pricing', 'Brick/block quantities', 'Total project cost range'],
  },
  {
    icon: FileText,
    title: 'Step-by-Step Guide',
    desc: 'Beginner-friendly construction sequence from excavation to finish.',
    bullets: ['Foundation to roof stages', 'Safety checkpoints', 'DPC & curing instructions'],
  },
];

const STEPS = [
  {
    icon: MapPin,
    label: 'Map Site',
    num: '01',
    detail: 'Pin your plot on the map or enter coordinates manually.',
  },
  {
    icon: Camera,
    label: 'Upload Photos',
    num: '02',
    detail: '4 photos — 3 sides of the plot plus a ground close-up.',
  },
  {
    icon: Ruler,
    label: 'Enter Specs',
    num: '03',
    detail: 'Length, width, floors, wall type & building purpose.',
  },
  {
    icon: Layers,
    label: 'Get Blueprint',
    num: '04',
    detail: 'Full engineering report with costs in under 2 minutes.',
  },
];

const PREVIEW_ITEMS = [
  { icon: Ruler, title: 'Foundation', desc: 'Strip footing · 1.2 m depth · Fe 500 rebar', value: 'IS 456' },
  { icon: FlaskConical, title: 'Mix Design', desc: 'M20 · 1:1.5:3 · ~142 cement bags', value: 'M20' },
  { icon: IndianRupee, title: 'Est. Cost', desc: 'Materials + labour breakdown', value: '₹4.2L+' },
  { icon: Hammer, title: 'Steel', desc: '2.4 tons TMT · 12mm & 16mm bars', value: '2.4 t' },
  { icon: Droplets, title: 'Soil', desc: 'Medium sand · 250 kN/m² bearing', value: 'Good' },
];

export default function Welcome({ onGetStarted, user }) {
  return (
    <div className="welcome-container">
      <section className="welcome-hero">
        <div className="welcome-hero-grid">
          <div className="welcome-hero-copy">
            <div className="welcome-badge">
              <Zap size={14} strokeWidth={2.5} />
              AI-Powered Engineering
            </div>

            <h1 className="welcome-title">
              Build Smarter with{' '}
              <em>Engineering Intelligence</em>
            </h1>

            <p className="welcome-subtitle">
              Upload site photos, map your location, and receive a complete engineering blueprint
              with foundation specs, concrete mix ratios, material estimates, and step-by-step guides.
            </p>

            <div className="welcome-stats">
              <div className="welcome-stat">
                <strong><SlidingNumber number={4} inView /></strong>
                <span>Site Photos</span>
              </div>
              <div className="welcome-stat">
                <strong>IS</strong>
                <span>Standards</span>
              </div>
              <div className="welcome-stat">
                <strong>AI</strong>
                <span>Gemini Vision</span>
              </div>
              <div className="welcome-stat">
                <strong>₹</strong>
                <span>Estimates</span>
              </div>
            </div>

            <div className="welcome-cta">
              <button type="button" className="btn btn-primary btn-large" onClick={onGetStarted}>
                {user ? 'Start New Project' : 'Get Started'}
                <ArrowRight size={18} />
              </button>
              <p className="welcome-cta-hint">
                <Shield size={13} />
                Cross-validated against IS 456 &amp; ACI 318
              </p>
            </div>
          </div>

          <div className="welcome-hero-visual" aria-hidden="true">
            <div className="welcome-preview-shell">
              <div className="welcome-preview-header">
                <HardHat size={16} />
                <span>Sample Engineering Blueprint</span>
                <span className="welcome-preview-live">Live</span>
              </div>
              <div className="welcome-preview-body">
                {PREVIEW_ITEMS.map(({ icon: Icon, title, desc, value }) => (
                  <div key={title} className="welcome-preview-row">
                    <div className="welcome-preview-icon">
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <div className="welcome-preview-text">
                      <div className="welcome-preview-row-top">
                        <strong>{title}</strong>
                        <span className="welcome-preview-value">{value}</span>
                      </div>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="welcome-preview-glow" />
          </div>
        </div>
      </section>

      <section className="welcome-deliverables" aria-labelledby="deliverables-heading">
        <div className="welcome-section-head">
          <h2 id="deliverables-heading">What&apos;s in your blueprint</h2>
          <p>Every project report includes these engineering deliverables</p>
        </div>
        <div className="welcome-deliverables-grid">
          {DELIVERABLES.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="welcome-deliverable-card glass-card">
              <div className="welcome-deliverable-icon">
                <Icon size={20} strokeWidth={2} />
              </div>
              <div>
                <h3>{title}</h3>
                <p>{detail}</p>
              </div>
              <CheckCircle2 size={16} className="welcome-deliverable-check" />
            </div>
          ))}
        </div>
      </section>

      <section className="welcome-pipeline-wrap" aria-labelledby="pipeline-heading">
        <div className="welcome-section-head">
          <h2 id="pipeline-heading">How it works</h2>
          <p>Four steps from site photos to a full engineering report</p>
        </div>
        <div className="welcome-pipeline">
          {STEPS.map(({ icon: Icon, label, num, detail }, i) => (
            <React.Fragment key={label}>
              <div className="welcome-pipeline-step">
                <div className="welcome-pipeline-num">{num}</div>
                <div className="welcome-pipeline-icon">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <strong className="welcome-pipeline-label">{label}</strong>
                <p className="welcome-pipeline-detail">{detail}</p>
              </div>
              {i < STEPS.length - 1 && <div className="welcome-pipeline-line" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="welcome-features-wrap" aria-labelledby="features-heading">
        <div className="welcome-section-head">
          <h2 id="features-heading">Built for real construction</h2>
          <p>AI analysis backed by civil engineering formulas and Indian standards</p>
        </div>
        <div className="welcome-features">
          {FEATURES.map(({ icon: Icon, title, desc, bullets }) => (
            <article key={title} className="glass-card feature-card">
              <div className="feature-icon-wrap">
                <Icon size={22} strokeWidth={2} />
              </div>
              <h3 className="feature-title">{title}</h3>
              <p className="feature-desc">{desc}</p>
              <ul className="feature-bullets">
                {bullets.map((b) => (
                  <li key={b}>
                    <CheckCircle2 size={13} />
                    {b}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
