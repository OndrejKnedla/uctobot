from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, List, Optional
import re
import logging
from datetime import datetime
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class VatResult:
    """Výsledek výpočtu DPH"""
    base: Decimal  # základ daně
    vat: Decimal   # výše DPH
    rate: int      # sazba DPH (21, 12, 0)
    total: Decimal # celkem s DPH
    includes_vat: bool  # zda částka už obsahuje DPH

@dataclass
class VatPeriodData:
    """Data DPH za období"""
    month: int
    year: int
    
    # Výstupy (prodeje)
    output_base_21: Decimal = Decimal('0')
    output_vat_21: Decimal = Decimal('0')
    output_base_12: Decimal = Decimal('0')
    output_vat_12: Decimal = Decimal('0')
    output_base_0: Decimal = Decimal('0')
    
    # Vstupy (nákupy)
    input_base_21: Decimal = Decimal('0')
    input_vat_21: Decimal = Decimal('0')
    input_base_12: Decimal = Decimal('0')
    input_vat_12: Decimal = Decimal('0')
    input_base_0: Decimal = Decimal('0')
    
    @property
    def total_output_vat(self) -> Decimal:
        """Celková DPH na výstupu"""
        return self.output_vat_21 + self.output_vat_12
    
    @property
    def total_input_vat(self) -> Decimal:
        """Celková DPH na vstupu (odpočet)"""
        return self.input_vat_21 + self.input_vat_12
    
    @property
    def vat_liability(self) -> Decimal:
        """Daň k zaplacení (+) nebo nadměrný odpočet (-)"""
        return self.total_output_vat - self.total_input_vat

