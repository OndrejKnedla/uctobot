'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewsletterConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-confirmed'>('loading');
  const [email, setEmail] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    // Redirect to API endpoint to handle confirmation
    window.location.href = `/api/newsletter?action=confirm&token=${token}`;
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto h-16 w-16 text-green-500 mb-4">
                <div className="animate-spin h-16 w-16 border-4 border-green-500 border-t-transparent rounded-full"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Zpracovává se potvrzení...
              </h2>
              <p className="text-gray-600">
                Prosím čekejte, potvrzujeme váš odběr newsletteru.
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto h-16 w-16 text-red-500 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Neplatný odkaz
              </h2>
              <p className="text-gray-600 mb-6">
                Tento odkaz není platný nebo již vypršel.
              </p>
              <Link 
                href="/blog" 
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
              >
                Návrat na blog
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}