import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function NewsletterConfirmPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token;

  // If no token, show error page
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
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
            <a 
              href="/blog" 
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
            >
              Návrat na blog
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to API endpoint for confirmation
  redirect(`/api/newsletter?action=confirm&token=${token}`);
}