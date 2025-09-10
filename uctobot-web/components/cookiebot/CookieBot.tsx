"use client";

import { useEffect } from 'react';

interface CookieBotProps {
  domainGroupId?: string;
}

export default function CookieBot({ domainGroupId }: CookieBotProps) {
  useEffect(() => {
    // Only load CookieBot if we have a domain group ID
    if (!domainGroupId) {
      console.warn('CookieBot: No domain group ID provided');
      return;
    }

    // Check if CookieBot script is already loaded
    if (document.getElementById('cookiebot-script')) {
      return;
    }

    // Create and load CookieBot script
    const script = document.createElement('script');
    script.id = 'cookiebot-script';
    script.src = 'https://consent.cookiebot.com/uc.js';
    script.setAttribute('data-cbid', domainGroupId);
    script.setAttribute('data-blockingmode', 'auto');
    script.type = 'text/javascript';
    
    // Add script to head
    document.head.appendChild(script);

    return () => {
      // Cleanup function to remove script if component unmounts
      const existingScript = document.getElementById('cookiebot-script');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [domainGroupId]);

  // Don't render anything - this component only loads the script
  return null;
}

// Server-side CookieBot script component for better SEO
export function CookieBotScript({ domainGroupId }: CookieBotProps) {
  if (!domainGroupId) {
    return null;
  }

  return (
    <>
      <script 
        id="Cookiebot" 
        src="https://consent.cookiebot.com/uc.js" 
        data-cbid={domainGroupId} 
        data-blockingmode="auto" 
        type="text/javascript"
      />
    </>
  );
}

// Cookie declaration component
export function CookieDeclaration({ domainGroupId }: CookieBotProps) {
  if (!domainGroupId) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">
          CookieBot není nakonfigurován. Prosím nastavte Domain Group ID.
        </p>
      </div>
    );
  }

  return (
    <div 
      id="CookieDeclaration" 
      data-culture="CS"
      data-cbid={domainGroupId}
    />
  );
}