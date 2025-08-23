"""
Validátor daňové evidence pro neplátce DPH
Podle zákona č. 586/1992 Sb., o daních z příjmů
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from app.database.models import User, Transaction

logger = logging.getLogger(__name__)

class TaxEvidenceValidator:
    """
    Validuje údaje pro daňovou evidenci neplátců DPH
    Zajišťuje compliance s českými daňovými požadavky
    """
    
    # Minimální požadavky podle zákona o daních z příjmů
    REQUIRED_FIELDS = {
        'expense': {
            'required': ['amount', 'description', 'counterparty_name'],
            'recommended': ['counterparty_ico', 'document_number', 'document_date'],
            'best': ['receipt_photo', 'counterparty_dic', 'counterparty_address']
        },
        'income': {
            'required': ['amount', 'description', 'counterparty_name'],
            'recommended': ['invoice_number', 'document_date', 'counterparty_ico'],
            'best': ['invoice_copy', 'counterparty_dic', 'payment_method']
        }
    }
    
    # Známí prodejci s IČO pro rychlé doplnění
    KNOWN_VENDORS = {
        'shell': {'ico': '60193328', 'name': 'Shell Czech Republic a.s.'},
        'benzina': {'ico': '60193531', 'name': 'BENZINA, s.r.o.'},
        'omv': {'ico': '25938037', 'name': 'OMV Česká republika, s.r.o.'},
        'mol': {'ico': '49240480', 'name': 'MOL Česká republika, s.r.o.'},
        'kaufland': {'ico': '25110161', 'name': 'Kaufland Česká republika v.o.s.'},
        'lidl': {'ico': '26178541', 'name': 'Lidl Česká republika v.o.s.'},
        'albert': {'ico': '44012373', 'name': 'Albert Česká republika, s.r.o.'},
        'billa': {'ico': '00685976', 'name': 'BILLA, s.r.o.'},
        'tesco': {'ico': '00677575', 'name': 'Tesco Stores ČR a.s.'},
        'penny': {'ico': '47115432', 'name': 'PENNY MARKET s.r.o.'}
    }
    
    def __init__(self):
        self.min_completeness_threshold = 60  # Minimální % pro přijetí
        self.recommended_threshold = 80      # Doporučená úroveň
        self.excellent_threshold = 95        # Excelentní úroveň
    
    def validate_transaction(self, data: Dict, user: User) -> Dict:
        """
        Validuje transakci pro daňovou evidenci
        
        Args:
            data: Transakční data
            user: Uživatel (pro kontext validation)
            
        Returns:
            Dict s výsledky validace
        """
        result = {
            'valid': False,
            'completeness': 0.0,
            'missing_required': [],
            'missing_recommended': [],
            'warnings': [],
            'suggestions': [],
            'risk_level': 'high',
            'compliance_issues': []
        }
        
        transaction_type = data.get('type', 'expense')
        requirements = self.REQUIRED_FIELDS.get(transaction_type, self.REQUIRED_FIELDS['expense'])
        
        # Kontrola povinných údajů
        missing_required = []
        for field in requirements['required']:
            if not self._has_valid_value(data, field):
                missing_required.append(field)
        
        result['missing_required'] = missing_required
        
        # Kontrola doporučených údajů
        missing_recommended = []
        for field in requirements['recommended']:
            if not self._has_valid_value(data, field):
                missing_recommended.append(field)
        
        result['missing_recommended'] = missing_recommended
        
        # Výpočet úrovně kompletnosti
        total_required = len(requirements['required'])
        total_recommended = len(requirements['recommended'])
        total_best = len(requirements['best'])
        
        filled_required = total_required - len(missing_required)
        filled_recommended = total_recommended - len(missing_recommended)
        filled_best = sum(1 for field in requirements['best'] if self._has_valid_value(data, field))
        
        # Váhovaný výpočet kompletnosti
        required_weight = 0.6
        recommended_weight = 0.3
        best_weight = 0.1
        
        completeness = (
            (filled_required / total_required) * required_weight +
            (filled_recommended / total_recommended) * recommended_weight +
            (filled_best / total_best) * best_weight
        ) * 100
        
        result['completeness'] = round(completeness, 1)
        
        # Určení validity a rizikové úrovně
        if len(missing_required) == 0:
            result['valid'] = True
            
            if completeness >= self.excellent_threshold:
                result['risk_level'] = 'low'
            elif completeness >= self.recommended_threshold:
                result['risk_level'] = 'medium'
                result['warnings'].append("Doporučujeme doplnit více údajů pro lepší průkaznost")
            else:
                result['risk_level'] = 'medium-high'
                result['warnings'].append("⚠️ Nedostatečné údaje pro optimální daňovou evidenci")
        else:
            result['valid'] = False
            result['risk_level'] = 'high'
            result['warnings'].append("❌ Chybí povinné údaje pro daňovou evidenci!")
            
            # Compliance issues
            result['compliance_issues'] = self._check_compliance_issues(data, missing_required)
        
        # Generování návrhů na zlepšení
        result['suggestions'] = self._generate_suggestions(data, missing_required, missing_recommended)
        
        return result
    
    def _has_valid_value(self, data: Dict, field: str) -> bool:
        """Zkontroluje jestli má field validní hodnotu"""
        value = data.get(field)
        if value is None or value == "":
            return False
        if isinstance(value, str) and value.strip() == "":
            return False
        return True
    
    def _check_compliance_issues(self, data: Dict, missing_required: List[str]) -> List[str]:
        """Identifikuje konkrétní compliance problémy"""
        issues = []
        
        if 'amount' in missing_required:
            issues.append("Částka je povinná podle §7 odst. 7 ZDP")
        
        if 'counterparty_name' in missing_required:
            issues.append("Název dodavatele je povinný pro daňovou evidenci")
        
        if 'description' in missing_required:
            issues.append("Popis účelu výdaje je nutný pro uplatnění v daních")
        
        # Kontrola vysokých částek bez dokladů
        amount = data.get('amount', 0)
        if amount > 1000 and not data.get('document_number') and not data.get('receipt_photo'):
            issues.append("Výdaje nad 1000 Kč by měly mít průkazný doklad")
        
        if amount > 10000 and not data.get('counterparty_ico'):
            issues.append("Výdaje nad 10000 Kč vyžadují IČO dodavatele")
        
        return issues
    
    def _generate_suggestions(self, data: Dict, missing_required: List[str], missing_recommended: List[str]) -> List[str]:
        """Generuje konkrétní návyhy na zlepšení"""
        suggestions = []
        
        # Návrhy pro povinná pole
        if 'counterparty_name' in missing_required:
            suggestions.append("📝 Doplňte název prodejce/dodavatele")
        
        if 'amount' in missing_required:
            suggestions.append("💰 Zadejte přesnou částku")
        
        if 'description' in missing_required:
            suggestions.append("📋 Popište účel výdaje")
        
        # Návrhy pro doporučená pole
        if 'counterparty_ico' in missing_recommended:
            vendor_name = data.get('counterparty_name', '').lower()
            known_vendor = self._find_known_vendor(vendor_name)
            
            if known_vendor:
                suggestions.append(f"🏢 IČO {known_vendor['name']}: {known_vendor['ico']}")
            else:
                suggestions.append("🏢 Doplňte IČO dodavatele (najdete na účtence)")
        
        if 'document_number' in missing_recommended:
            suggestions.append("📄 Zapište číslo dokladu (z účtenky/faktury)")
        
        if 'document_date' in missing_recommended:
            suggestions.append("📅 Doplňte datum nákupu")
        
        # Obecné návrhy
        if not data.get('receipt_photo'):
            suggestions.append("📸 Nejlépe vyfoťte celou účtenku - 100% průkaznost!")
        
        return suggestions
    
    def _find_known_vendor(self, vendor_name: str) -> Optional[Dict]:
        """Najde známého prodejce v databázi"""
        if not vendor_name:
            return None
        
        vendor_name = vendor_name.lower().strip()
        
        for key, vendor_info in self.KNOWN_VENDORS.items():
            if key in vendor_name or vendor_name in key:
                return vendor_info
        
        return None
    
    def get_quick_vendor_options(self, description: str) -> List[Dict]:
        """Vrátí rychlé možnosti prodejců podle popisu"""
        description = description.lower()
        options = []
        
        if any(word in description for word in ['benzín', 'nafta', 'palivo', 'tank']):
            options.extend([
                {'name': 'Shell', 'ico': '60193328'},
                {'name': 'Benzina', 'ico': '60193531'},
                {'name': 'OMV', 'ico': '25938037'},
                {'name': 'MOL', 'ico': '49240480'}
            ])
        
        elif any(word in description for word in ['potraviny', 'nákup', 'jídlo', 'supermarket']):
            options.extend([
                {'name': 'Kaufland', 'ico': '25110161'},
                {'name': 'Lidl', 'ico': '26178541'},
                {'name': 'Albert', 'ico': '44012373'},
                {'name': 'Billa', 'ico': '00685976'},
                {'name': 'Tesco', 'ico': '00677575'}
            ])
        
        return options[:4]  # Max 4 možnosti
    
    def format_validation_message(self, validation_result: Dict, data: Dict) -> str:
        """Formátuje zprávu o validaci pro uživatele"""
        result = validation_result
        
        if result['valid'] and result['risk_level'] == 'low':
            return self._format_success_message(result, data)
        elif result['valid'] and result['risk_level'] in ['medium', 'medium-high']:
            return self._format_warning_message(result, data)
        else:
            return self._format_error_message(result, data)
    
    def _format_success_message(self, result: Dict, data: Dict) -> str:
        """Zpráva pro kompletní transakci"""
        return f"""✅ **Doklad je kompletní!**

