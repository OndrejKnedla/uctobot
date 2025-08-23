import requests
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta
import re
import logging

logger = logging.getLogger(__name__)

class CurrencyConverter:
    def __init__(self):
        self.rates = {}
        self.last_update = None
        self.update_rates()
        
        # Mapování symbolů na kódy měn
        self.symbol_to_currency = {
            '€': 'EUR',
            '$': 'USD', 
            '£': 'GBP',
            'Kč': 'CZK',
            'kč': 'CZK',
            ',-': 'CZK'
        }
        
        # Podporované měny
        self.supported_currencies = {
            'EUR': 'euro',
            'USD': 'dolar',
            'GBP': 'libra',
            'PLN': 'zlotý',
            'HUF': 'forint',
            'CHF': 'frank',
            'CZK': 'koruna'
        }
    
    def update_rates(self):
        """Stáhne denní kurz z ČNB API"""
        try:
            url = "https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            # Parse ČNB format
            lines = response.text.split('\n')
            self.rates = {'CZK': Decimal('1.0')}
            
            for line in lines[2:]:  # Skip header
                if '|' in line:
                    parts = line.split('|')
                    if len(parts) >= 5:
                        currency = parts[3].strip()  # EUR, USD, etc.
                        rate_str = parts[4].strip().replace(',', '.')
                        amount_str = parts[2].strip()
                        
                        try:
                            rate = Decimal(rate_str)
                            amount = Decimal(amount_str)
                            # Některé měny jsou per 100 (např. JPY)
                            self.rates[currency] = rate / amount
                        except (ValueError, IndexError):
                            continue
            
            self.last_update = datetime.now()
            logger.info(f"Kurzovní lístek aktualizován: {len(self.rates)} měn")
            
        except Exception as e:
            logger.error(f"Chyba při stahování kurzů z ČNB: {str(e)}")
            # Fallback kurzy pro základní testování
            self.rates = {
                'CZK': Decimal('1.0'),
                'EUR': Decimal('24.50'),
                'USD': Decimal('22.80'),
                'GBP': Decimal('28.90'),
                'PLN': Decimal('5.60')
            }
            self.last_update = datetime.now()
    
    def convert_to_czk(self, amount: Decimal, currency: str) -> Decimal:
        """Převede částku na CZK"""
        if currency == 'CZK':
            return amount
        
        # Update rates if older than 1 day
        if not self.last_update or datetime.now() - self.last_update > timedelta(days=1):
            self.update_rates()
        
        if currency in self.rates:
            converted = amount * self.rates[currency]
            return converted.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        else:
            raise ValueError(f"Neznámá měna: {currency}")
    
    def get_rate(self, currency: str) -> Decimal:
        """Vrátí aktuální kurz měny vůči CZK"""
        if currency == 'CZK':
            return Decimal('1.0')
        
        if not self.last_update or datetime.now() - self.last_update > timedelta(days=1):
            self.update_rates()
        
        return self.rates.get(currency, Decimal('0'))
    
    def parse_amount_and_currency(self, message: str):
        """
        Rozpozná částku a měnu ze zprávy
        Returns: (amount: Decimal, currency: str, original_text: str)
        """
        message = message.strip()
        
        # Regex patterns pro různé formáty
        patterns = [
            # Symbol před částkou: €123.45, $49.99, £234.50
            r'([€$£])\s*([0-9]+(?:\s*[0-9]{3})*(?:[.,][0-9]{1,2})?)',
            
            # Symbol za částkou: 123.45€, 49.99$, 234.50£
            r'([0-9]+(?:\s*[0-9]{3})*(?:[.,][0-9]{1,2})?)\s*([€$£])',
            
            # Kód měny za částkou: 123.45 EUR, 49.99 USD, 234.50 GBP
            r'([0-9]+(?:\s*[0-9]{3})*(?:[.,][0-9]{1,2})?)\s*(EUR|USD|GBP|CZK|PLN|HUF|CHF)',
            
            # České formáty: 1234 Kč, 1234,50 Kč, 1 234,50 Kč
            r'([0-9]+(?:\s+[0-9]{3})*(?:[.,][0-9]{1,2})?)\s*(Kč|kč|,-)',
            
            # Obecné číslo (předpokládáme CZK): za 1234, celkem 1234.50
            r'(?:za|celkem|částka|platba)\s+([0-9]+(?:\s*[0-9]{3})*(?:[.,][0-9]{1,2})?)',
            
            # Prostý formát čísla
            r'([0-9]+(?:\s*[0-9]{3})*(?:[.,][0-9]{1,2})?)'
        ]
        
        for i, pattern in enumerate(patterns):
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                groups = match.groups()
                
                if i == 0:  # Symbol před částkou
                    symbol, amount_str = groups
                    currency = self.symbol_to_currency.get(symbol, 'CZK')
                elif i == 1:  # Symbol za částkou
                    amount_str, symbol = groups
                    currency = self.symbol_to_currency.get(symbol, 'CZK')
                elif i == 2:  # Kód měny za částkou
                    amount_str, currency = groups
                    currency = currency.upper()
                elif i == 3:  # České formáty
                    amount_str, currency_symbol = groups
                    currency = 'CZK'
                else:  # Ostatní formáty
                    amount_str = groups[0]
                    currency = 'CZK'
                
                # Vyčisti částku
                clean_amount = self._clean_amount_string(amount_str)
                
                try:
                    amount = Decimal(clean_amount)
                    if amount > 0:
                        return amount, currency, match.group(0)
                except (ValueError, IndexError):
                    continue
        
        return None, None, None
    
    def _clean_amount_string(self, amount_str: str) -> str:
        """Vyčistí řetězec částky na standardní formát"""
        # Odstraň mezery mezi číslicemi
        cleaned = re.sub(r'\s+', '', amount_str)
        
        # Rozpoznej tisícové oddělovače vs. desetinné čárky
        if ',' in cleaned and '.' in cleaned:
            # Má oba - poslední je desetinná čárka/tečka
            if cleaned.rfind(',') > cleaned.rfind('.'):
                # Čárka je později = desetinná čárka
                cleaned = cleaned.replace('.', '').replace(',', '.')
            else:
                # Tečka je později = desetinná tečka
                cleaned = cleaned.replace(',', '')
        elif ',' in cleaned:
            # Pouze čárka - je to desetinná čárka pokud následují max 2 číslice
            comma_pos = cleaned.rfind(',')
            after_comma = cleaned[comma_pos + 1:]
            if len(after_comma) <= 2 and after_comma.isdigit():
                cleaned = cleaned.replace(',', '.')
            else:
                cleaned = cleaned.replace(',', '')
        
        return cleaned
    
    def format_amount(self, amount: Decimal, currency: str) -> str:
        """Naformátuje částku pro zobrazení"""
        if currency == 'CZK':
            return f"{amount:,.2f}".replace(",", " ").replace(".", ",") + " Kč"
        else:
            symbol = next((k for k, v in self.symbol_to_currency.items() if v == currency), currency)
            if symbol in ['€', '$', '£']:
                return f"{amount:,.2f} {symbol}".replace(",", " ")
            else:
                return f"{amount:,.2f} {currency}".replace(",", " ")
    
    def get_currency_name(self, currency: str) -> str:
        """Vrátí český název měny"""
        return self.supported_currencies.get(currency, currency)