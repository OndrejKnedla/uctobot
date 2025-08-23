"""
Inteligentní AI procesor pro postupné sbírání daňových údajů
"""
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import re

from app.database.models import User, Transaction
from app.services.tax_evidence_validator import TaxEvidenceValidator

logger = logging.getLogger(__name__)

class SmartAIProcessor:
    """
    Inteligentně vyžaduje údaje podle situace a postupně je doplňuje
    Zaměřeno na compliance s daňovou legislativou pro neplátce DPH
    """
    
    def __init__(self):
        self.validator = TaxEvidenceValidator()
        self.conversation_context = {}  # Cache pro rozpracované transakce
    
    async def process_for_non_vat_payer(self, message: str, user: User, context_id: str = None) -> Dict:
        """
        Zpracování pro neplátce DPH s validací a postupným doplňováním
        
        Args:
            message: Zpráva od uživatele
            user: Uživatel
            context_id: ID konverzace pro držení kontextu
            
        Returns:
            Dict s výsledkem zpracování
        """
        try:
            # Získej nebo vytvoř kontext konverzace
            if not context_id:
                context_id = f"user_{user.id}_{int(datetime.now().timestamp())}"
            
            context = self.conversation_context.get(context_id, {
                'state': 'initial',
                'parsed_data': {},
                'validation_attempts': 0
            })
            
            # Zpracuj zprávu podle stavu konverzace
            if context['state'] == 'initial':
                return await self._handle_initial_message(message, user, context_id, context)
            elif context['state'] == 'awaiting_vendor':
                return await self._handle_vendor_response(message, user, context_id, context)
            elif context['state'] == 'awaiting_ico':
                return await self._handle_ico_response(message, user, context_id, context)
            elif context['state'] == 'awaiting_document':
                return await self._handle_document_response(message, user, context_id, context)
            else:
                # Fallback na initial
                return await self._handle_initial_message(message, user, context_id, context)
                
        except Exception as e:
            logger.error(f"Error in SmartAIProcessor: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': "❌ Nastala chyba při zpracování. Zkuste to znovu."
            }
    
    async def _handle_initial_message(self, message: str, user: User, context_id: str, context: Dict) -> Dict:
        """Zpracování první zprávy v konverzaci"""
        
        # Parsni základní údaje ze zprávy
        parsed_data = await self._parse_transaction_message(message)
        
        # Aktualizuj kontext
        context['parsed_data'] = parsed_data
        context['state'] = 'initial'
        context['validation_attempts'] += 1
        self.conversation_context[context_id] = context
        
        # Validace
        validation = self.validator.validate_transaction(parsed_data, user)
        
        if validation['valid'] and validation['risk_level'] == 'low':
            # Excellentní - ulož rovnou
            transaction = await self._save_transaction(parsed_data, user)
            del self.conversation_context[context_id]  # Vyčisti kontext
            
            return {
                'success': True,
                'transaction': transaction,
                'message': self._format_excellent_response(transaction, validation),
                'context_completed': True
            }
        
        elif validation['valid'] and validation['risk_level'] in ['medium', 'medium-high']:
            # Dobrá úroveň - ulož s varováním
            transaction = await self._save_transaction(parsed_data, user)
            del self.conversation_context[context_id]  # Vyčisti kontext
            
            return {
                'success': True,
                'transaction': transaction,
                'message': self._format_warning_response(transaction, validation),
                'context_completed': True
            }
        
        else:
            # Nedostatečné údaje - vyžádej více info
            return await self._request_missing_info(parsed_data, validation, context_id, context)
    
    async def _handle_vendor_response(self, message: str, user: User, context_id: str, context: Dict) -> Dict:
        """Zpracování odpovědi na otázku o dodavateli"""
        
        parsed_data = context['parsed_data']
        message_lower = message.lower().strip()
        
        # Zpracuj odpověď
        if message_lower in ['přeskočit', 'skip', 'nevím', 'neznam']:
            # Pokračuj bez dodavatele
            parsed_data['counterparty_name'] = 'Neznámý dodavatel'
            return await self._continue_validation(parsed_data, user, context_id, context)
        
        # Zkus najít rychlou volbu
        quick_options = self.validator.get_quick_vendor_options(parsed_data.get('description', ''))
        for option in quick_options:
            if option['name'].lower() in message_lower:
                parsed_data['counterparty_name'] = option['name']
                parsed_data['counterparty_ico'] = option['ico']
                return await self._continue_validation(parsed_data, user, context_id, context)
        
        # Použij jako název dodavatele
        parsed_data['counterparty_name'] = message.strip()
        return await self._continue_validation(parsed_data, user, context_id, context)
    
    async def _handle_ico_response(self, message: str, user: User, context_id: str, context: Dict) -> Dict:
        """Zpracování odpovědi na otázku o IČO"""
        
        parsed_data = context['parsed_data']
        message_lower = message.lower().strip()
        
        if message_lower in ['přeskočit', 'skip', 'nevím', 'ano']:
            # Pokračuj bez IČO nebo s již navrhovaným
            return await self._continue_validation(parsed_data, user, context_id, context)
        
        # Extrahuj IČO
        ico_match = re.search(r'\d{8}', message)
        if ico_match:
            parsed_data['counterparty_ico'] = ico_match.group()
        
        return await self._continue_validation(parsed_data, user, context_id, context)
    
    async def _handle_document_response(self, message: str, user: User, context_id: str, context: Dict) -> Dict:
        """Zpracování odpovědi na otázku o číslu dokladu"""
        
        parsed_data = context['parsed_data']
        message_lower = message.lower().strip()
        
        if message_lower not in ['přeskočit', 'skip']:
            parsed_data['document_number'] = message.strip()
        
        return await self._continue_validation(parsed_data, user, context_id, context)
    
    async def _continue_validation(self, parsed_data: Dict, user: User, context_id: str, context: Dict) -> Dict:
        """Pokračuje ve validaci s aktualizovanými daty"""
        
        context['parsed_data'] = parsed_data
        validation = self.validator.validate_transaction(parsed_data, user)
        
        if validation['valid']:
            # Údaje jsou nyní dostatečné
            transaction = await self._save_transaction(parsed_data, user)
            del self.conversation_context[context_id]  # Vyčisti kontext
            
            return {
                'success': True,
                'transaction': transaction,
                'message': self._format_success_response(transaction, validation),
                'context_completed': True
            }
        else:
            # Stále nedostatečné, pokračuj v dotazování
            return await self._request_missing_info(parsed_data, validation, context_id, context)
    
    async def _request_missing_info(self, parsed_data: Dict, validation: Dict, context_id: str, context: Dict) -> Dict:
        """Vyžádá chybějící informace chytrým způsobem"""
        
        # Najdi nejdůležitější chybějící údaj
        missing_required = validation['missing_required']
        
        if 'counterparty_name' in missing_required:
            context['state'] = 'awaiting_vendor'
            question = self._generate_vendor_question(parsed_data)
        elif 'counterparty_ico' in validation['missing_recommended']:
            context['state'] = 'awaiting_ico'
            question = self._generate_ico_question(parsed_data)
        elif 'document_number' in validation['missing_recommended']:
            context['state'] = 'awaiting_document'
            question = self._generate_document_question(parsed_data)
        else:
            # Fallback - ulož co máme
            transaction = await self._save_transaction(parsed_data, user)
            del self.conversation_context[context_id]
            
            return {
                'success': True,
                'transaction': transaction,
                'message': self._format_incomplete_response(transaction, validation),
                'context_completed': True
            }
        
        # Aktualizuj kontext
        self.conversation_context[context_id] = context
        
        return {
            'needs_more_info': True,
            'question': question,
            'context_id': context_id,
            'current_data': parsed_data
        }
    
    def _generate_vendor_question(self, parsed_data: Dict) -> str:
        """Generuje otázku na dodavatele s rychlými volbami"""
        
        description = parsed_data.get('description', '')
        quick_options = self.validator.get_quick_vendor_options(description)
        
        question = "❓ **Od koho je tento výdaj?**\n\n"
        
        if quick_options:
            question += "**Rychlé volby:**\n"
            for option in quick_options:
                question += f"• {option['name']}\n"
            question += "• Jiné (napište název)\n\n"
        
        question += "Nebo pošlete **fotku účtenky** 📸 pro automatické rozpoznání"
        
        return question
    
    def _generate_ico_question(self, parsed_data: Dict) -> str:
        """Generuje otázku na IČO"""
        
        vendor_name = parsed_data.get('counterparty_name', 'dodavatel')
        
        # Zkus najít známé IČO
        validator_result = self.validator._find_known_vendor(vendor_name.lower())
        
        if validator_result:
            return f"""❓ **Je to {vendor_name} s IČO {validator_result['ico']}?**

• **Ano** ✅
• **Ne** (napište správné IČO)
• **Přeskočit** (pokračovat bez IČO)

💡 IČO najdete na účtence, obvykle dole."""
        else:
            return f"""❓ **Jaké je IČO dodavatele {vendor_name}?**

Podívejte se na účtenku - IČO je obvykle uvedeno dole.

• Napište 8-místné číslo
• **Přeskočit** (pokračovat bez IČO)
• Nebo pošlete **fotku účtenky** 📸"""
    
    def _generate_document_question(self, parsed_data: Dict) -> str:
        """Generuje otázku na číslo dokladu"""
        
        return """❓ **Číslo účtenky/faktury?** (doporučené)

• Napište číslo z dokladu
• **Přeskočit** (pokračovat bez čísla)
• Nebo pošlete **fotku účtenky** 📸

💡 Číslo dokladu pomáhá při kontrolách FÚ"""
    
    async def _parse_transaction_message(self, message: str) -> Dict:
        """Parsne základní údaje z transakční zprávy"""
        
        # Základní parsing (zjednodušený - v reálné implementaci by byl komplexnější)
        data = {
            'description': message,
            'original_message': message,
            'transaction_date': datetime.now()
        }
        
        # Extrakce částky
        amount_patterns = [
            r'(\d+(?:\.\d{2})?)\s*(?:kč|czk|korun)',
            r'(\d+)\s*(?:euro?|eur|€)',
            r'(\d+(?:\.\d{2})?)'
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, message.lower())
            if match:
                try:
                    data['amount'] = float(match.group(1))
                    break
                except ValueError:
                    pass
        
        # Pokus o extrakci dodavatele z zprávy
        message_lower = message.lower()
        known_vendors = self.validator._find_known_vendor(message_lower)
        if known_vendors:
            data['counterparty_name'] = known_vendors['name']
            data['counterparty_ico'] = known_vendors['ico']
        else:
            # Heuristic - hledej známé názvy
            vendor_hints = ['shell', 'benzina', 'omv', 'mol', 'alza', 'kaufland', 'lidl', 'albert', 'billa', 'tesco']
            for hint in vendor_hints:
                if hint in message_lower:
                    # Najdi odpovídající vendor
                    vendor_info = self.validator.KNOWN_VENDORS.get(hint)
                    if vendor_info:
                        data['counterparty_name'] = vendor_info['name']
                        data['counterparty_ico'] = vendor_info['ico']
                        break
        
        # Extrakce IČO pokud je v zpráve
        ico_match = re.search(r'ičo[:\s]*(\d{8})|ico[:\s]*(\d{8})|(\d{8})', message_lower)
        if ico_match:
            ico = ico_match.group(1) or ico_match.group(2) or ico_match.group(3)
            if len(ico) == 8:
                data['counterparty_ico'] = ico
        
        # Heuristika pro typ transakce
        if any(word in message.lower() for word in ['příjem', 'platba', 'faktura', 'dostal']):
            data['type'] = 'income'
        else:
            data['type'] = 'expense'
        
        return data
    
    async def _save_transaction(self, data: Dict, user: User) -> Transaction:
        """Uloží transakci do databáze s tax compliance údaji"""
        from app.database.connection import db_manager
        from app.database.models import Transaction
        
        async with db_manager.get_session() as db:
            # Validate with tax evidence validator
            validation_result = self.validator.validate_transaction(data, user)
            
            # Create new transaction
            transaction = Transaction(
                user_id=user.id,
                type=data.get('type', 'expense'),
                original_message=data.get('original_message', data.get('description', 'AI processed')),
                description=data.get('description', 'Nespecifikováno'),
                amount_czk=data.get('amount', 0),
                original_amount=data.get('amount', 0),
                original_currency='CZK',
                exchange_rate=1.0,
                
                # Kategorizace
                category_code=data.get('category_code', '549100'),
                category_name=data.get('category_name', 'Ostatní provozní náklady'),
                auto_categorized=True,
                
                # Dokumentační údaje
                document_number=data.get('document_number'),
                document_date=data.get('document_date'),
                counterparty_name=data.get('counterparty_name'),
                counterparty_ico=data.get('counterparty_ico'),
                counterparty_dic=data.get('counterparty_dic'),
                counterparty_address=data.get('counterparty_address'),
                
                # DPH údaje
                vat_rate=data.get('vat_rate', 21),
                vat_included=data.get('vat_included', True),
                
                # AI processing
                processed_by_ai=True,
                ai_confidence=0.8,
                ai_model_used='SmartAIProcessor-v1',
                
                # Tax evidence compliance
                evidence_completeness_score=validation_result['completeness'],
                evidence_risk_level=validation_result['risk_level'],
                evidence_missing_required=validation_result['missing_required'],
                evidence_missing_recommended=validation_result['missing_recommended'],
                evidence_compliance_warnings=validation_result['warnings'],
                evidence_validation_date=datetime.now(),
                evidence_needs_attention=validation_result['risk_level'] in ['high', 'medium-high'],
                
                transaction_date=data.get('transaction_date', datetime.now())
            )
            
            db.add(transaction)
            await db.commit()
            await db.refresh(transaction)
            
            logger.info(f"Transaction saved with compliance data: {transaction.id} - score {validation_result['completeness']}% - risk {validation_result['risk_level']}")
            return transaction
    
    def _format_excellent_response(self, transaction, validation: Dict) -> str:
        """Formátuje odpověď pro excellentní transakci"""
        
        return f"""✅ **Transakce uložena - VÝBORNĚ!**

💰 **{transaction.description}:** {transaction.amount_czk} Kč
🏢 **Dodavatel:** {transaction.counterparty_name or 'N/A'}
{f"🆔 **IČO:** {transaction.counterparty_ico}" if transaction.counterparty_ico else ""}
{f"📄 **Doklad:** {transaction.document_number}" if transaction.document_number else ""}

📊 **Kompletnost:** {validation['completeness']}%
🛡️ **Riziko při kontrole:** minimální

🎯 Všechny údaje pro daňovou evidenci jsou kompletní!"""
    
    def _format_warning_response(self, transaction, validation: Dict) -> str:
        """Formátuje odpověď s varováním"""
        
        message = f"""⚠️ **Transakce uložena s doporučením**

💰 **{transaction.description}:** {transaction.amount_czk} Kč
🏢 **Dodavatel:** {transaction.counterparty_name or 'Nespecifikováno'}
{f"🆔 **IČO:** {transaction.counterparty_ico}" if transaction.counterparty_ico else ""}

📊 **Kompletnost:** {validation['completeness']}%
🔍 **Riziko:** {validation['risk_level']}

💡 **Pro zlepšení příště:**"""
        
        for suggestion in validation['suggestions'][:2]:
            message += f"\n• {suggestion}"
        
        return message
    
    def _format_success_response(self, transaction, validation: Dict) -> str:
        """Formátuje úspěšnou odpověď po doplnění údajů"""
        
        return f"""✅ **Transakce dokončena a uložena!**

💰 **{transaction.description}:** {transaction.amount_czk} Kč
🏢 **Dodavatel:** {transaction.counterparty_name}
{f"🆔 **IČO:** {transaction.counterparty_ico}" if transaction.counterparty_ico else ""}
{f"📄 **Doklad:** {transaction.document_number}" if transaction.document_number else ""}

📊 **Kompletnost:** {validation['completeness']}%

🙏 Díky za doplnění údajů - transakce je připravena na případnou kontrolu!"""
    
    def _format_incomplete_response(self, transaction, validation: Dict) -> str:
        """Formátuje odpověď pro nekompletní transakci"""
        
        return f"""⚠️ **Transakce uložena - NEDOSTATEČNÉ ÚDAJE**

💰 **{transaction.description}:** {transaction.amount_czk} Kč

📊 **Kompletnost:** {validation['completeness']}%
🚨 **Riziko při kontrole FÚ:** vysoké

❌ **Chybí důležité údaje pro daňovou evidenci**

💡 **Příště prosím:**
• Vyfoťte celou účtenku 📸
• Nebo doplňte název dodavatele a IČO

📞 **Při kontrole** můžete mít problémy s průkazností tohoto výdaje."""
    
    def cleanup_old_contexts(self, max_age_hours: int = 24):
        """Vyčistí staré kontexty konverzací"""
        current_time = datetime.now().timestamp()
        
        contexts_to_remove = []
        for context_id in self.conversation_context:
            # Extrahuj timestamp z context_id
            try:
                timestamp = float(context_id.split('_')[-1])
                age_hours = (current_time - timestamp) / 3600
                
                if age_hours > max_age_hours:
                    contexts_to_remove.append(context_id)
            except (ValueError, IndexError):
                # Nevalidní formát, smaž
                contexts_to_remove.append(context_id)
        
        for context_id in contexts_to_remove:
            del self.conversation_context[context_id]
        
        logger.info(f"Cleaned up {len(contexts_to_remove)} old conversation contexts")