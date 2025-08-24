'use client';

import { useEffect, useState } from 'react';

export function FoundingMembersCounter() {
  const [count, setCount] = useState(27);
  const MAX_MEMBERS = 100;
  
  useEffect(() => {
    // Simulace postupného nárůstu (později napojit na API)
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev < MAX_MEMBERS && Math.random() > 0.95) {
          return prev + 1;
        }
        return prev;
      });
    }, 30000); // Každých 30 sekund šance na +1
    
    return () => clearInterval(interval);
  }, []);
  
  const percentage = (count / MAX_MEMBERS) * 100;
  
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg p-6 my-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">
          🚀 Staňte se Founding Member
        </h3>
        
        <div className="text-3xl font-bold text-green-600 mb-2">
          {count} ze 100
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Zbývá pouze {MAX_MEMBERS - count} míst
        </p>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-left">
          <p className="font-semibold mb-2">Výhody Founding Members:</p>
          <ul className="text-sm space-y-1">
            <li>✅ Cena 299 Kč navždy (nikdy nezdraží)</li>
            <li>✅ Prioritní WhatsApp support</li>
            <li>✅ Hlasování o nových funkcích</li>
            <li>✅ Founding Member badge</li>
          </ul>
        </div>
        
        {count > 70 && (
          <div className="mt-4 text-orange-600 font-semibold animate-pulse">
            ⚠️ Pouze {MAX_MEMBERS - count} míst zbývá!
          </div>
        )}
      </div>
    </div>
  );
}