from groq import Groq
import json
import os
import re
from typing import Dict, Optional, Any, List
from decimal import Decimal
import logging
from datetime import datetime, date
from utils.currency_converter import CurrencyConverter
from utils.ares_validator import AresValidator
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class TransactionItem:
    description: str
    quantity: float = 1.0
    unit: str = "ks"
    unit_price: Optional[Decimal] = None
    unit_price_with_vat: Optional[Decimal] = None
    vat_rate: int = 21
    total_without_vat: Optional[Decimal] = None
    vat_amount: Optional[Decimal] = None
    total_with_vat: Optional[Decimal] = None
    item_category_code: Optional[str] = None
    item_category_name: Optional[str] = None

@dataclass
class CounterpartyInfo:
    name: Optional[str] = None
    ico: Optional[str] = None
    dic: Optional[str] = None
    address: Optional[str] = None

@dataclass 
class DocumentInfo:
    document_number: Optional[str] = None
    document_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None

class AIProcessor:
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY')
        if not self.api_key:
            logger.warning("Groq API key není nastavený. AI funkce nebudou dostupné.")
            self.client = None
        else:
            self.client = Groq(api_key=self.api_key)
        
        # Inicializace služeb
        self.currency_converter = CurrencyConverter()
        self.ares_validator = AresValidator()
        
        self.expense_categories = {
            "501100": {"name": "Spotřeba materiálu", "keywords": ["materiál", "papír", "toner", "kancelářské potřeby", "psací potřeby", "složky", "šanony"]},
            "501300": {"name": "PHM", "keywords": ["benzín", "nafta", "palivo", "tankování", "čerpací stanice", "natural"]},
            "501400": {"name": "Drobný majetek", "keywords": ["notebook", "počítač", "monitor", "klávesnice", "myš", "telefon", "tablet"]},
            "512100": {"name": "Cestovné", "keywords": ["vlak", "autobus", "letenka", "taxi", "uber", "bolt", "mhd", "jízdenka"]},
            "513100": {"name": "Reprezentace", "keywords": ["oběd", "večeře", "klient", "káva", "restaurace", "občerstvení", "meeting"]},
            "518100": {"name": "Nájemné", "keywords": ["nájem", "kancelář", "pronájem", "prostor", "místnost"]},
            "518200": {"name": "Telefon a internet", "keywords": ["telefon", "internet", "mobil", "data", "tarif", "vodafone", "o2", "t-mobile"]},
            "518300": {"name": "Software", "keywords": ["software", "aplikace", "předplatné", "licence", "adobe", "microsoft", "google", "cloud"]},
            "518400": {"name": "Poštovné", "keywords": ["pošta", "známky", "balík", "doporučeně", "kurýr", "zásilka"]},
            "518500": {"name": "Právní a poradenské služby", "keywords": ["právník", "advokát", "účetní", "daňový poradce", "konzultace"]},
            "518600": {"name": "Marketing a reklama", "keywords": ["reklama", "inzerce", "facebook", "google ads", "marketing", "propagace"]},
            "518900": {"name": "Ostatní služby", "keywords": ["služba", "servis", "oprava", "údržba", "úklid"]},
            "521100": {"name": "Mzdy", "keywords": ["mzda", "plat", "odměna", "výplata"]},
            "524100": {"name": "Zákonné sociální pojištění", "keywords": ["sociální pojištění", "zdravotní pojištění", "pojistné"]},
            "538100": {"name": "Ostatní daně a poplatky", "keywords": ["daň", "poplatek", "správní poplatek", "kolky"]},
            "549100": {"name": "Ostatní provozní náklady", "keywords": ["ostatní", "jiné", "různé"]},
            "568100": {"name": "Bankovní poplatky", "keywords": ["bankovní poplatek", "vedení účtu", "převod", "transakce"]}
        }
        
        self.income_categories = {
            "602100": {"name": "Tržby za služby", "keywords": ["faktura", "služba", "práce", "konzultace", "projekt", "zakázka"]},
            "602200": {"name": "Tržby za poradenství", "keywords": ["poradenství", "konzultace", "školení", "workshop"]},
            "604100": {"name": "Tržby za zboží", "keywords": ["prodej", "zboží", "produkt", "výrobek"]},
            "648100": {"name": "Ostatní provozní výnosy", "keywords": ["ostatní", "jiné", "různé"]}
        }

    async def process_message(self, message: str) -> Optional[Dict[str, Any]]:
        try:
            message_lower = message.lower()
            
            transaction_data = self._extract_basic_info(message)
            
            if not transaction_data or transaction_data['amount'] == 0:
                if self.client:
                    transaction_data = await self._process_with_ai(message)
            else:
                transaction_data = self._categorize_transaction(transaction_data, message_lower)
            
            if transaction_data and transaction_data.get('amount', 0) > 0:
                logger.info(f"Zpracovaná transakce: {transaction_data}")
                return transaction_data
            
            return None
            
        except Exception as e:
            logger.error(f"Chyba při zpracování zprávy: {str(e)}")
            return None

    def _extract_basic_info(self, message: str) -> Dict[str, Any]:
        message_lower = message.lower()
        
        # Použijeme currency converter pro rozpoznání částky a měny
        amount, currency, original_text = self.currency_converter.parse_amount_and_currency(message)
        
        if not amount or amount <= 0:
            return None
        
        expense_keywords = ['koupil', 'koupit', 'zaplatil', 'zaplatit', 'platba za', 'náklad', 
                          'výdaj', 'utratil', 'stálo', 'cena', 'platím', 'platba', 'faktura za']
        income_keywords = ['dostal', 'přišla platba', 'přišlo', 'příjem', 'tržba', 'faktura od', 
                         'zaplatili', 'uhradili', 'platba od', 'výnos', 'prodej', 'honorář']
        
        trans_type = None
        for keyword in expense_keywords:
            if keyword in message_lower:
                trans_type = 'expense'
                break
        
        if not trans_type:
            for keyword in income_keywords:
                if keyword in message_lower:
                    trans_type = 'income'
                    break
        
        if not trans_type:
            trans_type = 'expense' if any(word in message_lower for word in ['za', 'koupil', 'platba']) else 'income'
        
        description = self._extract_description(message, float(amount))
        
        # Převod na CZK pro uložení
        try:
            amount_czk = self.currency_converter.convert_to_czk(amount, currency) if currency != 'CZK' else amount
        except ValueError:
            # Pokud se nepodaří převést, použijeme původní částku jako CZK
            amount_czk = amount
            currency = 'CZK'
        
        return {
            'type': trans_type,
            'amount': float(amount_czk),  # CZK pro kompatibilitu
            'original_amount': float(amount),  # Původní částka
            'original_currency': currency,
            'exchange_rate': float(self.currency_converter.get_rate(currency)) if currency != 'CZK' else 1.0,
            'description': description,
            'original_message': message,
            'original_text': original_text
        }

    def _extract_description(self, message: str, amount: float) -> str:
        description = re.sub(r'\d+[\s\d]*\s*(?:kč|czk|korun)?', '', message, flags=re.IGNORECASE)
        description = re.sub(r'\s+', ' ', description).strip()
        
        remove_words = ['jsem', 'mám', 'bylo', 'bude', 'za', 'od', 'pro', 'na']
        words = description.split()
        filtered_words = [w for w in words if w.lower() not in remove_words or len(words) <= 3]
        description = ' '.join(filtered_words)
        
        if len(description) < 3:
            description = message[:50]
        
        return description.capitalize()

    def _categorize_transaction(self, transaction_data: Dict[str, Any], message_lower: str) -> Dict[str, Any]:
        categories = self.expense_categories if transaction_data['type'] == 'expense' else self.income_categories
        
        best_category = None
        best_score = 0
        
        for category_code, category_info in categories.items():
            score = 0
            for keyword in category_info['keywords']:
                if keyword in message_lower:
                    score += len(keyword)
            
            if score > best_score:
                best_score = score
                best_category = category_code
        
        if not best_category:
            best_category = "549100" if transaction_data['type'] == 'expense' else "648100"
        
        category_info = categories.get(best_category, {})
        transaction_data['category'] = best_category
        transaction_data['category_name'] = category_info.get('name', 'Ostatní')
        
        return transaction_data

    async def _process_with_ai(self, message: str) -> Optional[Dict[str, Any]]:
        if not self.client:
            return None
        
        try:
            prompt = self._create_ai_prompt(message)
            
            response = await self._call_groq_api(prompt)
            
            if response:
                return self._parse_ai_response(response, message)
            
            return None
            
        except Exception as e:
            logger.error(f"Chyba při AI zpracování: {str(e)}")
            return None

    def _create_ai_prompt(self, message: str) -> str:
        expense_cats = "\n".join([f"- {code}: {info['name']} (klíčová slova: {', '.join(info['keywords'][:3])})" 
                                 for code, info in list(self.expense_categories.items())[:10]])
        income_cats = "\n".join([f"- {code}: {info['name']}" 
                               for code, info in self.income_categories.items()])
        
        return f"""Jsi český účetní expert. Analyzuj tuto zprávu a urči:
1. Typ transakce (income/expense)
2. Částku (včetně desetinných míst)
3. Měnu (CZK, EUR, USD, GBP, atd.)
4. Kategorii podle českých účetních osnov
5. Stručný popis

DŮLEŽITÉ:
- Částky mohou obsahovat desetinná místa (123.45 nebo 123,45)
- Měny: € = EUR, $ = USD, £ = GBP, Kč = CZK
- Pokud není uvedena měna, předpokládej CZK
- Zachovej přesnost na 2 desetinná místa

Zpráva: {message}

Kategorie pro výdaje:
{expense_cats}

Kategorie pro příjmy:
{income_cats}

Pokud zpráva neobsahuje transakci, vrať null.

Vrať pouze JSON bez dalšího textu:
{{
    "type": "income" nebo "expense",
    "amount": 123.45,
    "currency": "EUR",
    "category": "518300",
    "category_name": "Software a služby",
    "description": "stručný popis (max 50 znaků)"
}}"""

    async def _call_groq_api(self, prompt: str) -> Optional[str]:
        try:
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",  # Nejlevnější a nejrychlejší model
                messages=[
                    {"role": "system", "content": "Jsi účetní expert pro české OSVČ. Odpovídáš pouze validním JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=200
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Groq API chyba: {str(e)}")
            return None

    def _parse_ai_response(self, response: str, original_message: str) -> Optional[Dict[str, Any]]:
        try:
            response = response.strip()
            if response.startswith('```json'):
                response = response[7:]
            if response.endswith('```'):
                response = response[:-3]
            
            data = json.loads(response)
            
            if data is None or data == "null":
                return None
            
            if not all(key in data for key in ['type', 'amount']):
                return None
            
            if data['amount'] <= 0:
                return None
            
            # Zpracuj měnu a převod
            currency = data.get('currency', 'CZK')
            original_amount = Decimal(str(data['amount']))
            
            try:
                amount_czk = self.currency_converter.convert_to_czk(original_amount, currency) if currency != 'CZK' else original_amount
            except ValueError:
                # Pokud se nepodaří převést, použijeme původní částku jako CZK
                amount_czk = original_amount
                currency = 'CZK'
            
            data['original_message'] = original_message
            data['original_amount'] = float(original_amount)
            data['original_currency'] = currency
            data['exchange_rate'] = float(self.currency_converter.get_rate(currency)) if currency != 'CZK' else 1.0
            data['amount'] = float(amount_czk)  # Převedeno na CZK
            
            if 'category' not in data:
                if data['type'] == 'expense':
                    data['category'] = '549100'
                    data['category_name'] = 'Ostatní provozní náklady'
                else:
                    data['category'] = '648100'
                    data['category_name'] = 'Ostatní provozní výnosy'
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"Chyba při parsování AI odpovědi: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Neočekávaná chyba při parsování: {str(e)}")
            return None

    def get_category_suggestions(self, transaction_type: str) -> list:
        categories = self.expense_categories if transaction_type == 'expense' else self.income_categories
        return [
            {"code": code, "name": info["name"], "keywords": info["keywords"][:3]}
            for code, info in categories.items()
        ][:5]

    async def process_ocr_text(self, ocr_text: str, confidence: float = 0.0) -> Optional[Dict[str, Any]]:
        """
        Zpracuje text z OCR a extrahuje účetní data
        """
        if not self.client or not ocr_text.strip():
            return None
            
        try:
            prompt = self._create_enhanced_ai_prompt(ocr_text, is_ocr=True)
            response = await self._call_groq_api_enhanced(prompt)
            
            if response:
                parsed_data = self._parse_enhanced_ai_response(response, ocr_text)
                if parsed_data:
                    parsed_data['ocr_confidence'] = confidence
                    parsed_data['ai_processed'] = True
                return parsed_data
            
            return None
            
        except Exception as e:
            logger.error(f"Chyba při zpracování OCR textu: {str(e)}")
            return None

    def _create_enhanced_ai_prompt(self, text: str, is_ocr: bool = False) -> str:
        """
        Vytvoří pokročilý prompt pro AI s podporou rozšířených účetních dat
        """
        context = "OCR text z účtenky/faktury" if is_ocr else "zpráva od uživatele"
        
        return f"""Jsi expert český účetní AI. Analyzuj tento {context} a extrahuj VŠECHNA dostupná účetní data.

TEXT: {text}

Vrať JSON se VŠEMI dostupnými údaji (null pro chybějící):
{{
    "type": "income/expense",
    "amount": 123.45,
    "currency": "CZK",
    "category": "518300",
    "category_name": "Software",
    "description": "Stručný popis",
    
    "document_info": {{
        "document_number": "2024001234",
        "document_date": "2024-03-15",
        "due_date": "2024-04-15", 
        "payment_date": "2024-03-20"
    }},
    
    "counterparty": {{
        "name": "Firma s.r.o.",
        "ico": "12345678",
        "dic": "CZ12345678",
        "address": "Ulice 123, Praha"
    }},
    
    "payment_info": {{
        "payment_method": "bankovní_převod",
        "bank_account": "123456789/0300",
        "variable_symbol": "2024001234",
        "constant_symbol": "0308",
        "specific_symbol": null
    }},
    
    "items": [
        {{
            "description": "Položka 1",
            "quantity": 2.0,
            "unit": "ks", 
            "unit_price": 100.00,
            "unit_price_with_vat": 121.00,
            "vat_rate": 21,
            "total_without_vat": 200.00,
            "vat_amount": 42.00,
            "total_with_vat": 242.00,
            "item_category_code": "518300",
            "item_category_name": "Software"
        }}
    ],
    
    "vat_info": {{
        "vat_rate": 21,
        "vat_base": 200.00,
        "vat_amount": 42.00,
        "vat_included": true
    }}
}}

KATEGORIE - hlavní výdaje:
501100: Materiál, 501300: PHM, 501400: Drobný majetek, 512100: Cestovné, 
513100: Reprezentace, 518100: Nájemné, 518200: Telefon/internet, 
518300: Software, 518500: Právní služby, 518600: Marketing, 518900: Ostatní služby

KATEGORIE - hlavní příjmy: 
602100: Služby, 602200: Poradenství, 604100: Zboží, 648100: Ostatní

DŮLEŽITÉ:
- Datum ve formátu YYYY-MM-DD
- Částky s desetinnými místy 
- IČO pouze 8 číslic, DIČ začíná CZ
- payment_method: hotovost/bankovní_převod/karta/online
- Pokud není jasné, použij null
- Vrať pouze validní JSON!"""

    async def _call_groq_api_enhanced(self, prompt: str) -> Optional[str]:
        """
        Volání Groq API s rozšířenými parametry pro složitější parsování
        """
        try:
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",  # Silnější model pro složitější úkoly
                messages=[
                    {
                        "role": "system", 
                        "content": "Jsi expert český účetní AI specialista. Extrahuješ strukturovaná účetní data. Odpovídáš pouze validním JSON."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Nižší teplota pro přesnější výsledky
                max_tokens=1000   # Více tokenů pro komplexní odpovědi
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Groq API enhanced chyba: {str(e)}")
            return None

    def _parse_enhanced_ai_response(self, response: str, original_text: str) -> Optional[Dict[str, Any]]:
        """
        Parsuje rozšířenou AI odpověď s podporou všech nových polí
        """
        try:
            response = response.strip()
            if response.startswith('```json'):
                response = response[7:]
            if response.endswith('```'):
                response = response[:-3]
            
            data = json.loads(response)
            
            if data is None or data == "null":
                return None
                
            if not all(key in data for key in ['type', 'amount']):
                return None
                
            if data['amount'] <= 0:
                return None
            
            # Základní zpracování měny a převodu
            currency = data.get('currency', 'CZK')
            original_amount = Decimal(str(data['amount']))
            
            try:
                amount_czk = self.currency_converter.convert_to_czk(original_amount, currency) if currency != 'CZK' else original_amount
            except ValueError:
                amount_czk = original_amount
                currency = 'CZK'
            
            # Sestavení základních dat
            result = {
                'original_message': original_text,
                'type': data['type'],
                'amount': float(amount_czk),
                'original_amount': float(original_amount),
                'original_currency': currency,
                'exchange_rate': float(self.currency_converter.get_rate(currency)) if currency != 'CZK' else 1.0,
                'description': data.get('description', ''),
                'category': data.get('category', '549100' if data['type'] == 'expense' else '648100'),
                'category_name': data.get('category_name', 'Ostatní'),
                'processed_by_ai': True,
                'ai_confidence': 0.8,
                'ai_model_used': 'llama-3.1-8b-instant'
            }
            
            # Rozšířené dokumentové údaje
            if 'document_info' in data and data['document_info']:
                doc_info = data['document_info']
                result.update({
                    'document_number': doc_info.get('document_number'),
                    'document_date': self._parse_date(doc_info.get('document_date')),
                    'due_date': self._parse_date(doc_info.get('due_date')),
                    'payment_date': self._parse_date(doc_info.get('payment_date'))
                })
            
            # Protistrana
            if 'counterparty' in data and data['counterparty']:
                cp = data['counterparty']
                result.update({
                    'counterparty_name': cp.get('name'),
                    'counterparty_ico': self._validate_ico(cp.get('ico')),
                    'counterparty_dic': cp.get('dic'),
                    'counterparty_address': cp.get('address')
                })
                
                # Validace IČO přes ARES
                if result.get('counterparty_ico'):
                    try:
                        ares_data = self.ares_validator.validate_ico(result['counterparty_ico'])
                        if ares_data and not result.get('counterparty_name'):
                            result['counterparty_name'] = ares_data.get('obchodni_firma', '')
                    except Exception as e:
                        logger.warning(f"ARES validace selhala: {str(e)}")
            
            # Platební údaje  
            if 'payment_info' in data and data['payment_info']:
                pay_info = data['payment_info']
                result.update({
                    'payment_method': pay_info.get('payment_method'),
                    'bank_account': pay_info.get('bank_account'),
                    'variable_symbol': pay_info.get('variable_symbol'),
                    'constant_symbol': pay_info.get('constant_symbol'),
                    'specific_symbol': pay_info.get('specific_symbol')
                })
            
            # DPH údaje
            if 'vat_info' in data and data['vat_info']:
                vat_info = data['vat_info']
                result.update({
                    'vat_rate': vat_info.get('vat_rate', 21),
                    'vat_base': float(vat_info['vat_base']) if vat_info.get('vat_base') else None,
                    'vat_amount': float(vat_info['vat_amount']) if vat_info.get('vat_amount') else None,
                    'vat_included': vat_info.get('vat_included', True)
                })
            
            # Položky faktury
            result['items'] = []
            if 'items' in data and data['items']:
                for item_data in data['items']:
                    try:
                        item = {
                            'description': item_data.get('description', ''),
                            'quantity': float(item_data.get('quantity', 1.0)),
                            'unit': item_data.get('unit', 'ks'),
                            'unit_price': float(item_data['unit_price']) if item_data.get('unit_price') else None,
                            'unit_price_with_vat': float(item_data['unit_price_with_vat']) if item_data.get('unit_price_with_vat') else None,
                            'vat_rate': int(item_data.get('vat_rate', 21)),
                            'total_without_vat': float(item_data['total_without_vat']) if item_data.get('total_without_vat') else None,
                            'vat_amount': float(item_data['vat_amount']) if item_data.get('vat_amount') else None,
                            'total_with_vat': float(item_data['total_with_vat']) if item_data.get('total_with_vat') else None,
                            'item_category_code': item_data.get('item_category_code'),
                            'item_category_name': item_data.get('item_category_name')
                        }
                        result['items'].append(item)
                    except (ValueError, TypeError) as e:
                        logger.warning(f"Chyba při zpracování položky: {str(e)}")
                        continue
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Chyba při parsování rozšířené AI odpovědi: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Neočekávaná chyba při zpracování rozšířených dat: {str(e)}")
            return None

    def _parse_date(self, date_str: str) -> Optional[date]:
        """
        Parsuje datum z různých formátů
        """
        if not date_str:
            return None
            
        try:
            # YYYY-MM-DD
            if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
                return datetime.strptime(date_str, '%Y-%m-%d').date()
            # DD.MM.YYYY
            elif re.match(r'\d{1,2}\.\d{1,2}\.\d{4}', date_str):
                return datetime.strptime(date_str, '%d.%m.%Y').date()
            # DD/MM/YYYY
            elif re.match(r'\d{1,2}/\d{1,2}/\d{4}', date_str):
                return datetime.strptime(date_str, '%d/%m/%Y').date()
                
            return None
            
        except ValueError:
            logger.warning(f"Nepodařilo se parsovat datum: {date_str}")
            return None

    def _validate_ico(self, ico: str) -> Optional[str]:
        """
        Validuje a normalizuje IČO
        """
        if not ico:
            return None
            
        # Odstranění všech nečíselných znaků
        ico_clean = re.sub(r'\D', '', ico)
        
        # IČO musí mít přesně 8 číslic
        if len(ico_clean) == 8 and ico_clean.isdigit():
            return ico_clean
            
        return None

    async def process_enhanced_message(self, message: str, ocr_text: str = None, attachment_info: Dict = None) -> Optional[Dict[str, Any]]:
        """
        Hlavní metoda pro zpracování zpráv s rozšířenými funkcemi
        """
        try:
            # Pokud je přiložen OCR text, použijeme ho
            if ocr_text and ocr_text.strip():
                result = await self.process_ocr_text(ocr_text)
                if result:
                    # Přidáme informace o příloze
                    if attachment_info:
                        result['has_attachment'] = True
                        result['attachment_info'] = attachment_info
                    return result
            
            # Jinak používáme standardní zpracování s rozšířeným promptem
            if self.client:
                prompt = self._create_enhanced_ai_prompt(message, is_ocr=False)
                response = await self._call_groq_api_enhanced(prompt)
                
                if response:
                    return self._parse_enhanced_ai_response(response, message)
            
            # Fallback na původní zpracování
            return await self.process_message(message)
            
        except Exception as e:
            logger.error(f"Chyba při rozšířeném zpracování zprávy: {str(e)}")
            return None