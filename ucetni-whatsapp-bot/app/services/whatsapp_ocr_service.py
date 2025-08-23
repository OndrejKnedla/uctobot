"""
WhatsApp OCR Service pro zpracování obrázků účtenek
"""
import io
import re
import os
import logging
from PIL import Image
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
import requests

# OCR dependencies
try:
    import pytesseract
    OCR_AVAILABLE = True
    try:
        pytesseract.get_tesseract_version()
        OCR_FUNCTIONAL = True
    except pytesseract.TesseractNotFoundError:
        OCR_FUNCTIONAL = False
except ImportError:
    OCR_AVAILABLE = False
    OCR_FUNCTIONAL = False

# Image processing
try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

from app.ai_processor import AIProcessor
from utils.ares_validator import AresValidator

logger = logging.getLogger(__name__)

class WhatsAppOCRService:
    def __init__(self):
        self.ai_processor = AIProcessor()
        self.ares_validator = AresValidator()
        
        # Známé obchodní řetězce a jejich IČA
        self.known_vendors = {
            '26185610': 'Lidl',
            '44012373': 'Kaufland', 
            '26178176': 'Penny Market',
            '45308314': 'Billa',
            '26941514': 'Tesco',
            '27082440': 'Alza.cz',
            '47666897': 'Albert',
            '25215612': 'COOP',
            '64939219': 'Globus',
            '25960059': 'IKEA',
            '47910666': 'Datart'
        }
        
        # Klíčová slova pro rozpoznání obchodů
        self.vendor_keywords = {
            'LIDL': 'Lidl',
            'KAUFLAND': 'Kaufland',
            'PENNY': 'Penny Market',
            'BILLA': 'Billa', 
            'TESCO': 'Tesco',
            'ALZA': 'Alza.cz',
            'ALBERT': 'Albert',
            'GLOBUS': 'Globus',
            'MAKRO': 'Makro',
            'IKEA': 'IKEA',
            'DATART': 'Datart',
            'ROHLIK': 'Rohlík.cz',
            'KOSIK': 'Košík.cz',
            'SHELL': 'Shell',
            'OMV': 'OMV',
            'BENZINA': 'Benzina',
            'MOL': 'MOL'
        }

    async def process_receipt_from_whatsapp(
        self, 
        image_data: bytes, 
        user_message: str = "", 
        user_id: int = None
    ) -> Dict:
        """
        Hlavní funkce pro zpracování účtenky z WhatsApp
        """
        try:
            if not OCR_AVAILABLE:
                logger.warning("OCR není dostupné - chybí pytesseract")
                return {
                    'success': False,
                    'error': 'OCR služba není dostupná',
                    'message': 'Bohužel nemůžu přečíst obrázky. OCR služba není nainstalována.'
                }
            
            if not OCR_FUNCTIONAL:
                logger.warning("Tesseract není funkční")
                return {
                    'success': False,
                    'error': 'Tesseract OCR není nainstalován',
                    'message': 'OCR služba není správně nakonfigurována. Prosím zadejte údaje ručně.'
                }

            logger.info(f"Zpracovávám obrázek účtenky pro uživatele {user_id}, velikost: {len(image_data)} bytes")
            
            # Převeď bytes na PIL Image
            try:
                image = Image.open(io.BytesIO(image_data))
                logger.info(f"Obrázek načten: {image.size}, mode: {image.mode}")
            except Exception as e:
                logger.error(f"Chyba při načítání obrázku: {str(e)}")
                return {
                    'success': False,
                    'error': f'Chyba při načítání obrázku: {str(e)}',
                    'message': 'Nepodařilo se načíst obrázek. Zkuste jiný formát.'
                }
            
            # Předprocessing pro lepší OCR
            processed_image = self._preprocess_image(image)
            
            # OCR s českým a anglickým jazykem
            try:
                ocr_text = pytesseract.image_to_string(
                    processed_image,
                    lang='ces+eng',
                    config='--psm 4'  # Assume single column of text
                )
                logger.info(f"OCR text extrahován: {len(ocr_text)} znaků")
            except Exception as e:
                logger.error(f"Chyba při OCR: {str(e)}")
                return {
                    'success': False,
                    'error': f'Chyba při rozpoznávání textu: {str(e)}',
                    'message': 'Nepodařilo se rozpoznat text z obrázku.'
                }
            
            if not ocr_text.strip():
                return {
                    'success': False,
                    'error': 'Žádný text nerozpoznán',
                    'message': 'Z obrázku se nepodařilo rozpoznat žádný text. Zkuste ostřejší fotografii.'
                }
            
            # Extrahuj základní data z OCR textu
            extracted_data = self._extract_receipt_data(ocr_text)
            logger.info(f"Extrahovaná data: {extracted_data}")
            
            # Pokus se identifikovat obchod
            vendor = self._identify_vendor(ocr_text, extracted_data.get('ico'))
            if vendor:
                extracted_data['vendor'] = vendor
            
            # Validuj IČO přes ARES pokud bylo nalezeno
            if extracted_data.get('ico'):
                try:
                    ares_data = self.ares_validator.validate_ico(extracted_data['ico'])
                    if ares_data:
                        extracted_data['vendor_verified'] = ares_data.get('obchodni_firma', '')
                        extracted_data['vendor_address'] = ares_data.get('sidlo', '')
                except Exception as e:
                    logger.warning(f"ARES validace selhala: {str(e)}")
            
            # Použij AI processor pro další zpracování pokud je dostupný
            ai_result = None
            if self.ai_processor.client:
                try:
                    combined_text = f"{user_message}\n\nOCR text:\n{ocr_text}" if user_message else ocr_text
                    ai_result = await self.ai_processor.process_enhanced_message(
                        message=combined_text,
                        ocr_text=ocr_text
                    )
                    logger.info(f"AI zpracování úspěšné: {bool(ai_result)}")
                except Exception as e:
                    logger.warning(f"AI zpracování selhalo: {str(e)}")
            
            # Kombinuj OCR a AI výsledky
            final_result = self._combine_ocr_and_ai_results(extracted_data, ai_result)
            
            return {
                'success': True,
                'ocr_text': ocr_text,
                'ocr_confidence': extracted_data.get('confidence', 0.7),
                'ai_processed': ai_result is not None,
                **final_result
            }
            
        except Exception as e:
            logger.error(f"Neočekávaná chyba při zpracování účtenky: {str(e)}")
            return {
                'success': False,
                'error': f'Neočekávaná chyba: {str(e)}',
                'message': 'Nastala neočekávaná chyba. Zkuste to znovu nebo zadejte údaje ručně.'
            }

    def _preprocess_image(self, image: Image) -> Image:
        """
        Vylepší kvalitu obrázku pro lepší OCR
        """
        try:
            if not CV2_AVAILABLE:
                # Základní preprocessing bez OpenCV
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                return image
            
            # Pokročilý preprocessing s OpenCV
            img_array = np.array(image)
            
            # Převeď na šedou pokud je barevný
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Odstranění šumu
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # Zvýšení kontrastu
            enhanced = cv2.equalizeHist(denoised)
            
            # Threshold pro čistší text
            _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            return Image.fromarray(binary)
            
        except Exception as e:
            logger.warning(f"Preprocessing selhal, používám původní obrázek: {str(e)}")
            return image.convert('RGB') if image.mode != 'RGB' else image

    def _extract_receipt_data(self, text: str) -> Dict:
        """
        Inteligentní extrakce dat z OCR textu
        """
        data = {'confidence': 0.6}  # Začínáme s nižší confidence pro OCR
        
        # IČO/IČ - různé formáty
        ico_patterns = [
            r'IČO?:?\s*(\d{8})',
            r'IČ:?\s*(\d{8})', 
            r'IC\s*:?\s*(\d{8})',
            r'(\d{8})(?=\s*DIČ)',  # IČO před DIČ
        ]
        for pattern in ico_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                ico = match.group(1)
                if len(ico) == 8 and ico.isdigit():
                    data['ico'] = ico
                    data['confidence'] += 0.1
                    break
        
        # DIČ
        dic_patterns = [
            r'DIČ:?\s*(CZ\d{8,10})',
            r'DIC\s*:?\s*(CZ\d{8,10})',
            r'Tax\s*ID\s*:?\s*(CZ\d{8,10})'
        ]
        for pattern in dic_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['dic'] = match.group(1)
                data['confidence'] += 0.1
                break
        
        # Částky - hledej všechny možné formáty
        amount_patterns = [
            r'CELKEM\s*:?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:Kč|CZK|,-)?',
            r'TOTAL\s*:?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:Kč|CZK|,-)?',
            r'K\s*ÚHRADĚ\s*:?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:Kč|CZK|,-)?',
            r'(\d+(?:[.,]\d{1,2})?)\s*(?:Kč|CZK|,-)\s*(?:CELKEM|TOTAL)',
        ]
        
        amounts = []
        for pattern in amount_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    clean_amount = match.replace(',', '.').replace(' ', '')
                    amounts.append(float(clean_amount))
                except:
                    continue
        
        # Také hledej všechny částky v textu
        all_amounts = re.findall(r'(\d+(?:[.,]\d{1,2})?)\s*(?:Kč|CZK|,-)', text)
        for amount in all_amounts:
            try:
                clean_amount = amount.replace(',', '.').replace(' ', '')
                amount_float = float(clean_amount)
                if amount_float > 1:  # Ignoruj nesmyslně malé částky
                    amounts.append(amount_float)
            except:
                continue
        
        if amounts:
            # Vyber největší částku jako celkovou
            data['total'] = max(amounts)
            data['amounts'] = sorted(list(set(amounts)), reverse=True)
            data['confidence'] += 0.2
        
        # Datum - různé formáty
        date_patterns = [
            r'(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})',  # DD.MM.YYYY
            r'(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})',  # YYYY-MM-DD
            r'(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2})',   # DD.MM.YY
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                formatted_date = self._format_date(match, pattern)
                if formatted_date:
                    data['date'] = formatted_date
                    data['confidence'] += 0.1
                    break
            if 'date' in data:
                break
        
        # Čas
        time_match = re.search(r'(\d{1,2}):(\d{2})(?::(\d{2}))?', text)
        if time_match:
            data['time'] = f"{time_match.group(1)}:{time_match.group(2)}"
            if time_match.group(3):
                data['time'] += f":{time_match.group(3)}"
        
        # DPH informace
        vat_patterns = [
            r'DPH\s*(\d+)\s*%',
            r'(\d+)\s*%\s*DPH',
            r'sazba\s*(\d+)\s*%',
            r'VAT\s*(\d+)\s*%'
        ]
        
        vat_rates = []
        for pattern in vat_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            vat_rates.extend([int(m) for m in matches if m.isdigit()])
        
        if vat_rates:
            data['vat_rates'] = list(set(vat_rates))
            if 21 in vat_rates:
                data['vat_rate'] = 21
            elif vat_rates:
                data['vat_rate'] = max(vat_rates)  # Použij nejvyšší sazbu
        
        # Číslo dokladu
        doc_patterns = [
            r'(?:číslo|č\.?|doklad|účtenka|receipt)\s*[:\s#]*([A-Z0-9\-/]{3,})',
            r'BL\s*[:\s]*([A-Z0-9\-/]{3,})',
            r'PD\s*[:\s]*([A-Z0-9\-/]{3,})',
            r'№\s*([A-Z0-9\-/]{3,})',
        ]
        
        for pattern in doc_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                doc_num = match.group(1).strip()
                if len(doc_num) >= 3:  # Minimální délka čísla dokladu
                    data['document_number'] = doc_num
                    data['confidence'] += 0.1
                    break
        
        # Základní položky
        items = self._extract_items(text)
        if items:
            data['items'] = items
            data['confidence'] += 0.1
        
        return data

    def _extract_items(self, text: str) -> List[Dict]:
        """
        Pokusí se extrahovat jednotlivé položky z účtenky
        """
        items = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if len(line) < 3:
                continue
            
            # Různé patterny pro položky
            patterns = [
                # Název ... cena Kč
                r'^(.+?)\s+(\d+(?:[.,]\d{1,2})?)\s*(?:Kč|CZK|,-)\s*$',
                # Název množství x jednotková_cena = celková_cena
                r'^(.+?)\s+(\d+(?:[.,]\d{1,2})?)\s*x\s*(\d+(?:[.,]\d{1,2})?)\s*=?\s*(\d+(?:[.,]\d{1,2})?)',
                # Název [tab/spaces] cena
                r'^(.{5,}?)\s{3,}(\d+(?:[.,]\d{1,2})?)\s*$',
            ]
            
            for i, pattern in enumerate(patterns):
                match = re.match(pattern, line, re.IGNORECASE)
                if match:
                    try:
                        description = match.group(1).strip()
                        
                        # Vyfiltruj evidentní nesmysly
                        if (len(description) < 2 or 
                            any(word in description.upper() for word in ['CELKEM', 'TOTAL', 'DPH', 'VAT', 'SUMA']) or
                            description.isdigit()):
                            break
                        
                        if i == 0:  # Název ... cena
                            price = float(match.group(2).replace(',', '.'))
                            if price > 0:
                                items.append({
                                    'description': description,
                                    'price': price,
                                    'quantity': 1
                                })
                                
                        elif i == 1:  # Název množství x cena = celkem
                            quantity = float(match.group(2).replace(',', '.'))
                            unit_price = float(match.group(3).replace(',', '.'))
                            total_price = float(match.group(4).replace(',', '.'))
                            
                            if all(x > 0 for x in [quantity, unit_price, total_price]):
                                items.append({
                                    'description': description,
                                    'quantity': quantity,
                                    'unit_price': unit_price,
                                    'price': total_price
                                })
                                
                        elif i == 2:  # Název [mezery] cena  
                            price = float(match.group(2).replace(',', '.'))
                            if price > 0:
                                items.append({
                                    'description': description,
                                    'price': price,
                                    'quantity': 1
                                })
                        
                        break
                        
                    except (ValueError, IndexError):
                        continue
        
        # Seřaď podle ceny (nejvyšší první) a omeз na 10
        items.sort(key=lambda x: x.get('price', 0), reverse=True)
        return items[:10]

    def _format_date(self, match: Tuple, pattern: str) -> Optional[str]:
        """
        Formátuje rozpoznané datum do standardního formátu
        """
        try:
            if 'YYYY' in pattern:  # YYYY-MM-DD formát
                year, month, day = match
                if len(year) == 4:
                    date_obj = date(int(year), int(month), int(day))
                else:
                    return None
            else:  # DD.MM.YYYY nebo DD.MM.YY formát
                day, month, year = match
                if len(year) == 2:
                    # Rozpoznej století pro dvouciferný rok
                    year_int = int(year)
                    current_year = datetime.now().year
                    if year_int <= (current_year % 100) + 5:  # Do 5 let dopředu = 20xx
                        year = f"20{year}"
                    else:
                        year = f"19{year}"
                
                date_obj = date(int(year), int(month), int(day))
            
            return date_obj.strftime('%Y-%m-%d')
            
        except (ValueError, TypeError):
            return None

    def _identify_vendor(self, text: str, ico: Optional[str] = None) -> Optional[str]:
        """
        Pokusí se identifikovat obchod podle IČO nebo názvu
        """
        # Nejdřív zkus podle IČO
        if ico and ico in self.known_vendors:
            return self.known_vendors[ico]
        
        # Potom podle klíčových slov v textu
        text_upper = text.upper()
        for keyword, vendor_name in self.vendor_keywords.items():
            if keyword in text_upper:
                return vendor_name
        
        return None

    def _combine_ocr_and_ai_results(self, ocr_data: Dict, ai_data: Optional[Dict]) -> Dict:
        """
        Kombinuje výsledky OCR a AI zpracování
        """
        result = ocr_data.copy()
        
        if ai_data:
            # AI má prioritu pro strukturovaná data
            for key in ['type', 'description', 'category', 'category_name']:
                if ai_data.get(key):
                    result[key] = ai_data[key]
            
            # Kombinuj číselné hodnoty - preferuj AI pokud je rozumné
            if ai_data.get('amount') and ocr_data.get('total'):
                ai_amount = float(ai_data['amount'])
                ocr_total = float(ocr_data['total'])
                # Pokud se liší o méně než 20%, použij AI (přesnější parsing)
                if abs(ai_amount - ocr_total) / max(ai_amount, ocr_total) < 0.2:
                    result['amount'] = ai_amount
                    result['amount_source'] = 'ai'
                else:
                    result['amount'] = ocr_total
                    result['amount_source'] = 'ocr'
            elif ai_data.get('amount'):
                result['amount'] = float(ai_data['amount'])
                result['amount_source'] = 'ai'
            elif ocr_data.get('total'):
                result['amount'] = float(ocr_data['total'])
                result['amount_source'] = 'ocr'
            
            # Přidej AI metadata
            result['ai_confidence'] = ai_data.get('ai_confidence', 0.8)
            result['ai_model'] = ai_data.get('ai_model_used', 'llama-3.1-8b-instant')
        
        return result

# Globální instance
whatsapp_ocr_service = WhatsAppOCRService()