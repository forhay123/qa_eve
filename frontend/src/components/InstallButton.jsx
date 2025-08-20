import React, { useEffect, useState } from 'react';

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const isMac = /Mac/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  useEffect(() => {
    // Debug: Log platform detection
    console.log('Platform detection:', { isMac, isAndroid, userAgent: navigator.userAgent });
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      setDebugInfo('App already installed');
      return;
    }

    // Detect install prompt (mostly for Windows/Android)
    const handler = (e) => {
      console.log('beforeinstallprompt fired!', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
      setDebugInfo('Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect if already installed (for most platforms)
    window.addEventListener('appinstalled', () => {
      console.log('App installed!');
      setIsInstalled(true);
      setShowInstall(false);
      setDebugInfo('App installed');
    });

    // For Android, show debug info if no prompt after 3 seconds
    if (isAndroid) {
      setTimeout(() => {
        if (!deferredPrompt && !isInstalled) {
          setDebugInfo('Android: No install prompt - check PWA criteria');
          // Force show for debugging
          setShowInstall(true);
        }
      }, 3000);
    }

    // Detect Safari on iOS/macOS — show manual install suggestion
    if (isMac && !isAndroid) {
      setShowInstall(true);
      setDebugInfo('macOS: Manual install available');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isMac, isAndroid, deferredPrompt, isInstalled]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice) => {
        console.log('Install choice:', choice);
        if (choice.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setShowInstall(false);
      });
    } else if (isMac) {
      alert(
        'To install this app:\n\n1. Open Chrome menu (⋮ or top bar)\n2. Select "More Tools" → "Create Shortcut…"\n3. Enable "Open as window" and click Create'
      );
    } else if (isAndroid) {
      alert(
        'To install this app on Android:\n\n1. Open Chrome menu (⋮)\n2. Tap "Add to Home screen" or "Install app"\n\nIf not available, the app may not meet PWA requirements.'
      );
    }
  };

  if (!showInstall || isInstalled) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        Debug: {debugInfo || 'Install not available'}
      </div>
    );
  }

  return (
    <div className="text-center my-4">
      <button
        onClick={handleInstallClick}
        className="
          px-4 py-2 text-sm md:text-base font-semibold
          bg-red-600 text-white
          hover:bg-red-700
          transition-colors duration-200
          rounded-lg
          focus:outline-none focus:ring-2 focus:ring-red-500
          dark:bg-red-700 dark:hover:bg-red-800
        "
      >
        📥 Install App
      </button>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Debug: {debugInfo}
      </div>
    </div>
  );
};

export default InstallButton;