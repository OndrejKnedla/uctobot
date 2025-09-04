import Layout from '@/components/layout/Layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Obchodní podmínky | DokladBot',
  description: 'Obchodní podmínky služby DokladBot - účetnictví přes WhatsApp',
};

export default function ObchodniPodminkyPage() {
  return (
    <Layout >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl shadow-sm border p-8 md:p-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 text-gray-900">Obchodní podmínky</h1>
              <p className="text-xl text-gray-600">
                Platné od 1. ledna 2025
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <h2>1. Základní ustanovení</h2>
              <h3>1.1 Poskytovatel služby</h3>
              <p>
                <strong>DokladBot</strong> je služba poskytovaná společností:<br />
                <strong>REALOK s.r.o.</strong><br />
                IČO: 22161104<br />
                Sídlo: [Adresa]<br />
                Email: info@dokladbot.cz
              </p>

              <h3>1.2 Předmět podnikání</h3>
              <p>
                DokladBot poskytuje služby digitalizace a zpracování účetních dokladů pomocí 
                umělé inteligence prostřednictvím WhatsApp aplikace.
              </p>

              <h2>2. Služby</h2>
              <h3>2.1 Popis služeb</h3>
              <ul>
                <li>Automatické rozpoznání textu z fotografií účetních dokladů</li>
                <li>Kategorizace a třídění dokladů</li>
                <li>Export dat do účetních systémů</li>
                <li>Archivace dokladů v digitální podobě</li>
                <li>Připomínky a notifikace</li>
              </ul>

              <h3>2.2 Dostupnost služby</h3>
              <p>
                Služba je dostupná 24/7 s výjimkou plánovaných údržbových prací. 
                O plánovaných odstávkách budeme uživatele informovat předem.
              </p>

              <h2>3. Registrace a přístup</h2>
              <h3>3.1 Vytvoření účtu</h3>
              <p>
                Pro využívání služby je nutné si vytvořit uživatelský účet prostřednictvím 
                našeho webu a aktivovat službu na WhatsApp čísle.
              </p>

              <h3>3.2 Bezpečnost účtu</h3>
              <p>
                Uživatel je odpovědný za zabezpečení svého WhatsApp účtu a nesmí sdílet 
                přístupové údaje s třetími stranami.
              </p>

              <h2>4. Ceny a platby</h2>
              <h3>4.1 Ceník</h3>
              <ul>
                <li><strong>Měsíční tarif:</strong> 199 Kč/měsíc bez DPH</li>
                <li><strong>Roční tarif:</strong> 1 990 Kč/rok bez DPH (úspora 2 měsíce)</li>
              </ul>

              <h3>4.2 Platební podmínky</h3>
              <ul>
                <li>Platby jsou prováděny prostřednictvím Stripe</li>
                <li>U měsíčního tarifu se platba strhává automaticky každý měsíc</li>
                <li>U ročního tarifu se platba strhává jednou ročně</li>
                <li>První 7 dní je služba zdarma (zkušební období)</li>
              </ul>

              <h3>4.3 Změna cen</h3>
              <p>
                Zakladatelským členům garantujeme zachování ceny po celou dobu používání služby. 
                U ostatních uživatelů si vyhrazujeme právo změnit ceny s 30denním předstihem.
              </p>

              <h2>5. Výpověď a ukončení služby</h2>
              <h3>5.1 Výpověď ze strany uživatele</h3>
              <p>
                Uživatel může službu kdykoliv zrušit bez výpovědní doby prostřednictvím 
                zákaznického portálu nebo emailem na info@dokladbot.cz.
              </p>

              <h3>5.2 Výpověď ze strany poskytovatele</h3>
              <p>
                Poskytovatel může ukončit službu při porušení těchto podmínek s 30denní výpovědní dobou.
              </p>

              <h3>5.3 Vrácení plateb</h3>
              <p>
                Při zrušení služby během zkušebního období (7 dní) nebudete nic platit. 
                U zrušení během placeného období nevracíme poměrnou část platby.
              </p>

              <h2>6. Ochrana dat a soukromí</h2>
              <h3>6.1 Zpracování osobních údajů</h3>
              <p>
                Zpracování osobních údajů se řídí našimi 
                <a href="/ochrana-osobnich-udaju" className="text-green-600 hover:underline">
                  Zásadami ochrany osobních údajů
                </a> v souladu s GDPR.
              </p>

              <h3>6.2 Bezpečnost dat</h3>
              <p>
                Všechna data jsou šifrována při přenosu i ukládání. Používáme moderní 
                bezpečnostní protokoly pro ochranu vašich informací.
              </p>

              <h2>7. Odpovědnost</h2>
              <h3>7.1 Omezení odpovědnosti</h3>
              <p>
                DokladBot poskytuje službu "tak jak je". Neneseme odpovědnost za škody 
                způsobené nesprávným rozpoznáním textu nebo výpadkem služby.
              </p>

              <h3>7.2 Povinnosti uživatele</h3>
              <ul>
                <li>Kontrolovat správnost rozpoznaných dat</li>
                <li>Zálohovat si důležité dokumenty</li>
                <li>Používat službu v souladu s českým právem</li>
                <li>Nesdílet přístup s neoprávněnými osobami</li>
              </ul>

              <h2>8. Reklamace a stížnosti</h2>
              <h3>8.1 Postup reklamace</h3>
              <p>
                Reklamace můžete podat emailem na info@dokladbot.cz nebo prostřednictvím 
                zákaznického portálu. Reklamace vyřizujeme do 30 dnů.
              </p>

              <h3>8.2 Mimosoudní řešení sporů</h3>
              <p>
                Pro řešení spotřebitelských sporů můžete kontaktovat Českou obchodní inspekci 
                nebo využít platformu ODR Evropské komise.
              </p>

              <h2>9. Závěrečná ustanovení</h2>
              <h3>9.1 Změny podmínek</h3>
              <p>
                Tyto obchodní podmínky můžeme měnit. O změnách vás budeme informovat 
                emailem nejméně 30 dní předem.
              </p>

              <h3>9.2 Rozhodné právo</h3>
              <p>
                Tyto podmínky se řídí právním řádem České republiky. 
                Pro řešení sporů jsou příslušné české soudy.
              </p>

              <h3>9.3 Platnost podmínek</h3>
              <p>
                Pokud je některé ustanovení těchto podmínek neplatné, ostatní ustanovení 
                zůstávají v platnosti.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold mb-4">📞 Kontakt</h3>
                <p>
                  Máte otázky k obchodním podmínkám?<br />
                  <strong>Email:</strong> info@dokladbot.cz<br />
                  <strong>Telefon:</strong> +420 722 158 002
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