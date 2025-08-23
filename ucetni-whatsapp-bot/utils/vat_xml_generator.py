import xml.etree.ElementTree as ET
from datetime import datetime
import xml.dom.minidom
from typing import Dict, Any, List, Optional
import logging
from utils.vat_calculator import VatPeriodData

logger = logging.getLogger(__name__)

class VatXmlGenerator:
    """Generátor XML souborů pro DPH přiznání a kontrolní hlášení"""
    
    def __init__(self, user_settings: Dict[str, Any]):
        self.user = user_settings
        
        # Výchozí hodnoty pokud nejsou v user_settings
        self.defaults = {
            'tax_office_code': '001',
            'tax_office_workplace': '01',
            'okec_code': '620200',  # Programování
            'phone': '+420000000000',
            'email': 'user@example.com'
        }
    
    def _get_user_value(self, key: str, default: str = '') -> str:
        """Získá hodnotu z user settings nebo použije výchozí"""
        return str(self.user.get(key, self.defaults.get(key, default)))
    
    def generate_dph_priznani(self, period_data: VatPeriodData) -> str:
        """
        Generuje XML pro přiznání k DPH (DP3)
        
        Args:
            period_data: Data DPH za období
            
        Returns:
            str: XML jako string
        """
        try:
            # Root element s hlavičkou
            root = ET.Element("Pisemnost", {
                "nazevSW": "ÚčetníBot",
                "verzeSW": str(int(datetime.now().timestamp())),
                "xmlns": "http://adis.mfcr.cz/rozhraniXML/dphdp3/"
            })
            
            # Hlavní element pro DPH přiznání
            dphdp3 = ET.SubElement(root, "DPHDP3")
            
            # VetaD - základní údaje o přiznání
            veta_d = ET.SubElement(dphdp3, "VetaD", {
                "c_okec": self._get_user_value('okec_code'),
                "d_poddp": datetime.now().strftime("%d.%m.%Y"),
                "dapdph_forma": "B",  # Běžný plátce
                "dokument": "DP3",
                "k_uladis": "DPH",
                "mesic": str(period_data.month),
                "rok": str(period_data.year),
                "typ_platce": "P"  # Pravidelný (měsíční)
            })
            
            # VetaP - údaje o plátci
            veta_p = ET.SubElement(dphdp3, "VetaP", {
                "c_ufo": self._get_user_value('tax_office_code'),
                "c_pracufo": self._get_user_value('tax_office_workplace'),
                "typ_ds": "F",  # Fyzická osoba
                "c_telef": self._clean_phone(self._get_user_value('phone')),
                "dic": self._get_user_value('dic'),
                "email": self._get_user_value('email'),
                "jmeno": self._get_user_value('first_name'),
                "prijmeni": self._get_user_value('last_name'),
                "c_pop": self._get_user_value('house_number', '1'),
                "naz_obce": self._get_user_value('city', 'Praha'),
                "psc": self._get_user_value('postal_code', '10000'),
                "stat": "Česká republika"
            })
            
            # Řádky přiznání - VÝSTUPY (uskutečněná zdanitelná plnění)
            
            # Řádek 1 - základní sazba 21%
            if period_data.output_base_21 > 0:
                ET.SubElement(dphdp3, "Veta1", {
                    "zakl_dane1": str(int(period_data.output_base_21)),
                    "dan1": str(int(period_data.output_vat_21))
                })
            
            # Řádek 2 - první snížená sazba 12%
            if period_data.output_base_12 > 0:
                ET.SubElement(dphdp3, "Veta2", {
                    "zakl_dane2": str(int(period_data.output_base_12)),
                    "dan2": str(int(period_data.output_vat_12))
                })
            
            # Řádek 3 - plnění osvobozená od daně (0%)
            if period_data.output_base_0 > 0:
                ET.SubElement(dphdp3, "Veta6", {
                    "rez_plneni": str(int(period_data.output_base_0))
                })
            
            # Řádky přiznání - VSTUPY (nárok na odpočet daně)
            
            # Řádek 40 - odpočet daně u přijatých zdanitelných plnění
            if period_data.input_vat_21 > 0 or period_data.input_vat_12 > 0:
                attrs = {}
                if period_data.input_base_21 > 0:
                    attrs.update({
                        "zakl_dane1": str(int(period_data.input_base_21)),
                        "dan1": str(int(period_data.input_vat_21))
                    })
                if period_data.input_base_12 > 0:
                    attrs.update({
                        "zakl_dane2": str(int(period_data.input_base_12)),
                        "dan2": str(int(period_data.input_vat_12))
                    })
                
                if attrs:
                    ET.SubElement(dphdp3, "Veta40", attrs)
            
            # VÝSLEDEK - daň k zaplacení nebo nadměrný odpočet
            
            liability = period_data.vat_liability
            
            if liability > 0:
                # Řádek 62 - daň k zaplacení
                ET.SubElement(dphdp3, "Veta62", {
                    "dan_zocelk": str(int(liability))
                })
            elif liability < 0:
                # Řádek 63 - nadměrný odpočet
                ET.SubElement(dphdp3, "Veta63", {
                    "dano_zocelk": str(int(abs(liability)))
                })
            else:
                # Nulová daň - řádek 62 s hodnotou 0
                ET.SubElement(dphdp3, "Veta62", {
                    "dan_zocelk": "0"
                })
            
            return self._prettify_xml(root)
            
        except Exception as e:
            logger.error(f"Chyba při generování DPH přiznání: {str(e)}")
            raise
    
    def generate_kontrolni_hlaseni(self, period_data: VatPeriodData, 
                                 transactions: List[Dict[str, Any]]) -> str:
        """
        Generuje XML pro kontrolní hlášení (KH1)
        
        Args:
            period_data: Souhrnná data DPH za období
            transactions: Seznam transakcí s DPH
            
        Returns:
            str: XML jako string
        """
        try:
            # Root element
            root = ET.Element("Pisemnost", {
                "nazevSW": "ÚčetníBot",
                "verzeSW": str(int(datetime.now().timestamp())),
                "xmlns": "http://adis.mfcr.cz/rozhraniXML/dphkh1/"
            })
            
            # Hlavní element pro kontrolní hlášení
            dphkh1 = ET.SubElement(root, "DPHKH1")
            
            # VetaD - základní údaje
            veta_d = ET.SubElement(dphkh1, "VetaD", {
                "d_poddp": datetime.now().strftime("%d.%m.%Y"),
                "dokument": "KH1",
                "khdph_forma": "B",  # Běžné kontrolní hlášení
                "k_uladis": "DPH",
                "mesic": str(period_data.month),
                "rok": str(period_data.year)
            })
            
            # VetaP - údaje o plátci
            veta_p = ET.SubElement(dphkh1, "VetaP", {
                "dic": self._get_user_value('dic'),
                "jmeno": self._get_user_value('first_name'),
                "prijmeni": self._get_user_value('last_name'),
                "c_pop": self._get_user_value('house_number', '1'),
                "naz_obce": self._get_user_value('city', 'Praha'),
                "psc": self._get_user_value('postal_code', '10000')
            })
            
            # Sekce A - přijatá zdanitelná plnění (nákupy)
            row_number_a = 1
            for transaction in transactions:
                if (transaction.get('type') == 'expense' and 
                    transaction.get('vat_info', {}).get('vat', 0) > 0):
                    
                    vat_info = transaction['vat_info']
                    partner_vat_id = transaction.get('partner_vat_id', '')
                    
                    if partner_vat_id and vat_info['vat'] > 0:
                        attrs = {
                            "c_radku": str(row_number_a),
                            "dic_dodav": partner_vat_id,
                            "c_evid_dd": transaction.get('document_number', f"DOK{row_number_a:04d}"),
                            "d_uctpri": transaction.get('created_at', datetime.now()).strftime("%d.%m.%Y")
                        }
                        
                        # Podle sazby DPH
                        if vat_info['rate'] == 21:
                            attrs.update({
                                "zakl_dane1": str(int(vat_info['base'])),
                                "dan1": str(int(vat_info['vat']))
                            })
                        elif vat_info['rate'] == 12:
                            attrs.update({
                                "zakl_dane2": str(int(vat_info['base'])),
                                "dan2": str(int(vat_info['vat']))
                            })
                        
                        ET.SubElement(dphkh1, "VetaA4", attrs)
                        row_number_a += 1
            
            # Sekce B - uskutečněná zdanitelná plnění (prodeje)
            row_number_b = 1
            for transaction in transactions:
                if (transaction.get('type') == 'income' and 
                    transaction.get('vat_info', {}).get('vat', 0) > 0):
                    
                    vat_info = transaction['vat_info']
                    partner_vat_id = transaction.get('partner_vat_id', '')
                    
                    if partner_vat_id and vat_info['vat'] > 0:
                        attrs = {
                            "c_radku": str(row_number_b),
                            "dic_odb": partner_vat_id,
                            "c_evid_dd": transaction.get('document_number', f"FAK{row_number_b:04d}"),
                            "d_uctpri": transaction.get('created_at', datetime.now()).strftime("%d.%m.%Y")
                        }
                        
                        # Podle sazby DPH
                        if vat_info['rate'] == 21:
                            attrs.update({
                                "zakl_dane1": str(int(vat_info['base'])),
                                "dan1": str(int(vat_info['vat']))
                            })
                        elif vat_info['rate'] == 12:
                            attrs.update({
                                "zakl_dane2": str(int(vat_info['base'])),
                                "dan2": str(int(vat_info['vat']))
                            })
                        
                        ET.SubElement(dphkh1, "VetaB2", attrs)
                        row_number_b += 1
            
            return self._prettify_xml(root)
            
        except Exception as e:
            logger.error(f"Chyba při generování kontrolního hlášení: {str(e)}")
            raise
    
    def _clean_phone(self, phone: str) -> str:
        """Vyčistí telefonní číslo pro XML"""
        # Odstraní +420 prefix a mezery
        cleaned = phone.replace('+420', '').replace(' ', '').replace('-', '')
        return cleaned[:9]  # Max 9 číslic
    
    def _prettify_xml(self, elem: ET.Element) -> str:
        """Naformátuje XML pro čitelnost"""
        rough_string = ET.tostring(elem, encoding='unicode')
        reparsed = xml.dom.minidom.parseString(rough_string)
        pretty_xml = reparsed.toprettyxml(indent="  ")
        
        # Odstraní prázdné řádky
        lines = [line for line in pretty_xml.split('\n') if line.strip()]
        return '\n'.join(lines)
    
    def validate_before_export(self, period_data: VatPeriodData, 
                             transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validuje data před exportem XML
        
        Args:
            period_data: Souhrnná data za období
            transactions: Seznam transakcí
            
        Returns:
            Dict s výsledky validace
        """
        issues = []
        warnings = []
        
        # Kontrola základních údajů plátce
        required_fields = ['dic', 'first_name', 'last_name']
        for field in required_fields:
            if not self._get_user_value(field):
                issues.append(f"❌ Chybí {field} v profilu uživatele")
        
        # Kontrola DPH dat
        if period_data.total_output_vat == 0 and period_data.total_input_vat == 0:
            issues.append("❌ Žádné DPH transakce za dané období")
        
        # Kontrola transakcí nad 10 000 Kč pro kontrolní hlášení
        high_value_transactions = []
        for transaction in transactions:
            vat_info = transaction.get('vat_info', {})
            if vat_info.get('base', 0) > 10000:  # Nad 10k bez DPH
                if not transaction.get('partner_vat_id'):
                    high_value_transactions.append(transaction.get('description', 'Neznámá transakce'))
        
        if high_value_transactions:
            issues.append(f"❌ {len(high_value_transactions)} transakce nad 10 000 Kč nemá DIČ dodavatele")
            for desc in high_value_transactions[:3]:  # Zobraz max 3 příklady
                warnings.append(f"• {desc}")
        
        # Kontrola čísel dokladů
        missing_docs = [t for t in transactions 
                       if t.get('vat_info', {}).get('vat', 0) > 0 
                       and not t.get('document_number')]
        
        if missing_docs:
            warnings.append(f"⚠️ {len(missing_docs)} dokladů nemá číslo")
        
        # Upozornění na neobvyklé hodnoty
        if period_data.vat_liability > 100000:
            warnings.append(f"⚠️ Vysoká daň k zaplacení: {period_data.vat_liability:,.0f} Kč")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings,
            'summary': f"Validováno {len(transactions)} transakcí za {period_data.month}/{period_data.year}"
        }
    
    def generate_export_summary(self, period_data: VatPeriodData, 
                               file_paths: Dict[str, str]) -> str:
        """Generuje souhrn exportu pro uživatele"""
        month_names = {
            1: 'leden', 2: 'únor', 3: 'březen', 4: 'duben',
            5: 'květen', 6: 'červen', 7: 'červenec', 8: 'srpen',
            9: 'září', 10: 'říjen', 11: 'listopad', 12: 'prosinec'
        }
        
        month_name = month_names.get(period_data.month, str(period_data.month))
        
        summary = f"""📁 *XML soubory vygenerovány pro {month_name} {period_data.year}*

✅ *Vytvořeno:*
1️⃣ Přiznání k DPH (DP3)
2️⃣ Kontrolní hlášení (KH1)

📊 *Souhrn:*
• Daň k zaplacení: {period_data.vat_liability:,.0f} Kč
• Výstupní DPH: {period_data.total_output_vat:,.0f} Kč
• Vstupní DPH: {period_data.total_input_vat:,.0f} Kč

📌 *JAK PODAT:*
1. Přihlas se na www.daneelektronicky.cz
2. Nahraj XML soubory
3. Zkontroluj údaje
4. Podepíš a odešli

📅 *Termíny:*
• Přiznání i kontrolní hlášení: do 25. dne následujícího měsíce
• Zaplacení daně: do konce následujícího měsíce

💡 *Tip:* Zkontroluj si údaje před odesláním!"""
        
        return summary