📊 Úroveň kompletnosti: {result['completeness']}%
🛡️ Riziko při kontrole: minimální

👍 Všechny potřebné údaje pro daňovou evidenci jsou k dispozici."""
    
    def _format_warning_message(self, result: Dict, data: Dict) -> str:
        """Zpráva pro transakci s varováním"""
        message = f"""⚠️ **Transakce uložena s varováním**

📊 Úroveň kompletnosti: {result['completeness']}%
🔍 Riziko při kontrole: {result['risk_level']}

"""
        
        if result['suggestions']:
            message += "💡 **Doporučení pro zlepšení:**\n"
            for suggestion in result['suggestions'][:3]:  # Max 3 návrhy
                message += f"• {suggestion}\n"
        
        return message
    
    def _format_error_message(self, result: Dict, data: Dict) -> str:
        """Zpráva pro nevalidní transakci"""
        message = f"""❌ **Nedostatečné údaje pro daňovou evidenci**

📊 Kompletnost: {result['completeness']}%
⚠️ Riziko: vysoké při kontrole FÚ

🚨 **Chybí povinné údaje:**
"""
        
        field_names = {
            'amount': 'Částka',
            'description': 'Popis účelu',
            'counterparty_name': 'Název dodavatele'
        }
        
        for field in result['missing_required']:
            field_name = field_names.get(field, field)
            message += f"• {field_name}\n"
        
        if result['compliance_issues']:
            message += f"\n📋 **Právní upozornění:**\n"
            for issue in result['compliance_issues'][:2]:  # Max 2 upozornění
                message += f"• {issue}\n"
        
        return message
    
    def get_monthly_compliance_summary(self, user_id: int, month: datetime) -> Dict:
        """Vrátí měsíční přehled compliance"""
        # TODO: Implementovat po vytvoření databázových změn
        return {
            'total_transactions': 0,
            'complete_transactions': 0,
            'incomplete_transactions': 0,
            'high_risk_transactions': 0,
            'compliance_score': 0.0,
            'audit_readiness': 'low'
        }