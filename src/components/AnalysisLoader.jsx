import React, { useState, useEffect } from 'react';
import { Check, Loader2, Circle } from 'lucide-react';

const ANALYSIS_STEPS = [
  { id: 1, text: 'Analyzing site photographs' },
  { id: 2, text: 'Assessing soil and terrain conditions' },
  { id: 3, text: 'Calculating foundation requirements' },
  { id: 4, text: 'Designing concrete mix ratios' },
  { id: 5, text: 'Estimating materials and quantities' },
  { id: 6, text: 'Generating construction guide' },
  { id: 7, text: 'Compiling engineering blueprint' },
];

export default function AnalysisLoader() {
  const [activeStep, setActiveStep] = useState(0);
  const [showSlowMsg, setShowSlowMsg] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);

    const slowTimer = setTimeout(() => setShowSlowMsg(true), 25000);

    return () => {
      clearInterval(interval);
      clearTimeout(slowTimer);
    };
  }, []);

  return (
    <div className="loader-container">
      <div className="loader-ring">
        <Loader2 size={40} className="loader-ring-icon" />
      </div>
      <h2 className="loader-title">Building Your Blueprint</h2>
      <p className="loader-subtitle">Our AI engineer is analyzing your project</p>

      <div className="loader-steps">
        {ANALYSIS_STEPS.map((step, index) => {
          const done = index < activeStep;
          const active = index === activeStep;
          return (
            <div
              key={step.id}
              className={`loader-step ${done ? 'done' : active ? 'active' : ''}`}
            >
              <span className="loader-step-icon">
                {done ? <Check size={14} /> : active ? <Loader2 size={14} className="spin" /> : <Circle size={10} />}
              </span>
              <span>{step.text}</span>
            </div>
          );
        })}
      </div>

      {showSlowMsg && (
        <div className="loader-slow-msg">
          <Loader2 size={14} className="spin" />
          Taking longer than expected. The AI is retrying different models.
        </div>
      )}
    </div>
  );
}
