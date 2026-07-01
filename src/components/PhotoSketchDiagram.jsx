import React from 'react';

const sketchProps = {
  viewBox: '0 0 160 96',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
};

function FrontSketch() {
  return (
    <svg {...sketchProps}>
      <rect x="0" y="0" width="160" height="42" className="photo-sketch-sky" />
      <line x1="0" y1="44" x2="160" y2="44" className="photo-sketch-line photo-sketch-line--muted" />
      <path
        d="M24 44 L136 44 L150 84 L10 84 Z"
        className="photo-sketch-plot"
      />
      <rect x="66" y="56" width="28" height="22" className="photo-sketch-building" rx="1" />
      <path d="M66 56 L80 44 L94 56 Z" className="photo-sketch-roof" />
      <rect x="76" y="66" width="8" height="12" className="photo-sketch-door" rx="0.5" />
      <circle cx="80" cy="91" r="3.5" className="photo-sketch-camera" />
      <path d="M80 88 L24 44 M80 88 L136 44" className="photo-sketch-sight" />
      <text x="80" y="78" className="photo-sketch-label" textAnchor="middle">Front</text>
    </svg>
  );
}

function LeftSideSketch() {
  return (
    <svg {...sketchProps}>
      <path
        d="M18 78 L18 28 L118 18 L118 68 Z"
        className="photo-sketch-plot"
      />
      <path d="M18 78 L118 68 L118 78 L18 88 Z" className="photo-sketch-ground-face" />
      <rect x="8" y="34" width="14" height="28" className="photo-sketch-neighbor" rx="1" />
      <path d="M8 34 L15 26 L22 34 Z" className="photo-sketch-roof" />
      <path d="M28 50 L48 48 L48 72 L28 74 Z" className="photo-sketch-tree" />
      <circle cx="38" cy="44" r="8" className="photo-sketch-foliage" />
      <circle cx="12" cy="86" r="3.5" className="photo-sketch-camera" />
      <path d="M12 83 L18 68" className="photo-sketch-sight" />
      <text x="52" y="40" className="photo-sketch-label" textAnchor="middle">Depth →</text>
    </svg>
  );
}

function RightSideSketch() {
  return (
    <svg {...sketchProps}>
      <path
        d="M142 78 L142 28 L42 18 L42 68 Z"
        className="photo-sketch-plot"
      />
      <path d="M142 78 L42 68 L42 78 L142 88 Z" className="photo-sketch-ground-face" />
      <rect x="138" y="34" width="14" height="28" className="photo-sketch-neighbor" rx="1" />
      <path d="M138 34 L145 26 L152 34 Z" className="photo-sketch-roof" />
      <path d="M112 72 L132 72 L132 78 L108 78 Z" className="photo-sketch-road" />
      <line x1="108" y1="78" x2="140" y2="78" className="photo-sketch-line photo-sketch-line--muted" />
      <circle cx="148" cy="86" r="3.5" className="photo-sketch-camera" />
      <path d="M148 83 L142 68" className="photo-sketch-sight" />
      <text x="92" y="40" className="photo-sketch-label" textAnchor="middle">← Depth</text>
    </svg>
  );
}

function GroundSketch() {
  return (
    <svg {...sketchProps}>
      <rect x="20" y="16" width="120" height="64" rx="4" className="photo-sketch-frame" />
      <path
        d="M32 36 C44 30 56 42 68 34 C80 26 92 38 104 32 C116 26 124 34 128 40"
        className="photo-sketch-texture"
      />
      <path
        d="M36 52 C48 46 60 58 72 50 C84 42 96 54 108 48 C116 44 122 50 124 54"
        className="photo-sketch-texture"
      />
      <path
        d="M40 68 C52 62 64 72 76 66 C88 60 100 70 112 64"
        className="photo-sketch-texture"
      />
      <circle cx="118" cy="68" r="7" className="photo-sketch-scale" />
      <text x="118" y="70" className="photo-sketch-scale-text" textAnchor="middle">¢</text>
      <circle cx="80" cy="88" r="3.5" className="photo-sketch-camera" />
      <path d="M80 85 L80 72" className="photo-sketch-sight" />
      <text x="52" y="28" className="photo-sketch-label" textAnchor="middle">Soil surface</text>
    </svg>
  );
}

function DroneSketch() {
  return (
    <svg {...sketchProps}>
      <rect x="28" y="24" width="104" height="56" rx="2" className="photo-sketch-plot" />
      <rect x="62" y="42" width="36" height="24" className="photo-sketch-building" rx="1" />
      <path d="M20 72 L140 72" className="photo-sketch-road" />
      <rect x="12" y="68" width="148" height="6" className="photo-sketch-road" rx="1" />
      <path d="M80 12 L80 22 M75 17 L80 12 L85 17" className="photo-sketch-line" />
      <text x="80" y="10" className="photo-sketch-label" textAnchor="middle">N</text>
      <path d="M56 8 L80 18 L104 8" className="photo-sketch-drone" />
      <circle cx="80" cy="6" r="2.5" className="photo-sketch-camera" />
      <path d="M80 10 L28 24 M80 10 L132 24 M80 10 L80 24" className="photo-sketch-sight" />
      <text x="80" y="54" className="photo-sketch-label" textAnchor="middle">Top-down</text>
    </svg>
  );
}

const SKETCH_BY_ID = {
  front: FrontSketch,
  left: LeftSideSketch,
  right: RightSideSketch,
  ground: GroundSketch,
  drone: DroneSketch,
};

export default function PhotoSketchDiagram({ slotId }) {
  const Sketch = SKETCH_BY_ID[slotId];
  if (!Sketch) return null;

  return (
    <div className="photo-sketch" aria-hidden="true">
      <span className="photo-sketch-caption">Sample angle</span>
      <Sketch />
    </div>
  );
}
