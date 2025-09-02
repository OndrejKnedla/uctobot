import Layout from '@/components/layout/Layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ochrana osobních údajů | DokladBot',
  description: 'Zásady ochrany osobních údajů služby DokladBot - jak zpracováváme vaše data v souladu s GDPR',
};

export default function OchranaOsobnichUdajuPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl shadow-sm border p-8 md:p-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 text-gray-900">Ochrana osobních údajů</h1>
              <p className="text-xl text-gray-600">
                Jak zpracováváme vaše osobní údaje v souladu s GDPR
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Platné od 1. ledna 2025
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <h2>1. Správce osobních údajů</h2>
              <p>
                Správcem vašich osobních údajů je:<br />
                <strong>REALOK s.r.o.</strong><br />
                IČO: 22161104<br />
                Sídlo: [Adresa]<br />
                Email: info@dokladbot.cz<br />
                Telefon: +420 722 158 002
              </p>

              <h2>2. Jaké osobní údaje zpracováváme</h2>
              
              <h3>2.1 Identifikační údaje</h3>
              <ul>
                <li>Jméno a příjmení</li>
                <li>Email</li>
                <li>Telefonní číslo (WhatsApp)</li>
                <li>IČO, DIČ (pro vystavení faktury)</li>
              </ul>

              <h3>2.2 Účetní doklady</h3>
              <ul>
                <li>Fotografie účetních dokladů (faktury, účtenky)</li>
                <li>Metadata dokumentů (datum, částka, dodavatel)</li>
                <li>Kategorizace výdajů</li>
              </ul>

              <h3>2.3 Technické údaje</h3>
              <ul>
                <li>IP adresa</li>
                <li>Informace o prohlížeči</li>
                <li>Cookies a podobné technologie</li>
                <li>Logy přístupu k službě</li>
              </ul>

              <h2>3. Účel zpracování osobních údajů</h2>
              
              <h3>3.1 Poskytování služby DokladBot</h3>
              <p><strong>Právní základ:</strong> Plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR)</p>
              <ul>
                <li>Zpracování účetních dokladů</li>
                <li>Export dat do účetních systémů</li>
                <li>Archivace dokumentů</li>
                <li>Zasílání připomínek a notifikací</li>
              </ul>

              <h3>3.2 Fakturace a účetnictví</h3>
              <p><strong>Právní základ:</strong> Právní povinnost (čl. 6 odst. 1 písm. c) GDPR)</p>
              <ul>
                <li>Vystavování faktur</li>
                <li>Vedení účetnictví</li>
                <li>Splnění daňových povinností</li>
              </ul>

              <h3>3.3 Newsletter a marketing</h3>
              <p><strong>Právní základ:</strong> Souhlas (čl. 6 odst. 1 písm. a) GDPR)</p>
              <ul>
                <li>Zasílání newsletteru</li>
                <li>Informace o novinkách</li>
                <li>Marketingová sdělení (pouze se souhlasem)</li>
              </ul>

              <h2>4. Doba uchovávání údajů</h2>
              
              <table className="w-full border-collapse border border-gray-300 mb-6">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Typ údajů</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Doba uchovávání</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Účetní doklady</td>
                    <td className="border border-gray-300 px-4 py-2">5 let (dle zákona o účetnictví)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Faktury a účetnictví</td>
                    <td className="border border-gray-300 px-4 py-2">10 let (daňové předpisy)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Newsletter</td>
                    <td className="border border-gray-300 px-4 py-2">Do odvolání souhlasu</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Logy a metadata</td>
                    <td className="border border-gray-300 px-4 py-2">12 měsíců</td>
                  </tr>
                </tbody>
              </table>

              <h2>5. Předávání údajů třetím stranám</h2>
              
              <h3>5.1 Zpracovatelé</h3>
              <p>Vaše osobní údaje předáváme pouze těmto ověřeným zpracovatelům:</p>
              <ul>
                <li><strong>Meta/WhatsApp</strong> - pro komunikaci přes WhatsApp API</li>
                <li><strong>Stripe</strong> - pro zpracování plateb</li>
                <li><strong>Resend</strong> - pro odesílání emailů</li>
                <li><strong>Vercel</strong> - pro hosting aplikace</li>
                <li><strong>Google</strong> - pro OCR rozpoznávání textu</li>
              </ul>

              <h3>5.2 Třetí země</h3>
              <p>
                Někteří naši zpracovatelé mohou zpracovávat data ve třetích zemích 
                (USA). Přenos je chráněn odpovídajícími zárukami (Standard Contractual Clauses).
              </p>

              <h2>6. Bezpečnost údajů</h2>
              
              <h3>6.1 Technická opatření</h3>
              <ul>
                <li>Šifrování dat při přenosu (HTTPS/TLS)</li>
                <li>Šifrování dat při ukládání</li>
                <li>Pravidelné bezpečnostní audity</li>
                <li>Omezený přístup k datům</li>
                <li>Monitorování bezpečnostních incidentů</li>
              </ul>

              <h3>6.2 Organizační opatření</h3>
              <ul>
                <li>Školení zaměstnanců v oblasti ochrany dat</li>
                <li>Interní bezpečnostní postupy</li>
                <li>Pravidelné zálohování dat</li>
              </ul>

              <h2>7. Vaše práva</h2>
              
              <h3>7.1 Právo na informace</h3>
              <p>Máte právo získat informace o zpracování svých osobních údajů.</p>

              <h3>7.2 Právo na opravu</h3>
              <p>Máte právo požádat o opravu nepřesných osobních údajů.</p>

              <h3>7.3 Právo na výmaz ("právo být zapomenut")</h3>
              <p>Máte právo požádat o vymazání svých osobních údajů, pokud:</p>
              <ul>
                <li>Údaje již nejsou potřebné pro původní účel</li>
                <li>Odvoláte souhlas a není jiný právní základ</li>
                <li>Údaje byly zpracovávány protiprávně</li>
              </ul>

              <h3>7.4 Právo na omezení zpracování</h3>
              <p>Můžete požádat o omezení zpracování v určitých případech.</p>

              <h3>7.5 Právo na přenositelnost údajů</h3>
              <p>Máte právo získat své údaje ve strukturovaném, běžně používaném formátu.</p>

              <h3>7.6 Právo vznést námitku</h3>
              <p>Můžete vznést námitku proti zpracování údajů pro účely přímého marketingu.</p>

              <h2>8. Cookies a podobné technologie</h2>
              
              <h3>8.1 Typy cookies</h3>
              <ul>
                <li><strong>Nezbytné cookies</strong> - pro fungování webu</li>
                <li><strong>Analytické cookies</strong> - pro zlepšení služby</li>
                <li><strong>Marketingové cookies</strong> - pouze se souhlasem</li>
              </ul>

              <h3>8.2 Správa cookies</h3>
              <p>
                Cookies můžete spravovat v nastavení vašeho prohlížeče. 
                Vypnutím cookies může být omezena funkcionalita webu.
              </p>

              <h2>9. Kontakt a stížnosti</h2>
              
              <h3>9.1 Kontakt pro ochranu údajů</h3>
              <p>
                <strong>Email:</strong> privacy@dokladbot.cz<br />
                <strong>Telefon:</strong> +420 722 158 002<br />
                <strong>Adresa:</strong> [Adresa společnosti]
              </p>

              <h3>9.2 Právo podat stížnost</h3>
              <p>
                Máte právo podat stížnost u dozorového úřadu:<br />
                <strong>Úřad pro ochranu osobních údajů</strong><br />
                Pplk. Sochora 27, 170 00 Praha 7<br />
                Tel.: +420 234 665 111<br />
                <a href="https://www.uoou.cz" className="text-green-600 hover:underline">www.uoou.cz</a>
              </p>

              <h2>10. Změny těchto zásad</h2>
              <p>
                Tyto zásady můžeme aktualizovat. O významných změnách vás budeme 
                informovat emailem nebo prostřednictvím našich služeb.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold mb-4 text-green-800">🛡️ Vaše data jsou v bezpečí</h3>
                <p className="text-green-700">
                  Používáme nejmodernější bezpečnostní technologie a postupy pro ochranu vašich dat. 
                  Máte plnou kontrolu nad svými údaji a můžete je kdykoliv upravit nebo smazat.
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