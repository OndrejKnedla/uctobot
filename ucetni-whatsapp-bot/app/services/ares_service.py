"""
ARES Service - Validace IČO a získávání informací o firmách z ARES registru
"""
import aiohttp
import logging
from typing import Dict, Any, Optional
import xml.etree.ElementTree as ET
from datetime import datetime

logger = logging.getLogger(__name__)

class AresService:
    """Service pro práci s ARES registrem"""
    
    def __init__(self):
        self.ares_url = "https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi"
        self.timeout = 10  # seconds
    
    async def validate_ico(self, ico: str) -> Dict[str, Any]:
        """
        Validuje IČO pomocí ARES registru
        
        Args:
            ico: 8-digit IČO string
            
        Returns:
            Dict obsahující:
            - valid: bool - zda je IČO platné
            - business_name: str - obchodní název
            - address: dict - adresní údaje
            - vat_payer: bool - zda je plátce DPH
            - error: str - chybová zpráva pokud nastala chyba
        """
        try:
            # Validace formátu IČO
            if not ico or len(ico) != 8 or not ico.isdigit():
                return {
                    "valid": False,
                    "error": "IČO musí mít přesně 8 číslic"
                }
            
            # Kontrola pomocí modulo 11 algoritmu
            if not self._validate_ico_checksum(ico):
                return {
                    "valid": False,
                    "error": "IČO nesplňuje kontrolní součet"
                }
            
            # Dotaz na ARES
            params = {
                'ico': ico,
                'MAX_POCET': '1'
            }
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                try:
                    async with session.get(self.ares_url, params=params) as response:
                        if response.status != 200:
                            logger.error(f"ARES API error: HTTP {response.status}")
                            return {
                                "valid": False,
                                "error": f"ARES API nedostupné (HTTP {response.status})"
                            }
                        
                        xml_content = await response.text()
                        return self._parse_ares_response(xml_content, ico)
                        
                except aiohttp.ClientError as e:
                    logger.error(f"ARES network error: {str(e)}")
                    # Při síťové chybě předpokládáme, že IČO je validní kvůli checksumu
                    return {
                        "valid": True,
                        "business_name": None,
                        "address": {},
                        "vat_payer": False,
                        "warning": "Síťová chyba - IČO nebylo možné ověřit v ARES registru"
                    }
                
        except Exception as e:
            logger.error(f"Unexpected error in ARES validation: {str(e)}")
            return {
                "valid": False,
                "error": "Neočekávaná chyba při ověřování IČO"
            }
    
    def _validate_ico_checksum(self, ico: str) -> bool:
        """
        Validuje IČO pomocí modulo 11 algoritmu
        
        Args:
            ico: 8-digit IČO string
            
        Returns:
            bool: True pokud je IČO validní
        """
        try:
            # Převod na čísla
            digits = [int(d) for d in ico]
            
            # Modulo 11 algoritmus
            weights = [8, 7, 6, 5, 4, 3, 2]
            
            # Výpočet kontrolního součtu
            suma = sum(digit * weight for digit, weight in zip(digits[:7], weights))
            remainder = suma % 11
            
            # Kontrolní číslice
            if remainder < 2:
                check_digit = remainder
            else:
                check_digit = 11 - remainder
            
            return digits[7] == check_digit
            
        except (ValueError, IndexError):
            return False
    
    def _parse_ares_response(self, xml_content: str, ico: str) -> Dict[str, Any]:
        """
        Parsuje XML odpověď z ARES
        
        Args:
            xml_content: XML obsah odpovědi
            ico: původní IČO pro kontrolu
            
        Returns:
            Dict s informacemi o firmě
        """
        try:
            # Parse XML
            root = ET.fromstring(xml_content)
            
            # Najdi záznam
            record = root.find('.//Zaznam')
            if record is None:
                return {
                    "valid": False,
                    "error": "IČO nenalezeno v ARES registru"
                }
            
            # Extract business name
            business_name = None
            business_name_elem = record.find('.//Obchodni_firma')
            if business_name_elem is not None:
                business_name = business_name_elem.text
            
            if not business_name:
                # Try alternative name fields
                name_elem = record.find('.//Nazev')
                if name_elem is not None:
                    business_name = name_elem.text
            
            # Extract address
            address = {}
            address_elem = record.find('.//Adresa_ARES')
            if address_elem is not None:
                # Street and house number
                street_elem = address_elem.find('.//Nazev_ulice')
                if street_elem is not None:
                    address['street'] = street_elem.text
                
                house_num_elem = address_elem.find('.//Cislo_domovni')
                if house_num_elem is not None:
                    address['house_number'] = house_num_elem.text
                
                # City
                city_elem = address_elem.find('.//Nazev_obce')
                if city_elem is not None:
                    address['city'] = city_elem.text
                
                # Postal code
                zip_elem = address_elem.find('.//PSC')
                if zip_elem is not None:
                    address['postal_code'] = zip_elem.text
            
            # Check VAT payer status (simplified - real check would need another API call)
            # For now, we'll determine based on business name patterns
            vat_payer = self._guess_vat_payer_status(business_name)
            
            # Extract registration date if available
            reg_date = None
            reg_date_elem = record.find('.//Datum_zapisu')
            if reg_date_elem is not None:
                try:
                    reg_date = datetime.strptime(reg_date_elem.text, '%Y-%m-%d').date()
                except ValueError:
                    pass
            
            logger.info(f"ARES lookup successful for IČO {ico}: {business_name}")
            
            return {
                "valid": True,
                "ico": ico,
                "business_name": business_name,
                "address": address,
                "vat_payer": vat_payer,
                "registration_date": reg_date.isoformat() if reg_date else None,
                "last_updated": datetime.now().isoformat()
            }
            
        except ET.ParseError as e:
            logger.error(f"Failed to parse ARES XML response: {str(e)}")
            return {
                "valid": False,
                "error": "Chyba při zpracování odpovědi z ARES"
            }
        except Exception as e:
            logger.error(f"Unexpected error parsing ARES response: {str(e)}")
            return {
                "valid": False,
                "error": "Neočekávaná chyba při zpracování ARES dat"
            }
    
    def _guess_vat_payer_status(self, business_name: Optional[str]) -> bool:
        """
        Pokusí se odhadnout zda je firma plátce DPH na základě názvu
        Toto je zjednodušený přístup - pro přesnější info by bylo potřeba další API
        
        Args:
            business_name: název firmy
            
        Returns:
            bool: pravděpodobnost že je plátce DPH
        """
        if not business_name:
            return False
        
        name_lower = business_name.lower()
        
        # Společnosti s ručením omezeným a akciové společnosti jsou častěji plátci DPH
        if any(pattern in name_lower for pattern in ['s.r.o.', 'a.s.', 'spol.', 'společnost']):
            return True
        
        # OSVČ jsou méně často plátci DPH
        return False
    
    async def get_business_info(self, ico: str) -> Optional[Dict[str, Any]]:
        """
        Získá detailní informace o firmě podle IČO
        
        Args:
            ico: 8-digit IČO
            
        Returns:
            Dict s informacemi o firmě nebo None pokud nenalezeno
        """
        result = await self.validate_ico(ico)
        
        if result.get('valid'):
            return {
                'ico': ico,
                'business_name': result.get('business_name'),
                'address': result.get('address', {}),
                'vat_payer': result.get('vat_payer', False),
                'registration_date': result.get('registration_date'),
                'source': 'ares',
                'retrieved_at': datetime.now().isoformat()
            }
        
        return None
    
    def format_address(self, address: Dict[str, Any]) -> str:
        """
        Naformátuje adresu do čitelného formátu
        
        Args:
            address: dict s adresními údaji
            
        Returns:
            str: naformátovaná adresa
        """
        parts = []
        
        if address.get('street') and address.get('house_number'):
            parts.append(f"{address['street']} {address['house_number']}")
        elif address.get('street'):
            parts.append(address['street'])
        
        if address.get('city') and address.get('postal_code'):
            parts.append(f"{address['postal_code']} {address['city']}")
        elif address.get('city'):
            parts.append(address['city'])
        
        return ', '.join(parts) if parts else ''
    
    async def batch_validate_ico(self, ico_list: list) -> Dict[str, Any]:
        """
        Validuje více IČO najednou
        
        Args:
            ico_list: seznam IČO k validaci
            
        Returns:
            Dict s výsledky pro každé IČO
        """
        results = {}
        
        for ico in ico_list:
            try:
                result = await self.validate_ico(ico)
                results[ico] = result
            except Exception as e:
                logger.error(f"Failed to validate IČO {ico}: {str(e)}")
                results[ico] = {
                    "valid": False,
                    "error": f"Chyba při validaci: {str(e)}"
                }
        
        return {
            "results": results,
            "total_count": len(ico_list),
            "valid_count": sum(1 for r in results.values() if r.get('valid')),
            "processed_at": datetime.now().isoformat()
        }