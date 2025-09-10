"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewsletterSectionProps {
  className?: string;
}

export default function NewsletterSection({ className = '' }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Prosím zadejte váš email');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setMessage('Prosím zadejte platný email');
      return;
    }

    setLoading(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('✅ Úspěšně přihlášen! Zkontrolujte email pro potvrzení.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Chyba při přihlašování k newsletteru');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Nastala chyba. Zkuste to prosím později.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden ${className}`}>
      {/* Background decorative elements */}
      <div className="absolute top-4 right-4 text-green-300/40">
        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      </div>
      
      <div className="absolute bottom-4 left-4 text-green-300/30">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5v-5zM4 4h6v12H4zM14 4h6v8h-6z" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
          📧 Novinky pro podnikatele
        </h2>
        
        <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          Posíláme <strong>praktické tipy pro podnikatele</strong> maximálně 1x měsíčně. 
          Bez spamu, pouze užitečný obsah o účetnictví, daních a digitalizaci.
        </p>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 text-sm">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Daňové změny
          </div>
          <div className="flex items-center justify-center gap-2 text-green-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Tipy na úsporu
          </div>
          <div className="flex items-center justify-center gap-2 text-green-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Nové funkce
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vas@email.cz"
              className="flex-1 px-4 py-3 text-center sm:text-left rounded-lg border-2 border-green-200 focus:border-green-500 focus:ring-green-200 text-base"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-base"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Přihlašuji...
                </div>
              ) : (
                'Přihlásit se'
              )}
            </Button>
          </div>
        </form>

        {/* Status message */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg text-sm font-medium flex items-start gap-3 ${
            status === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="flex-shrink-0">
              {status === 'success' ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              {message}
              {status === 'success' && (
                <div className="mt-2 text-xs opacity-80">
                  📧 Potvrzovací email byl odeslán na vaši adresu
                </div>
              )}
            </div>
            <button
              onClick={() => setMessage('')}
              className="flex-shrink-0 text-current hover:opacity-70"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* GDPR note */}
        <p className="mt-6 text-sm text-gray-600">
          Vaše data jsou v bezpečí. Můžete se kdykoli odhlásit jedním kliknutím.
        </p>
      </div>
    </div>
  );
}