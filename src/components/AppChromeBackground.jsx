import { useEffect, useMemo } from 'react';
import LiquidChrome from './LiquidChrome';
import { useTheme } from '../context/ThemeContext';

const CHROME_COLORS = {
  light: [0.94, 0.52, 0.18],
  dark: [0.18, 0.09, 0.04],
};

export default function AppChromeBackground() {
  const { resolvedTheme } = useTheme();
  const chromeColor = useMemo(
    () => CHROME_COLORS[resolvedTheme === 'dark' ? 'dark' : 'light'],
    [resolvedTheme],
  );

  useEffect(() => {
    document.body.classList.add('app-chrome-active');
    return () => document.body.classList.remove('app-chrome-active');
  }, []);

  return (
    <div className="app-chrome-bg" aria-hidden="true">
      <LiquidChrome
        baseColor={chromeColor}
        speed={0.4}
        amplitude={0.32}
        frequencyX={2.6}
        frequencyY={2.0}
        interactive
      />
      <div className="app-chrome-bg-overlay" />
    </div>
  );
}
