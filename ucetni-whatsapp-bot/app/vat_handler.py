from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import tempfile
import os
import logging
from decimal import Decimal

from utils.vat_calculator import VatCalculator, VatPeriodData
from utils.vat_xml_generator import VatXmlGenerator

logger = logging.getLogger(__name__)

class VatHandler:
    """Handler pro DPH funkcionalita"""
    
    def __init__(self):
        self.vat_calculator = VatCalculator()
    
    async def handle_vat_command(self, command: str, user_id: int, 
                                user_settings: Dict[str, Any]) -> str:
        """
        Zpracovává DPH příkazy
        
        Args:
            command: Příkaz (/dph, /dph-export, /dph-historie)
            user_id: ID uživatele
            user_settings: Nastavení uživatele
        """
        
        # Kontrola, zda je uživatel plátce DPH
        if not user_settings.get('vat_payer', False):
            return self._get_non_vat_payer_message()
        
        try:
            if command in ['/dph', 'dph']:
                return await self._show_vat_status(user_id, user_settings)
            
            elif command in ['/dph-export', 'dph-export', 'export dph']:
                return await self._export_vat_xml(user_id, user_settings)
            
            elif command in ['/dph-historie', 'dph-historie']:
                return await self._show_vat_history(user_id, user_settings)
            
            elif command in ['/dph-nastaveni', 'dph-nastaveni']:
                return self._show_vat_settings(user_settings)
            
            else:
                return self._get_vat_help_message()
                
        except Exception as e:
            logger.error(f"Chyba v DPH handleru: {str(e)}")
            return "❌ Nastala chyba při zpracování DPH příkazu. Zkuste to znovu."
    
    async def _show_vat_status(self, user_id: int, user_settings: Dict[str, Any]) -> str:
        """Zobrazí aktuální stav DPH"""
        
        # Pro demo použijeme aktuální měsíc
        now = datetime.now()
        
        # Mock data pro testování
        mock_transactions = await self._get_mock_vat_transactions(user_id, now.month, now.year)
        
        # Vypočítáme DPH za období
        period_data = self.vat_calculator.calculate_period_vat(
            mock_transactions, now.month, now.year
        )
        
        # Naformátujeme souhrn
        summary = self.vat_calculator.format_vat_summary(period_data)
        
        return summary
    
    async def _export_vat_xml(self, user_id: int, user_settings: Dict[str, Any]) -> str:
        """Exportuje XML soubory pro DPH"""
        
        now = datetime.now()
        
        # Získáme data za aktuální období
        mock_transactions = await self._get_mock_vat_transactions(user_id, now.month, now.year)
        
        period_data = self.vat_calculator.calculate_period_vat(
            mock_transactions, now.month, now.year
        )
        
        # Validace před exportem
        xml_generator = VatXmlGenerator(user_settings)
        validation = xml_generator.validate_before_export(period_data, mock_transactions)
        
        if not validation['valid']:
            error_msg = "❌ *Nelze exportovat XML*\\n\\n"
            error_msg += "\\n".join(validation['issues'])
            if validation['warnings']:
                error_msg += "\\n\\n*Upozornění:*\\n"
                error_msg += "\\n".join(validation['warnings'])
            return error_msg
        
        try:
            # Generujeme XML soubory
            dp3_xml = xml_generator.generate_dph_priznani(period_data)
            kh1_xml = xml_generator.generate_kontrolni_hlaseni(period_data, mock_transactions)
            
            # Pro demo pouze simulujeme uložení souborů
            file_paths = {
                'dp3': f"dph_priznani_{now.month}_{now.year}.xml",
                'kh1': f"kontrolni_hlaseni_{now.month}_{now.year}.xml"
            }
            
            # Generujeme souhrn pro uživatele
            summary = xml_generator.generate_export_summary(period_data, file_paths)
            
            logger.info(f"XML soubory pro DPH vygenerovány pro uživatele {user_id}")
            
            return summary
            
        except Exception as e:
            logger.error(f"Chyba při generování XML: {str(e)}")
            return "❌ Nastala chyba při generování XML souborů. Kontaktujte podporu."
    
    async def _show_vat_history(self, user_id: int, user_settings: Dict[str, Any]) -> str:
        """Zobrazí historii DPH"""
        
        return """📊 *Historie DPH:*

*Červen 2024:*
• Podáno: ✅ 24.7.2024
• Daň k zaplacení: 16 800 Kč
• Zaplaceno: ✅ 30.7.2024

*Květen 2024:*
• Podáno: ✅ 23.6.2024  
• Nadměrný odpočet: 5 240 Kč
• Vráceno: ✅ 15.7.2024

*Duben 2024:*
• Podáno: ✅ 25.5.2024
• Daň k zaplacení: 8 950 Kč
• Zaplaceno: ✅ 31.5.2024

📈 *Statistiky:*
• Průměrná měsíční daň: 6 837 Kč
• Celkem za rok: 68 370 Kč
• Počet podání: 6/12

Pro detaily napište: `/dph-detail červen`"""
    
    def _show_vat_settings(self, user_settings: Dict[str, Any]) -> str:
        """Zobrazí DPH nastavení"""
        
        vat_frequency = "měsíčně" if user_settings.get('vat_monthly', True) else "čtvrtletně"
        
        return f"""⚙️ *DPH Nastavení:*

📊 *Status:* {'✅ Plátce DPH' if user_settings.get('vat_payer', False) else '❌ Nejsi plátce DPH'}
📅 *Frekvence:* {vat_frequency}
🏢 *DIČ:* {user_settings.get('dic', 'Nenastaveno')}
📧 *Email:* {user_settings.get('email', 'Nenastaveno')}

⏰ *Připomínky:*
• 15. den v měsíci - příprava
• 23. den v měsíci - urgentní

🔧 *Změnit nastavení:*
• `/dph-frekvence` - změnit na čtvrtletní
• `/dph-pripominky` - nastavit připomínky  
• `/profil` - upravit DIČ a email"""
    
    def _get_non_vat_payer_message(self) -> str:
        """Zpráva pro neplátce DPH"""
        
        return """ℹ️ *Nejsi plátce DPH*

DPH funkce jsou dostupné pouze pro plátce DPH.

🤔 *Chceš se stát plátcem?*
Plátce DPH musíš být pokud:
• Tvůj roční obrat přesáhl 2 mil. Kč
• Registroval ses dobrovolně

📝 *Jak změnit:*
Napiš `/nastaveni` a změň DPH status.

💡 *Výhody plátce DPH:*
• Můžeš si odečíst DPH z nákupů
• Vypadáš profesionálně pro firmy
• Máš přístup k EU trhům"""
    
    def _get_vat_help_message(self) -> str:
        """Nápověda k DPH příkazům"""
        
        return """📊 *DPH Příkazy:*

• `/dph` - aktuální stav DPH
• `/dph-export` - stáhnout XML soubory
• `/dph-historie` - historie podání
• `/dph-nastaveni` - DPH nastavení

📝 *Často používané:*
• `export dph` - rychlý export
• `dph status` - zobrazit stav
• `připomínka dph` - nastavit upozornění

💡 *Tipy:*
• XML soubory podeš na daneelektronicky.cz
• Termín podání: do 25. dne následujícího měsíce
• Nezapomeň zaplatit daň do konce měsíce"""
    
    async def _get_mock_vat_transactions(self, user_id: int, month: int, year: int) -> List[Dict[str, Any]]:
        """Generuje mock transakce pro testování"""
        
        # Mock data pro demonstraci
        mock_transactions = [
            {
                'id': 1,
                'type': 'income',
                'amount': 125000,
                'description': 'Faktura za vývoj webu',
                'created_at': datetime(year, month, 15),
                'vat_info': {
                    'base': 125000,
                    'vat': 26250,
                    'rate': 21,
                    'total': 151250,
                    'includes_vat': False
                },
                'partner_vat_id': 'CZ12345678',
                'document_number': 'FAK202400001'
            },
            {
                'id': 2,
                'type': 'expense',
                'amount': 45000,
                'description': 'Nákup serverů',
                'created_at': datetime(year, month, 10),
                'vat_info': {
                    'base': 45000,
                    'vat': 9450,
                    'rate': 21,
                    'total': 54450,
                    'includes_vat': True
                },
                'partner_vat_id': 'CZ87654321',
                'document_number': 'DOK202400001'
            },
            {
                'id': 3,
                'type': 'income',
                'amount': 25000,
                'description': 'Konzultace IT',
                'created_at': datetime(year, month, 20),
                'vat_info': {
                    'base': 25000,
                    'vat': 5250,
                    'rate': 21,
                    'total': 30250,
                    'includes_vat': False
                },
                'partner_vat_id': 'CZ11223344',
                'document_number': 'FAK202400002'
            }
        ]
        
        return mock_transactions
    
    def calculate_vat_for_transaction(self, amount: Decimal, description: str, 
                                    transaction_type: str, user_settings: Dict[str, Any]) -> Dict[str, Any]:
        """Vypočítá DPH pro transakci"""
        
        is_vat_payer = user_settings.get('vat_payer', False)
        
        if not is_vat_payer:
            return {
                'base': float(amount),
                'vat': 0.0,
                'rate': 0,
                'total': float(amount),
                'includes_vat': False
            }
        
        vat_result = self.vat_calculator.calculate_vat(
            amount, description, transaction_type, is_vat_payer
        )
        
        return {
            'base': float(vat_result.base),
            'vat': float(vat_result.vat),
            'rate': vat_result.rate,
            'total': float(vat_result.total),
            'includes_vat': vat_result.includes_vat
        }