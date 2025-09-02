import Layout from '@/components/layout/Layout';
import { CookieDeclaration } from '@/components/cookiebot/CookieBot';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookies | DokladBot',
  description: 'Informace o používání cookies na webu DokladBot',
};

export default function CookiesPage() {
  const cookiebotId = process.env.NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID;
  
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl shadow-sm border p-8 md:p-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-4 text-gray-900">Používání cookies</h1>
              <p className="text-xl text-gray-600">
                Jak používáme cookies na našem webu
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <h2>Co jsou cookies</h2>
              <p>
                Cookies jsou malé textové soubory, které si webová stránka ukládá do vašeho prohlížeče. 
                Pomáhají nám poskytovat lepší uživatelský zážitek a analyzovat, jak náš web používáte.
              </p>

              <h2>Jaké cookies používáme</h2>
              
              <h3>🔧 Nezbytné cookies</h3>
              <p>
                Tyto cookies jsou nezbytné pro základní fungování webu a nelze je vypnout. 
                Obvykle se nastavují pouze v reakci na akce, které odpovídají žádosti o služby.
              </p>
              <ul>
                <li><strong>Autentifikace</strong> - udržení přihlášení</li>
                <li><strong>Bezpečnost</strong> - ochrana před útoky</li>
                <li><strong>Nastavení</strong> - uložení preferencí</li>
              </ul>

              <h3>📊 Analytické cookies</h3>
              <p>
                Tyto cookies nám umožňují počítat návštěvy a zdroje návštěvnosti, 
                abychom mohli měřit a zlepšovat výkon našeho webu.
              </p>
              <ul>
                <li><strong>Google Analytics</strong> - anonymizovaná statistika návštěvnosti</li>
                <li><strong>Vercel Analytics</strong> - výkonnostní metriky</li>
              </ul>

              <h3>🎯 Marketingové cookies</h3>
              <p>
                Tyto cookies se používají k zobrazování relevantních reklam. 
                Používáme je pouze s vaším souhlasem.
              </p>
              <ul>
                <li><strong>Facebook Pixel</strong> - remarketing (pouze se souhlasem)</li>
                <li><strong>Google Ads</strong> - konverzní tracking (pouze se souhlasem)</li>
              </ul>

              <h2>Správa cookies</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">⚙️ Nastavení v prohlížeči</h3>
                <p className="mb-4">
                  Cookies můžete spravovat v nastavení svého prohlížeče:
                </p>
                <ul className="space-y-2">
                  <li><strong>Chrome:</strong> Nastavení → Soukromí a zabezpečení → Cookies a další data webu</li>
                  <li><strong>Firefox:</strong> Možnosti → Soukromí a zabezpečení → Cookies a data stránek</li>
                  <li><strong>Safari:</strong> Safari → Předvolby → Soukromí → Cookies a data webových stránek</li>
                  <li><strong>Edge:</strong> Nastavení → Cookies a oprávnění webu → Cookies a uložená data</li>
                </ul>
              </div>

              <h2>Doba platnosti cookies</h2>
              
              <table className="w-full border-collapse border border-gray-300 mb-6">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Typ cookie</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Doba platnosti</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Relační cookies</td>
                    <td className="border border-gray-300 px-4 py-2">Do zavření prohlížeče</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Trvalé cookies</td>
                    <td className="border border-gray-300 px-4 py-2">1-24 měsíců</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Analytické cookies</td>
                    <td className="border border-gray-300 px-4 py-2">24 měsíců</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Marketingové cookies</td>
                    <td className="border border-gray-300 px-4 py-2">90 dní</td>
                  </tr>
                </tbody>
              </table>

              <h2>Třetí strany</h2>
              <p>
                Na našem webu používáme služby třetích stran, které mohou nastavovat vlastní cookies:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 not-prose mb-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">🌐 Google Analytics</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Poskytuje anonymizované statistiky návštěvnosti
                  </p>
                  <a 
                    href="https://policies.google.com/privacy" 
                    target="_blank" 
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Zásady ochrany soukromí Google
                  </a>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">💳 Stripe</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Zpracování plateb a prevence podvodů
                  </p>
                  <a 
                    href="https://stripe.com/privacy" 
                    target="_blank" 
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Zásady ochrany soukromí Stripe
                  </a>
                </div>
              </div>

              <h2>Vaše volba</h2>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4 text-green-800">✅ Souhlas s cookies</h3>
                <p className="text-green-700 mb-4">
                  Používáním našeho webu souhlasíte s používáním nezbytných cookies. 
                  Pro analytické a marketingové cookies požadujeme váš výslovný souhlas.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
                    ✅ Přijmout všechny cookies
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
                    ⚙️ Upravit nastavení
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm">
                    ❌ Odmítnout nepovinné
                  </button>
                </div>
              </div>

              <h2>Odvolání souhlasu</h2>
              <p>
                Svůj souhlas s používáním cookies můžete kdykoliv odvolat:
              </p>
              <ul>
                <li>Změnou nastavení v prohlížeči</li>
                <li>Vymazáním cookies pro naši doménu</li>
                <li>Kontaktováním nás na privacy@dokladbot.cz</li>
              </ul>

              <h2>Kontakt</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="mb-2">
                  Máte otázky ohledně cookies? Kontaktujte nás:
                </p>
                <p>
                  <strong>Email:</strong> privacy@dokladbot.cz<br />
                  <strong>Telefon:</strong> +420 722 158 002<br />
                  <strong>Adresa:</strong> REALOK s.r.o., IČO: 22161104
                </p>
              </div>

              <h2>Detailní přehled cookies</h2>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <CookieDeclaration domainGroupId={cookiebotId} />
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-sm text-gray-500 mb-4">
                Poslední aktualizace: 1. ledna 2025
              </p>
              <a
                href="javascript:history.back()"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
              >
                ← Zpět
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}