class VatCalculator:
    def __init__(self, user_settings=None):
        self.user_settings = user_settings or {}
        
        # Klíčová slova pro detekci sazby DPH
        self.vat_keywords = {
            12: [
                # Potraviny
                'jídlo', 'jidlo', 'potraviny', 'oběd', 'obed', 'večeře', 'vecere',
                'snídaně', 'snidane', 'restaurace', 'pizza', 'burger', 'káva', 'kava',
                'pekárna', 'pekarna', 'maso', 'chléb', 'chleb', 'mléko', 'mleko',
                
                # Knihy a tisk
                'kniha', 'knihy', 'tisk', 'noviny', 'časopis', 'casopis',
                
                # Ubytování
                'hotel', 'ubytování', 'ubytovani', 'penzion', 'hostel',
                
                # Zdravotní
                'léky', 'leky', 'lékárna', 'lekarna', 'zdraví', 'zdravi',
                
                # Doprava veřejná
                'mhd', 'autobus', 'vlak', 'tramvaj', 'metro'
            ],
            
            0: [
                # Export
                'export', 'eu', 'evropská unie', 'evropska unie',
                
                # Zdravotní péče
                'lékař', 'lekar', 'zubař', 'zubar', 'nemocnice',
                'zdravotní pojišťovna', 'zdravotni pojistovna',
                
                # Vzdělání
                'škola', 'skola', 'univerzita', 'školné', 'skolne',
                
                # Finanční služby
                'banka', 'pojištění', 'pojisteni', 'úrok', 'urok'
            ]
        }
        
        # Slova indikující, že částka už obsahuje DPH
        self.includes_vat_keywords = [
            'včetně dph', 'vcetne dph', 'v tom dph', 's dph', 'celkem',
            'včetně', 'vcetne', 'brutto', 'total', 'konečná cena', 'konecna cena'
        ]
        
        # Slova indikující, že částka je bez DPH
        self.excludes_vat_keywords = [
            'bez dph', 'plus dph', '+ dph', 'netto', 'základ', 'zaklad'
        ]
    
    def calculate_vat(self, amount: Decimal, description: str, transaction_type: str, 
                     is_vat_payer: bool = True) -> VatResult:
        """
        Hlavní metoda pro výpočet DPH
        
        Args:
            amount: Částka
            description: Popis transakce
            transaction_type: 'income' nebo 'expense'
            is_vat_payer: Je uživatel plátce DPH?
        """
        if not is_vat_payer:
            # Neplátce DPH - žádné výpočty
            return VatResult(
                base=amount,
                vat=Decimal('0'),
                rate=0,
                total=amount,
                includes_vat=False
            )
        
        # Detekce sazby DPH
        vat_rate = self.detect_vat_rate(description)
        
        # Detekce, zda částka obsahuje DPH
        includes_vat = self.detect_vat_inclusion(description, transaction_type)
        
        if includes_vat:
            # Částka obsahuje DPH - vypočítáme základ
            vat_multiplier = Decimal('1') + Decimal(str(vat_rate)) / Decimal('100')
            vat_base = amount / vat_multiplier
            vat_amount = amount - vat_base
        else:
            # Částka je bez DPH - připočítáme DPH
            vat_base = amount
            vat_amount = amount * Decimal(str(vat_rate)) / Decimal('100')
        
        # Zaokrouhlení na haléře
        vat_base = vat_base.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        vat_amount = vat_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        total_amount = vat_base + vat_amount
        
        return VatResult(
            base=vat_base,
            vat=vat_amount,
            rate=vat_rate,
            total=total_amount,
            includes_vat=includes_vat
        )
    
    def detect_vat_rate(self, description: str) -> int:
        """Detekuje sazbu DPH podle popisu transakce"""
        description_lower = description.lower()
        
        # Kontrola klíčových slov pro 12%
        if any(keyword in description_lower for keyword in self.vat_keywords[12]):
            return 12
        
        # Kontrola klíčových slov pro 0%
        if any(keyword in description_lower for keyword in self.vat_keywords[0]):
            return 0
        
        # Hledání explicitní sazby v textu
        vat_rate_match = re.search(r'(\d{1,2})\s*%?\s*dph', description_lower)
        if vat_rate_match:
            rate = int(vat_rate_match.group(1))
            if rate in [0, 12, 21]:
                return rate
        
        # Výchozí sazba 21%
        return 21
    
    def detect_vat_inclusion(self, description: str, transaction_type: str) -> bool:
        """Zjistí, zda částka už obsahuje DPH"""
        description_lower = description.lower()
        
        # Explicitní indikátory
        if any(keyword in description_lower for keyword in self.includes_vat_keywords):
            return True
        
        if any(keyword in description_lower for keyword in self.excludes_vat_keywords):
            return False
        
        # Heuristiky podle typu transakce
        if transaction_type == 'income':
            # Příjmy - obvykle zadáváme bez DPH (fakturujeme navíc)
            return False
        else:
            # Výdaje - obvykle platíme s DPH (konečná cena)
            return True
    
    def calculate_period_vat(self, transactions: List[Dict[str, Any]], 
                           month: int, year: int) -> VatPeriodData:
        """Vypočítá DPH za celé období"""
        period_data = VatPeriodData(month=month, year=year)
        
        for transaction in transactions:
            # Kontrola období
            trans_date = transaction.get('created_at')
            if not trans_date or trans_date.month != month or trans_date.year != year:
                continue
            
            vat_info = transaction.get('vat_info', {})
            if not vat_info:
                continue
            
            base = Decimal(str(vat_info.get('base', 0)))
            vat = Decimal(str(vat_info.get('vat', 0)))
            rate = vat_info.get('rate', 0)
            trans_type = transaction.get('type')
            
            # Rozdělení podle typu a sazby
            if trans_type == 'income':  # Výstupy
                if rate == 21:
                    period_data.output_base_21 += base
                    period_data.output_vat_21 += vat
                elif rate == 12:
                    period_data.output_base_12 += base
                    period_data.output_vat_12 += vat
                elif rate == 0:
                    period_data.output_base_0 += base
            
            elif trans_type == 'expense':  # Vstupy
                if rate == 21:
                    period_data.input_base_21 += base
                    period_data.input_vat_21 += vat
                elif rate == 12:
                    period_data.input_base_12 += base
                    period_data.input_vat_12 += vat
                elif rate == 0:
                    period_data.input_base_0 += base
        
        return period_data
    
    def format_vat_summary(self, period_data: VatPeriodData) -> str:
        """Naformátuje souhrn DPH pro zobrazení"""
        month_names = {
            1: 'leden', 2: 'únor', 3: 'březen', 4: 'duben',
            5: 'květen', 6: 'červen', 7: 'červenec', 8: 'srpen',
            9: 'září', 10: 'říjen', 11: 'listopad', 12: 'prosinec'
        }
        
        month_name = month_names.get(period_data.month, str(period_data.month))
        
        # Výpočet termínu podání
        if period_data.month == 12:
            deadline_month = 1
            deadline_year = period_data.year + 1
        else:
            deadline_month = period_data.month + 1
            deadline_year = period_data.year
        
        deadline_date = f"25.{deadline_month}.{deadline_year}"
        
        summary = f"""📊 *DPH za {month_name} {period_data.year}:*

*VÝSTUPY (prodeje):*"""
        
        if period_data.output_base_21 > 0:
            summary += f"""
• Základ 21%: {self._format_amount(period_data.output_base_21)} Kč
• DPH 21%: {self._format_amount(period_data.output_vat_21)} Kč"""
        
        if period_data.output_base_12 > 0:
            summary += f"""
• Základ 12%: {self._format_amount(period_data.output_base_12)} Kč
• DPH 12%: {self._format_amount(period_data.output_vat_12)} Kč"""
        
        if period_data.output_base_0 > 0:
            summary += f"""
• Základ 0%: {self._format_amount(period_data.output_base_0)} Kč"""
        
        summary += f"""

*VSTUPY (nákupy):*"""
        
        if period_data.input_base_21 > 0:
            summary += f"""
• Základ 21%: {self._format_amount(period_data.input_base_21)} Kč
• DPH 21%: {self._format_amount(period_data.input_vat_21)} Kč"""
        
        if period_data.input_base_12 > 0:
            summary += f"""
• Základ 12%: {self._format_amount(period_data.input_base_12)} Kč
• DPH 12%: {self._format_amount(period_data.input_vat_12)} Kč"""
        
        if period_data.input_base_0 > 0:
            summary += f"""
• Základ 0%: {self._format_amount(period_data.input_base_0)} Kč"""
        
        # Výsledek
        liability = period_data.vat_liability
        
        summary += f"""

📍 *VÝSLEDEK:*"""
        
        if liability > 0:
            summary += f"""
Daň k zaplacení: {self._format_amount(liability)} Kč"""
        elif liability < 0:
            summary += f"""
Nadměrný odpočet: {self._format_amount(abs(liability))} Kč"""
        else:
            summary += f"""
Daň k zaplacení: 0 Kč"""
        
        summary += f"""

📅 Termín podání: do {deadline_date}"""
        
        # Počet dní do termínu
        today = datetime.now()
        deadline = datetime(deadline_year, deadline_month, 25)
        days_left = (deadline - today).days
        
        if days_left > 0:
            summary += f"""
⏰ Zbývá {days_left} dní!"""
        elif days_left == 0:
            summary += f"""
⚠️ Dnes je termín podání!"""
        else:
            summary += f"""
❌ Termín prošel před {abs(days_left)} dny!"""
        
        summary += f"""

Chceš exportovat XML? Napiš "export dph" """
        
        return summary
    
    def _format_amount(self, amount: Decimal) -> str:
        """Formátuje částku pro zobrazení"""
        return f"{amount:,.0f}".replace(",", " ")
    
    def validate_vat_data(self, period_data: VatPeriodData) -> Dict[str, Any]:
        """Validuje data před exportem DPH"""
        issues = []
        warnings = []
        
        # Kontrola, zda jsou nějaká data
        if (period_data.total_output_vat == 0 and 
            period_data.total_input_vat == 0):
            issues.append("❌ Žádné DPH transakce za dané období")
        
        # Upozornění na vysoké částky
        if period_data.vat_liability > 100000:
            warnings.append(f"⚠️ Vysoká daň k zaplacení: {self._format_amount(period_data.vat_liability)} Kč")
        
        # Kontrola poměru vstupů vs výstupů
        if (period_data.total_input_vat > 0 and 
            period_data.total_output_vat > 0):
            ratio = period_data.total_input_vat / period_data.total_output_vat
            if ratio > 0.8:
                warnings.append("⚠️ Vysoký poměr vstupní vs výstupní DPH")
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings
        }