import Layout from '@/components/layout/Layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GDPR - Správa osobních údajů | DokladBot',
  description: 'Spravujte své osobní údaje v souladu s GDPR - export, úprava, smazání dat',
};

export default function GDPRPage() {
  return (
    <Layout showMainPageSections={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl shadow-sm border p-8 md:p-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-4 text-gray-900">GDPR - Správa osobních údajů</h1>
              <p className="text-xl text-gray-600">
                Máte plnou kontrolu nad svými osobními údaji
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 mb-8">
                V souladu s GDPR (Obecným nařízením o ochraně údajů) máte právo kontrolovat, 
                jak zpracováváme vaše osobní údaje. Zde najdete všechny možnosti správy vašich dat.
              </p>

              <div className="grid md:grid-cols-2 gap-8 not-prose mb-12">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-bold text-green-800">Exportovat data</h3>
                  </div>
                  <p className="text-green-700 mb-4">
                    Získejte kopii všech svých osobních údajů ve strukturovaném formátu.
                  </p>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
                    📥 Stáhnout má data
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <h3 className="text-xl font-bold text-blue-800">Upravit údaje</h3>
                  </div>
                  <p className="text-blue-700 mb-4">
                    Aktualizujte své osobní informace nebo opravte nepřesnosti.
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                    ✏️ Upravit profil
                  </button>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <h3 className="text-xl font-bold text-orange-800">Omezit zpracování</h3>
                  </div>
                  <p className="text-orange-700 mb-4">
                    Dočasně pozastavte zpracování vašich osobních údajů.
                  </p>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium">
                    ⏸️ Pozastavit zpracování
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <h3 className="text-xl font-bold text-red-800">Smazat účet</h3>
                  </div>
                  <p className="text-red-700 mb-4">
                    Trvale smažte svůj účet a všechna související data.
                  </p>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium">
                    🗑️ Smazat účet
                  </button>
                </div>
              </div>

              <h2>Vaša práva podle GDPR</h2>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">🔍 Právo na informace (čl. 15 GDPR)</h3>
                <p className="mb-4">Máte právo vědět:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Jaké osobní údaje o vás zpracováváme</li>
                  <li>Za jakým účelem je zpracováváme</li>
                  <li>Komu je předáváme</li>
                  <li>Jak dlouho je uchováváme</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">✏️ Právo na opravu (čl. 16 GDPR)</h3>
                <p>
                  Pokud jsou vaše osobní údaje nepřesné nebo neúplné, máte právo požádat 
                  o jejich opravu nebo doplnění.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">🗑️ Právo na výmaz (čl. 17 GDPR)</h3>
                <p className="mb-4">Máte právo na smazání osobních údajů, pokud:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Údaje již nejsou potřebné pro původní účel</li>
                  <li>Odvoláte souhlas a není jiný právní základ</li>
                  <li>Údaje byly zpracovány protiprávně</li>
                  <li>Smazání vyžaduje právní povinnost</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">⏸️ Právo na omezení zpracování (čl. 18 GDPR)</h3>
                <p className="mb-4">Můžete požádat o omezení zpracování, pokud:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Zpochybňujete přesnost údajů</li>
                  <li>Zpracování je protiprávní</li>
                  <li>Potřebujete údaje pro právní nároky</li>
                  <li>Vzneste námitku proti zpracování</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">📦 Právo na přenositelnost (čl. 20 GDPR)</h3>
                <p>
                  Máte právo získat své osobní údaje ve strukturovaném, běžně používaném 
                  a strojově čitelném formátu a právo na jejich přenos jinému správci.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">❌ Právo vznést námitku (čl. 21 GDPR)</h3>
                <p>
                  Máte právo vznést námitku proti zpracování osobních údajů pro účely 
                  přímého marketingu nebo z důvodů týkajících se vaší konkrétní situace.
                </p>
              </div>

              <h2>Jak uplatnit svá práva</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">📧 Kontaktujte nás</h3>
                <p className="mb-4">
                  Pro uplatnění svých práv nebo dotazy ohledně zpracování osobních údajů nás kontaktujte:
                </p>
                <ul className="space-y-2">
                  <li><strong>Email:</strong> privacy@dokladbot.cz</li>
                  <li><strong>Telefon:</strong> +420 722 158 002</li>
                  <li><strong>Adresa:</strong> REALOK s.r.o., [Adresa]</li>
                </ul>
                <p className="mt-4 text-sm text-blue-700">
                  <strong>Lhůta pro vyřízení:</strong> Vaši žádost vyřídíme do 1 měsíce od obdržení. 
                  V odůvodněných případech můžeme lhůtu produžít o další 2 měsíce.
                </p>
              </div>

              <h2>Stížnosti</h2>
              <p>
                Pokud se domníváte, že zpracování vašich osobních údajů porušuje GDPR, 
                máte právo podat stížnost u dozorového úřadu:
              </p>
              
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-3">Úřad pro ochranu osobních údajů</h3>
                <p>
                  <strong>Adresa:</strong> Pplk. Sochora 27, 170 00 Praha 7<br />
                  <strong>Telefon:</strong> +420 234 665 111<br />
                  <strong>Email:</strong> posta@uoou.cz<br />
                  <strong>Web:</strong> <a href="https://www.uoou.cz" className="text-blue-600 hover:underline">www.uoou.cz</a>
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold mb-4 text-green-800">💚 Vaše soukromí je pro nás priorita</h3>
                <p className="text-green-700">
                  Dbáme na to, aby vaše osobní údaje byly v bezpečí a zpracovávány transparentně. 
                  Máte-li jakékoliv otázky nebo obavy, neváhejte nás kontaktovat.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
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