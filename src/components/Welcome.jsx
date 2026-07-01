import React from 'react';
import {
  Zap, Camera, MapPin, Ruler, FlaskConical, IndianRupee,
  FileText, Shield, ArrowRight, Layers, HardHat,
} from 'lucide-react';
import { SlidingNumber } from '@/components/animate-ui/primitives/texts/sliding-number';

const FEATURES = [
  {
    icon: Camera,
    title: 'Site Photo Analysis',
    desc: 'AI reads terrain, soil type, and conditions from photos of all sides.',
  },
  {
    icon: FlaskConical,
    title: 'Concrete Mix Design',
    desc: 'Exact ratios and quantities for M15 to M30 grade concrete.',
  },
  {
    icon: IndianRupee,
    title: 'Detailed Cost Estimate',
    desc: 'Material-by-material breakdown based on current market prices.',
  },
  {
    icon: FileText,
    title: 'Step-by-Step Guide',
    desc: 'Beginner-friendly instructions from foundation to finish.',
  },
];

const STEPS = [
  { icon: MapPin, label: 'Map Site', num: '01' },
  { icon: Camera, label: 'Upload Photos', num: '02' },
  { icon: Ruler, label: 'Enter Specs', num: '03' },
  { icon: Layers, label: 'Get Blueprint', num: '04' },
];

const PREVIEW_ITEMS = [
  { icon: Ruler, title: 'Foundation Specs', desc: 'Depth, width & reinforcement' },
  { icon: FlaskConical, title: 'Mix Design', desc: 'M15 – M30 concrete ratios' },
  { icon: IndianRupee, title: 'Cost Breakdown', desc: 'Materials & market rates' },
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
                <span>Engineering Blueprint</span>
                <span className="welcome-preview-live">Live</span>
              </div>
              <div className="welcome-preview-body">
                {PREVIEW_ITEMS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="welcome-preview-row">
                    <div className="welcome-preview-icon">
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <div>
                      <strong>{title}</strong>
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

      <section className="welcome-pipeline" aria-label="How it works">
        {STEPS.map(({ icon: Icon, label, num }, i) => (
          <React.Fragment key={label}>
            <div className="welcome-pipeline-step">
              <div className="welcome-pipeline-num">{num}</div>
              <div className="welcome-pipeline-icon">
                <Icon size={20} strokeWidth={2} />
              </div>
              <span>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="welcome-pipeline-line" />}
          </React.Fragment>
        ))}
      </section>

      <section className="welcome-features">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <article key={title} className="glass-card feature-card">
            <div className="feature-icon-wrap">
              <Icon size={22} strokeWidth={2} />
            </div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-desc">{desc}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
