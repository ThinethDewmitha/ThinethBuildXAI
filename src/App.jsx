import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ApiKeyModal from './components/ApiKeyModal';
import PhotoUpload from './components/PhotoUpload';
import SpecForm from './components/SpecForm';
import AnalysisLoader from './components/AnalysisLoader';
import BlueprintView from './components/BlueprintView';
import SpecValidator from './components/SpecValidator';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import { initializeGemini, analyzeSite, generateBlueprintImage, refineBlueprint, validateSpecs as aiValidateSpecs } from './services/gemini';
import { convertUnits, generateFullEstimate } from './services/calculator';
import { getStoredUser, getStoredToken, logout as apiLogout, syncFirebaseSession } from './services/api';
import { getFirebaseAuth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import MapSelector from './components/MapSelector';
import InstallPwa from './components/InstallPwa';
import { SlidingNumber } from '@/components/animate-ui/primitives/texts/sliding-number';


const PHASES = {
  WELCOME: 'welcome',
  MAP_SELECT: 'map_select',
  UPLOAD: 'upload',
  SPECS: 'specs',
  VALIDATING: 'validating',
  ANALYZING: 'analyzing',
  RESULTS: 'results',
};

export default function App() {
  const [phase, setPhase] = useState(PHASES.WELCOME);
  const [apiKey, setApiKey] = useState(null);
  const [showApiModal, setShowApiModal] = useState(false);
  const [photos, setPhotos] = useState({});

  const [specs, setSpecs] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState(null);
  const [blueprintImage, setBlueprintImage] = useState(null);
  const [siteLocation, setSiteLocation] = useState(null);

  // Auth state
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Load stored API key and restore auth session
  useEffect(() => {
    const storedKey = localStorage.getItem('buildx_api_key');
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    const key = storedKey || envKey;
    if (key) {
      if (!storedKey && envKey) localStorage.setItem('buildx_api_key', envKey);
      setApiKey(key);
      initializeGemini(key);
    }

    const storedUser = getStoredUser();
    if (storedUser && getStoredToken()) {
      setUser(storedUser);
    }

    const auth = getFirebaseAuth();
    if (!auth) return undefined;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return;
      try {
        const idToken = await firebaseUser.getIdToken();
        const data = await syncFirebaseSession(idToken);
        setUser(data.user);
        setShowAuth(false);
      } catch (err) {
        console.warn('Firebase session sync failed:', err);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoHome = () => {
    setShowAuth(false);
    setShowAdmin(false);
    setPhase(PHASES.WELCOME);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGetStartedNav = () => {
    setShowAdmin(false);
    setShowAuth(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApiKeySet = (key) => {
    localStorage.setItem('buildx_api_key', key);
    setApiKey(key);
    initializeGemini(key);
    setShowApiModal(false);
    setPhase(PHASES.MAP_SELECT);
  };

  const handleGetStarted = handleGetStartedNav;

  const handleLocationConfirm = (loc) => {
    setSiteLocation(loc);
    setPhase(PHASES.UPLOAD);
  };

  const handlePhotosUpdate = (updatedPhotos) => {
    setPhotos(updatedPhotos);
  };

  const handleSpecsSubmit = (userSpecs) => {
    setSpecs(userSpecs);
    setPhase(PHASES.VALIDATING);
  };

  const handleValidationProceed = async (validatedSpecs) => {
    const userSpecs = validatedSpecs || specs;
    setSpecs(userSpecs);
    setPhase(PHASES.ANALYZING);
    setError(null);

    try {
      const lengthM = userSpecs.unit === 'ft'
        ? convertUnits(userSpecs.length, 'ft', 'm')
        : userSpecs.length;
      const widthM = userSpecs.unit === 'ft'
        ? convertUnits(userSpecs.width, 'ft', 'm')
        : userSpecs.width;

      const [aiAnalysis, engEstimate] = await Promise.all([
        analyzeSite(photos, userSpecs, siteLocation),
        Promise.resolve(generateFullEstimate(lengthM, widthM, userSpecs.floors, userSpecs.wallType, 'M20')),
      ]);

      let finalEstimate = engEstimate;
      const recommendedGrade = aiAnalysis.concreteMixDesign?.targetGrade;
      if (recommendedGrade && recommendedGrade !== 'M20' && ['M15', 'M20', 'M25', 'M30'].includes(recommendedGrade)) {
        finalEstimate = generateFullEstimate(lengthM, widthM, userSpecs.floors, userSpecs.wallType, recommendedGrade);
      }

      setAnalysis(aiAnalysis);
      setEstimate(finalEstimate);
      setPhase(PHASES.RESULTS);

      // Generate AI image in background
      setBlueprintImage(null);
      generateBlueprintImage(userSpecs, aiAnalysis)
        .then(img => { if (img) setBlueprintImage(img); })
        .catch(err => console.warn('Image generation skipped:', err.message));
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Analysis failed. Please try again.');
      setPhase(PHASES.SPECS);
    }
  };

  const handleRefine = async (feedback) => {
    try {
      const refinedData = await refineBlueprint(analysis, feedback, specs);
      setAnalysis(refinedData);

      generateBlueprintImage(specs, refinedData)
        .then(img => { if (img) setBlueprintImage(img); })
        .catch(err => console.warn('Refined image generation failed'));

      return refinedData;
    } catch (err) {
      console.error('Refinement failed:', err);
      alert('Could not update blueprint. ' + err.message);
      throw err;
    }
  };

  const handleNewProject = () => {
    setPhotos({});
    setSpecs(null);
    setAnalysis(null);
    setEstimate(null);
    setBlueprintImage(null);
    setError(null);
    setSiteLocation(null);
    setPhase(PHASES.MAP_SELECT);
  };

  const getCurrentStepNum = () => {
    switch (phase) {
      case PHASES.MAP_SELECT: return 1;
      case PHASES.UPLOAD: return 2;
      case PHASES.SPECS: return 3;
      case PHASES.VALIDATING:
      case PHASES.ANALYZING:
      case PHASES.RESULTS: return 4;
      default: return 0;
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setShowAuth(false);
    setShowAdmin(false);
    setPhase(PHASES.WELCOME);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await apiLogout();
    setUser(null);
    setShowAdmin(false);
    setPhase(PHASES.WELCOME);
  };

  // Show admin dashboard if requested
  if (showAdmin && user?.isAdmin) {
    return (
      <>
        <InstallPwa />
        <Header
          apiKey={apiKey}
          user={user}
          onLogout={handleLogout}
          onAdminPanel={() => setShowAdmin(true)}
          onLoginClick={() => setShowAuth(true)}
          onHomeClick={handleGoHome}
          onGetStarted={handleGetStartedNav}
        />
        <AdminDashboard onBack={() => setShowAdmin(false)} />
      </>
    );
  }

  // Show auth form if requested
  if (showAuth) {
    return (
      <>
        <InstallPwa />
        <Header
          apiKey={apiKey}
          user={user}
          onLogout={handleLogout}
          onAdminPanel={() => setShowAdmin(true)}
          onLoginClick={() => setShowAuth(true)}
          onHomeClick={handleGoHome}
          onGetStarted={handleGetStartedNav}
        />
        <Auth onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <Header
        apiKey={apiKey}
        user={user}
        onLogout={handleLogout}
        onAdminPanel={() => setShowAdmin(true)}
        onLoginClick={() => setShowAuth(true)}
        onHomeClick={handleGoHome}
        onGetStarted={handleGetStartedNav}
      />

      <InstallPwa />

      <main className="app-main">

      {showApiModal && (
        <ApiKeyModal onKeySet={handleApiKeySet} />
      )}

      {phase === PHASES.WELCOME && (
        <div className="welcome-container">
          <div className="welcome-hero">
            <div className="welcome-hero-grid">
              <div className="welcome-hero-copy">
                <div className="welcome-badge">⚡ AI-Powered Engineering</div>
                <h1 className="welcome-title">
                  Build Anything, <em>Know Everything</em>
                </h1>
                <p className="welcome-subtitle">
                  Upload site photos, map your location, and get a complete engineering blueprint
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
                    <span>Cost Estimates</span>
                  </div>
                </div>

                <div className="welcome-cta">
                  <button className="btn btn-primary btn-large" onClick={handleGetStarted}>
                    Get Started
                  </button>
                </div>
              </div>

              <div className="welcome-hero-visual" aria-hidden="true">
                <div className="welcome-visual-card welcome-visual-card--1">
                  <span>📐</span>
                  <strong>Foundation Specs</strong>
                  <p>Depth, width & reinforcement</p>
                </div>
                <div className="welcome-visual-card welcome-visual-card--2">
                  <span>🧪</span>
                  <strong>Mix Design</strong>
                  <p>M15 – M30 concrete ratios</p>
                </div>
                <div className="welcome-visual-card welcome-visual-card--3">
                  <span>💰</span>
                  <strong>Cost Breakdown</strong>
                  <p>Materials & market rates</p>
                </div>
              </div>
            </div>
          </div>

          <div className="welcome-features">
            <div className="glass-card feature-card">
              <div className="feature-icon-wrap">📸</div>
              <div className="feature-title">Site Photo Analysis</div>
              <div className="feature-desc">AI reads terrain, soil type, and conditions from photos of all sides.</div>
            </div>
            <div className="glass-card feature-card">
              <div className="feature-icon-wrap">🧪</div>
              <div className="feature-title">Concrete Mix Design</div>
              <div className="feature-desc">Exact ratios and quantities for M15 to M30 grade concrete.</div>
            </div>
            <div className="glass-card feature-card">
              <div className="feature-icon-wrap">💰</div>
              <div className="feature-title">Detailed Cost Estimate</div>
              <div className="feature-desc">Material-by-material breakdown based on current market prices.</div>
            </div>
            <div className="glass-card feature-card">
              <div className="feature-icon-wrap">📋</div>
              <div className="feature-title">Step-by-Step Guide</div>
              <div className="feature-desc">Beginner-friendly instructions from foundation to finish.</div>
            </div>
          </div>
        </div>
      )}

      {phase === PHASES.MAP_SELECT && (
        <MapSelector
          onLocationConfirm={handleLocationConfirm}
          onBack={() => setPhase(PHASES.WELCOME)}
        />
      )}

      {(phase === PHASES.UPLOAD || phase === PHASES.SPECS) && (
        <div className="wizard-container">
          <div className="wizard-header">
            <div className="wizard-step-indicator">
              <div className={`step-dot ${getCurrentStepNum() >= 1 ? 'active' : ''} ${getCurrentStepNum() > 1 ? 'completed' : ''}`}>1</div>
              <div className={`step-line ${getCurrentStepNum() > 1 ? 'completed' : ''}`}></div>
              <div className={`step-dot ${getCurrentStepNum() >= 2 ? 'active' : ''} ${getCurrentStepNum() > 2 ? 'completed' : ''}`}>2</div>
              <div className={`step-line ${getCurrentStepNum() > 2 ? 'completed' : ''}`}></div>
              <div className={`step-dot ${getCurrentStepNum() >= 3 ? 'active' : ''} ${getCurrentStepNum() > 3 ? 'completed' : ''}`}>3</div>
              <div className={`step-line ${getCurrentStepNum() > 3 ? 'completed' : ''}`}></div>
              <div className={`step-dot ${getCurrentStepNum() >= 4 ? 'active' : ''}`}>4</div>
            </div>
            <h2 className="wizard-title">
              {phase === PHASES.UPLOAD ? '📸 Upload Your Site Photos' : '📐 Enter Building Specs'}
            </h2>
            <p className="wizard-desc">
              {phase === PHASES.UPLOAD
                ? 'Take photos from 3 sides and a close-up of the ground, then upload all 4.'
                : 'Tell us the size and type of building you want to construct.'}
            </p>
          </div>

          {error && (
            <div className="error-container">
              <div className="error-icon">❌</div>
              <div className="error-title">Analysis Failed</div>
              <div className="error-message">{error}</div>
              {error.toLowerCase().includes('key') && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '12px' }}
                  onClick={() => {
                    localStorage.removeItem('buildx_api_key');
                    setApiKey(null);
                    setShowApiModal(true);
                    setError(null);
                  }}
                >
                  🔄 Reset API Key
                </button>
              )}
            </div>
          )}

          {phase === PHASES.UPLOAD && (
            <>
              <PhotoUpload onPhotosUpdate={handlePhotosUpdate} photos={photos} />
              {Object.keys(photos).length === 4 && (
                <div className="wizard-continue-wrap">
                  <button className="btn btn-primary btn-large btn-block-mobile" onClick={() => setPhase(PHASES.SPECS)}>
                    Continue → Enter Specs
                  </button>
                </div>
              )}
            </>
          )}

          {phase === PHASES.SPECS && (
            <SpecForm
              onSubmit={handleSpecsSubmit}
              onBack={() => setPhase(PHASES.UPLOAD)}
            />
          )}
        </div>
      )}

      {phase === PHASES.VALIDATING && (
        <SpecValidator
          specs={specs}
          photos={photos}
          onProceed={handleValidationProceed}
          onBack={() => setPhase(PHASES.SPECS)}
          onCancel={() => setPhase(PHASES.SPECS)}
          validateFn={apiKey ? aiValidateSpecs : null}
        />
      )}

      {phase === PHASES.ANALYZING && <AnalysisLoader />}

      {phase === PHASES.RESULTS && (
        <BlueprintView
          analysis={analysis}
          estimate={estimate}
          specs={specs}
          blueprintImage={blueprintImage}
          siteLocation={siteLocation}
          photos={photos}
          user={user}
          onRequestLogin={() => setShowAuth(true)}
          onNewProject={handleNewProject}
          onRefine={handleRefine}
        />
      )}
      </main>
    </>
  );
}
