import aiohttp
import asyncio
import xml.etree.ElementTree as ET
import logging
import re

logger = logging.getLogger(__name__)

class AresValidator:
    def __init__(self):
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def validate_ico_format(self, ico: str) -> bool:
        """Validuje formát IČO (8 číslic)"""
        ico = re.sub(r'\s+', '', ico)  # Odstraň mezery
        return bool(re.match(r'^\d{8}$', ico))
    
    def calculate_ico_checksum(self, ico: str) -> bool:
        """Validuje kontrolní součet IČO podle algoritmu"""
        try:
            ico = ico.replace(' ', '')
            if len(ico) != 8:
                return False
            
            # Kontrolní algoritmus IČO
            weights = [8, 7, 6, 5, 4, 3, 2]
            checksum = sum(int(ico[i]) * weights[i] for i in range(7))
            remainder = checksum % 11
            
            if remainder < 2:
                expected_check = remainder
            else:
                expected_check = 11 - remainder
            
            return int(ico[7]) == expected_check
        except (ValueError, IndexError):
            return False
    
    async def verify_ico(self, ico: str):
        """Ověří IČO v ARES a vrátí údaje o firmě"""
        ico = re.sub(r'\s+', '', ico)  # Odstraň mezery
        
        # Validace formátu
        if not self.validate_ico_format(ico):
            return {'valid': False, 'error': 'Neplatný formát IČO. Zadejte 8 číslic.'}
        
        # Validace kontrolního součtu
        if not self.calculate_ico_checksum(ico):
            return {'valid': False, 'error': 'Neplatné IČO. Kontrolní součet nesedí.'}
        
        try:
            url = f"http://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi?ico={ico}"
            
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            async with self.session.get(url, timeout=10) as response:
                if response.status != 200:
                    return {'valid': False, 'error': 'Chyba při dotazu na ARES'}
                
                xml_data = await response.text()
                return self._parse_ares_response(xml_data, ico)
                
        except asyncio.TimeoutError:
            logger.error("ARES API timeout")
            return {'valid': False, 'error': 'Časový limit dotazu na ARES'}
        except Exception as e:
            logger.error(f"ARES API error: {str(e)}")
            return {'valid': False, 'error': 'Chyba při ověřování IČO'}
    
    def _parse_ares_response(self, xml_data: str, ico: str):
        """Parsuje XML odpověď z ARES"""
        try:
            root = ET.fromstring(xml_data)
            
            # Namespace pro ARES XML
            ns = {'are': 'http://wwwinfo.mfcr.cz/ares/xml_doc/schemas/ares/ares_answer_basic/v_1.0.3'}
            
            # Kontrola chyby
            error = root.find('.//are:Error', ns)
            if error is not None:
                error_text = error.find('are:Error_text', ns)
                error_msg = error_text.text if error_text is not None else 'IČO nebylo nalezeno'
                return {'valid': False, 'error': f'ARES: {error_msg}'}
            
            # Extrakce údajů
            company_name = root.find('.//are:Obchodni_firma', ns)
            if company_name is None:
                company_name = root.find('.//are:Nazev', ns)
            
            address_element = root.find('.//are:Adresa_ARES', ns)
            
            if company_name is None:
                return {'valid': False, 'error': 'Firma nebyla nalezena'}
            
            # Parsování adresy
            address_data = self._parse_address(address_element, ns) if address_element is not None else {}
            
            # DIČ (není vždy k dispozici)
            dic_element = root.find('.//are:DIC', ns)
            dic = dic_element.text if dic_element is not None else None
            
            return {
                'valid': True,
                'ico': ico,
                'name': company_name.text.strip(),
                'dic': dic,
                'address': address_data,
                'full_address': self._format_address(address_data)
            }
            
        except ET.ParseError as e:
            logger.error(f"XML parse error: {str(e)}")
            return {'valid': False, 'error': 'Chyba při parsování odpovědi z ARES'}
        except Exception as e:
            logger.error(f"Unexpected error in ARES parsing: {str(e)}")
            return {'valid': False, 'error': 'Neočekávaná chyba při zpracování údajů'}
    
    def _parse_address(self, address_element, ns):
        """Parsuje adresu z XML elementu"""
        if address_element is None:
            return {}
        
        address = {}
        
        # Názvy elementů v ARES
        field_mapping = {
            'street': 'are:Nazev_ulice',
            'house_number': 'are:Cislo_domovni',
            'orientation_number': 'are:Cislo_orientacni',
            'city': 'are:Nazev_obce',
            'zip_code': 'are:PSC',
            'district': 'are:Nazev_okresu'
        }
        
        for key, xpath in field_mapping.items():
            element = address_element.find(xpath, ns)
            if element is not None and element.text:
                address[key] = element.text.strip()
        
        return address
    
    def _format_address(self, address_data):
        """Naformátuje adresu do čitelného řetězce"""
        if not address_data:
            return ""
        
        parts = []
        
        # Ulice a číslo
        street_part = address_data.get('street', '')
        house_num = address_data.get('house_number', '')
        orient_num = address_data.get('orientation_number', '')
        
        if street_part:
            if house_num:
                if orient_num:
                    parts.append(f"{street_part} {house_num}/{orient_num}")
                else:
                    parts.append(f"{street_part} {house_num}")
            else:
                parts.append(street_part)
        
        # Město a PSČ
        city = address_data.get('city', '')
        zip_code = address_data.get('zip_code', '')
        
        if city and zip_code:
            parts.append(f"{zip_code} {city}")
        elif city:
            parts.append(city)
        
        return ", ".join(parts)
    
    async def get_company_info(self, ico: str):
        """Veřejná metoda pro získání informací o společnosti"""
        async with self:
            return await self.verify_ico(ico)

# Samostatná funkce pro jednoduché použití
async def validate_ico(ico: str):
    """Validuje IČO bez nutnosti instanciovat třídu"""
    validator = AresValidator()
    return await validator.get_company_info(ico)