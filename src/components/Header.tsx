'use client';

import React, { useEffect, useState } from 'react';

interface HeaderProps {
  apiaryName: string;
  location: string;
}

export default function Header({ apiaryName, location }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Initialize with current theme
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isCurrentlyDark);

    // Listen for changes to the theme
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const newIsDark = document.documentElement.classList.contains('dark');
          setIsDarkMode(newIsDark);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDarkMode;
    
    // Update the HTML element class
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setIsDarkMode(newIsDark);
    
    // Store preference in localStorage
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <header className="bg-gradient-to-r from-amber-600 to-yellow-500 dark:from-amber-800 dark:to-amber-600 text-white p-3 md:p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center">
            <svg 
              className="w-5 h-5 md:w-6 md:h-6 mr-2" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12,22c-0.3,0-0.5-0.1-0.7-0.3l-9-9c-0.4-0.4-0.4-1,0-1.4l9-9c0.4-0.4,1-0.4,1.4,0l9,9c0.4,0.4,0.4,1,0,1.4l-9,9 C12.5,21.9,12.3,22,12,22z M4.8,12L12,19.2L19.2,12L12,4.8L4.8,12z" />
              <path d="M12,13c-1.7,0-3-1.3-3-3s1.3-3,3-3s3,1.3,3,3S13.7,13,12,13z M12,9c-0.6,0-1,0.4-1,1s0.4,1,1,1s1-0.4,1-1S12.6,9,12,9z" />
            </svg>
            {apiaryName}
          </h1>
          <p className="text-sm md:text-base text-white/80">{location}</p>
        </div>
        <div className="flex items-center">
          <div className="hidden md:block mr-4">
            <p className="text-sm">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          <div className="block md:hidden">
            <p className="text-xs">{new Date().toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}</p>
          </div>
          
          {/* Theme toggle button */}
          <button 
            onClick={toggleTheme}
            className="ml-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
} 