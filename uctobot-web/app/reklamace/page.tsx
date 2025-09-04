import Layout from '@/components/layout/Layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reklamace | DokladBot',
  description: 'Jak podat reklamaci služby DokladBot - postup a podmínky',
};

export default function ReklamacePage() {
  return (
    <Layout showMainPageSections={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl shadow-sm border p-8 md:p-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-4 text-gray-900">Reklamace</h1>
              <p className="text-xl text-gray-600">
                Jak podat reklamaci našich služeb
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-8">
                Vaše spokojenost je pro nás priorita. Pokud nejste spokojeni s naší službou 
                nebo máte jakýkoliv problém, rádi vám pomůžeme situaci vyřešit.
              </p>

              <h2>Rychlé řešení problémů</h2>
              
              <div className="grid md:grid-cols-2 gap-6 not-prose mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-xl font-bold text-green-800">WhatsApp podpora</h3>
                  </div>
                  <p className="text-green-700 mb-4">
                    Nejrychlejší způsob řešení problémů přímo v aplikaci
                  </p>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium w-full">
                    💬 Napsat na WhatsApp
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-bold text-blue-800">Email podpora</h3>
                  </div>
                  <p className="text-blue-700 mb-4">
                    Pro složitější problémy a oficiální reklamace
                  </p>
                  <a 
                    href="mailto:info@dokladbot.cz"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium w-full inline-block text-center"
                  >
                    📧 info@dokladbot.cz
                  </a>
                </div>
              </div>

              <h2>Postup reklamace</h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">📝 Jak podat reklamaci</h3>
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    <strong>Popište problém</strong> - co se stalo a kdy
                  </li>
                  <li>
                    <strong>Přiložte důkazy</strong> - screenshoty, fotky dokladů
                  </li>
                  <li>
                    <strong>Uveďte své údaje</strong> - email, telefonní číslo
                  </li>
                  <li>
                    <strong>Napište nám</strong> - na info@dokladbot.cz nebo WhatsApp
                  </li>
                  <li>
                    <strong>Dostanete odpověď</strong> - do 24 hodin v pracovní dny
                  </li>
                </ol>
              </div>

              <h2>Nejčastější problémy a řešení</h2>
              
              <h3>🤖 Problém s rozpoznáním dokladu</h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="mb-2"><strong>Problém:</strong> AI špatně rozpoznala údaje z dokladu</p>
                <p className="mb-2"><strong>Řešení:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Pošleme vám opravený doklad do 1 hodiny</li>
                  <li>Vylepšíme AI pro budoucí podobné doklady</li>
                  <li>Při opakovaných problémech prodloužíme předplatné</li>
                </ul>
              </div>

              <h3>💳 Problém s platbou</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="mb-2"><strong>Problém:</strong> Nesprávně stržená platba nebo dvojí účtování</p>
                <p className="mb-2"><strong>Řešení:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Okamžité vrácení nesprávně stržených částek</li>
                  <li>Kontrola a oprava fakturace</li>
                  <li>Bonus za způsobené nepříjemnosti</li>
                </ul>
              </div>

              <h3>📱 Technický problém</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="mb-2"><strong>Problém:</strong> Aplikace nefunguje nebo dochází k chybám</p>
                <p className="mb-2"><strong>Řešení:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Okamžité řešení problému našimi vývojáři</li>
                  <li>Dočasné alternativní řešení</li>
                  <li>Kompenzace za výpadek služby</li>
                </ul>
              </div>

              <h2>Lhůty a podmínky</h2>
              
              <table className="w-full border-collapse border border-gray-300 mb-6">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Typ problému</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Doba reakce</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Doba vyřešení</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Kritická chyba</td>
                    <td className="border border-gray-300 px-4 py-2">1 hodina</td>
                    <td className="border border-gray-300 px-4 py-2">4 hodiny</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Chyba rozpoznání</td>
                    <td className="border border-gray-300 px-4 py-2">2 hodiny</td>
                    <td className="border border-gray-300 px-4 py-2">1 pracovní den</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Platební problém</td>
                    <td className="border border-gray-300 px-4 py-2">4 hodiny</td>
                    <td className="border border-gray-300 px-4 py-2">2 pracovní dny</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Obecný dotaz</td>
                    <td className="border border-gray-300 px-4 py-2">24 hodin</td>
                    <td className="border border-gray-300 px-4 py-2">3 pracovní dny</td>
                  </tr>
                </tbody>
              </table>

              <h2>Práva zákazníka</h2>
              <p>
                Jako zákazník máte podle zákona o ochraně spotřebitele následující práva:
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4 text-green-800">✅ Vaše práva</h3>
                <ul className="space-y-2 text-green-700">
                  <li>🔄 <strong>Právo na reklamaci</strong> - 24 měsíců na vady služby</li>
                  <li>↩️ <strong>Právo na odstoupení</strong> - 14 dní od uzavření smlouvy</li>
                  <li>💰 <strong>Právo na vrácení peněz</strong> - při oprávněné reklamaci</li>
                  <li>🛠️ <strong>Právo na nápravu</strong> - bezplatné odstranění problému</li>
                  <li>📋 <strong>Právo na informace</strong> - o průběhu reklamace</li>
                </ul>
              </div>

              <h2>Mimosoudní řešení sporů</h2>
              <p>
                Pokud se nám nepodaří najít uspokojivé řešení, můžete využít:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 not-prose mb-8">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">🏛️ Česká obchodní inspekce</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Pro spotřebitelské spory
                  </p>
                  <a 
                    href="https://www.coi.cz" 
                    target="_blank" 
                    className="text-blue-600 hover:underline text-sm"
                  >
                    www.coi.cz
                  </a>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">🇪🇺 ODR platforma EU</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Online řešení sporů
                  </p>
                  <a 
                    href="https://ec.europa.eu/consumers/odr/" 
                    target="_blank" 
                    className="text-blue-600 hover:underline text-sm"
                  >
                    ODR platforma
                  </a>
                </div>
              </div>

              <h2>Formulář pro reklamaci</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">📝 Údaje pro reklamaci</h3>
                <p className="text-blue-700 mb-4">
                  Při podávání reklamace uveďte tyto informace:
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-blue-700">
                  <div>
                    <ul className="space-y-1 text-sm">
                      <li>• Jméno a příjmení</li>
                      <li>• Email a telefon</li>
                      <li>• Číslo objednávky/faktury</li>
                      <li>• Datum vzniku problému</li>
                    </ul>
                  </div>
                  <div>
                    <ul className="space-y-1 text-sm">
                      <li>• Popis problému</li>
                      <li>• Způsob řešení (pokud máte)</li>
                      <li>• Screenshoty/důkazy</li>
                      <li>• Preferovaný způsob kontaktu</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold mb-4 text-green-800">💚 Náš příslib</h3>
                <p className="text-green-700">
                  Zavazujeme se řešit každý problém fair a rychle. Vaše spokojenost je 
                  pro nás důležitější než krátkodobý zisk. Pokud uděláme chybu, napravíme ji.
                </p>
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