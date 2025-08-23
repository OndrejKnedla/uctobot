"""
Service pro generování compliance reportů pro daňovou evidenci
Podle zákona č. 586/1992 Sb., o daních z příjmů
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from app.database.connection import db_manager
from app.database.models import User, Transaction
from app.services.tax_evidence_validator import TaxEvidenceValidator
from sqlalchemy import select, and_, func, desc

logger = logging.getLogger(__name__)

class ComplianceReportService:
    """
    Generuje compliance reporty pro daňovou evidenci neplátců DPH
    """
    
    def __init__(self):
        self.validator = TaxEvidenceValidator()
        
    async def generate_monthly_compliance_report(self, user_id: int, month: int = None, year: int = None) -> Dict:
        """
        Generuje měsíční compliance report
        
        Args:
            user_id: ID uživatele
            month: Měsíc (1-12), default aktuální
            year: Rok, default aktuální
            
        Returns:
            Dict s compliance reportem
        """
        if not month:
            month = datetime.now().month
        if not year:
            year = datetime.now().year
            
        async with db_manager.get_session() as db:
            # Získej uživatele
            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            
            if not user:
                return {'error': 'Uživatel nenalezen'}
            
            # Získej transakce za měsíc
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
            
            transactions_result = await db.execute(
                select(Transaction).where(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.transaction_date >= start_date,
                        Transaction.transaction_date < end_date
                    )
                ).order_by(desc(Transaction.transaction_date))
            )
            transactions = transactions_result.scalars().all()
            
            # Analýza compliance
            return await self._analyze_monthly_compliance(user, transactions, month, year)
    
    async def _analyze_monthly_compliance(self, user: User, transactions: List[Transaction], month: int, year: int) -> Dict:
        """Analyzuje compliance za měsíc"""
        
        report = {
            'user_id': user.id,
            'period': f"{month:02d}/{year}",
            'month_name': self._get_czech_month_name(month),
            'year': year,
            'generated_at': datetime.now(),
            'total_transactions': len(transactions),
            'compliance_summary': {},
            'risk_analysis': {},
            'detailed_issues': [],
            'recommendations': [],
            'audit_readiness': 'low'
        }
        
        if not transactions:
            report['compliance_summary'] = {
                'message': f"Žádné transakce za {report['month_name']} {year}",
                'overall_score': 100.0,
                'status': 'excellent'
            }
            return report
        
        # Kategorie podle completeness score
        excellent_count = 0  # 95-100%
        good_count = 0       # 80-94%
        warning_count = 0    # 60-79%
        critical_count = 0   # <60%
        
        total_amount = Decimal('0')
        high_risk_amount = Decimal('0')
        issues_by_type = {}
        incomplete_transactions = []
        
        for trans in transactions:
            total_amount += trans.amount_czk or 0
            score = trans.evidence_completeness_score or 0
            
            if score >= 95:
                excellent_count += 1
            elif score >= 80:
                good_count += 1
            elif score >= 60:
                warning_count += 1
            else:
                critical_count += 1
                high_risk_amount += trans.amount_czk or 0
                incomplete_transactions.append(trans)
            
            # Analýza problémů
            if trans.evidence_compliance_warnings:
                for warning in trans.evidence_compliance_warnings:
                    warning_type = self._categorize_warning(warning)
                    issues_by_type[warning_type] = issues_by_type.get(warning_type, 0) + 1
        
        # Výpočet celkového score
        if len(transactions) > 0:
            weighted_score = (
                (excellent_count * 100 + good_count * 87 + warning_count * 70 + critical_count * 30) 
                / len(transactions)
            )
        else:
            weighted_score = 100
        
        # Compliance summary
        report['compliance_summary'] = {
            'overall_score': round(weighted_score, 1),
            'status': self._get_compliance_status(weighted_score),
            'excellent_transactions': excellent_count,
            'good_transactions': good_count,
            'warning_transactions': warning_count,
            'critical_transactions': critical_count,
            'total_amount_czk': float(total_amount),
            'high_risk_amount_czk': float(high_risk_amount),
            'high_risk_percentage': round(float(high_risk_amount / total_amount * 100), 1) if total_amount > 0 else 0
        }
        
        # Risk analysis
        report['risk_analysis'] = {
            'audit_risk_level': self._calculate_audit_risk(weighted_score, float(high_risk_amount), float(total_amount)),
            'most_common_issues': self._get_top_issues(issues_by_type),
            'large_transactions_incomplete': len([t for t in incomplete_transactions if t.amount_czk > 10000]),
            'missing_ico_count': issues_by_type.get('missing_ico', 0),
            'missing_documents_count': issues_by_type.get('missing_documents', 0)
        }
        
        # Detailed issues
        if incomplete_transactions:
            report['detailed_issues'] = await self._analyze_detailed_issues(incomplete_transactions[:5])  # Top 5
        
        # Recommendations
        report['recommendations'] = self._generate_recommendations(report['compliance_summary'], report['risk_analysis'])
        
        # Audit readiness
        report['audit_readiness'] = self._assess_audit_readiness(weighted_score, report['risk_analysis'])
        
        return report
    
    def _categorize_warning(self, warning: str) -> str:
        """Kategorizuje warning podle typu"""
        warning_lower = warning.lower()
        
        if 'ičo' in warning_lower:
            return 'missing_ico'
        elif 'doklad' in warning_lower or 'číslo' in warning_lower:
            return 'missing_documents'
        elif 'dodavatel' in warning_lower or 'název' in warning_lower:
            return 'missing_counterparty'
        elif 'částka' in warning_lower:
            return 'missing_amount'
        elif 'popis' in warning_lower:
            return 'missing_description'
        else:
            return 'other'
    
    def _get_compliance_status(self, score: float) -> str:
        """Určí status na základě score"""
        if score >= 95:
            return 'excellent'
        elif score >= 80:
            return 'good'
        elif score >= 60:
            return 'warning'
        else:
            return 'critical'
    
    def _calculate_audit_risk(self, score: float, high_risk_amount: float, total_amount: float) -> str:
        """Vypočítá riziko při kontrole FÚ"""
        if score >= 90 and high_risk_amount / total_amount < 0.1:
            return 'low'
        elif score >= 75 and high_risk_amount / total_amount < 0.3:
            return 'medium'
        elif score >= 60:
            return 'high'
        else:
            return 'very_high'
    
    def _get_top_issues(self, issues_by_type: Dict[str, int], limit: int = 3) -> List[Dict]:
        """Vrátí nejčastější problémy"""
        sorted_issues = sorted(issues_by_type.items(), key=lambda x: x[1], reverse=True)
        
        issue_names = {
            'missing_ico': 'Chybějící IČO',
            'missing_documents': 'Chybějící čísla dokladů',
            'missing_counterparty': 'Chybějící dodavatel',
            'missing_amount': 'Chybějící částka',
            'missing_description': 'Chybějící popis',
            'other': 'Ostatní problémy'
        }
        
        return [
            {
                'type': issue_type,
                'name': issue_names.get(issue_type, issue_type),
                'count': count,
                'priority': 'high' if count > 5 else 'medium'
            }
            for issue_type, count in sorted_issues[:limit]
        ]
    
    async def _analyze_detailed_issues(self, transactions: List[Transaction]) -> List[Dict]:
        """Detailní analýza problematických transakcí"""
        issues = []
        
        for trans in transactions:
            issue = {
                'transaction_id': trans.id,
                'date': trans.transaction_date.strftime('%d.%m.%Y') if trans.transaction_date else 'N/A',
                'amount': float(trans.amount_czk or 0),
                'description': trans.description or 'Nespecifikováno',
                'completeness_score': float(trans.evidence_completeness_score or 0),
                'risk_level': trans.evidence_risk_level or 'high',
                'missing_required': trans.evidence_missing_required or [],
                'missing_recommended': trans.evidence_missing_recommended or [],
                'warnings': trans.evidence_compliance_warnings or [],
                'priority': 'high' if (trans.amount_czk or 0) > 10000 else 'medium'
            }
            issues.append(issue)
        
        return issues
    
    def _generate_recommendations(self, compliance_summary: Dict, risk_analysis: Dict) -> List[Dict]:
        """Generuje doporučení pro zlepšení compliance"""
        recommendations = []
        
        score = compliance_summary['overall_score']
        critical_count = compliance_summary['critical_transactions']
        
        if score < 60:
            recommendations.append({
                'priority': 'urgent',
                'title': 'Kriticky nízká úroveň compliance',
                'message': 'Více než polovina transakcí nemá dostatečné údaje pro daňovou evidenci. Doporučujeme neprodleně doplnit chybějící informace.',
                'action': 'Projděte nekompletní transakce a doplňte chybějící údaje'
            })
        elif score < 80:
            recommendations.append({
                'priority': 'high',
                'title': 'Zlepšení compliance potřebné',
                'message': 'Některé transakce nemají dostatečné údaje. Doporučujeme postupně doplnit chybějící informace.',
                'action': 'Doplňte alespoň IČO a čísla dokladů u větších výdajů'
            })
        
        if critical_count > 0:
            recommendations.append({
                'priority': 'high',
                'title': f'{critical_count} transakcí s nedostatečnými údaji',
                'message': 'Tyto transakce mohou způsobit problémy při kontrole finančního úřadu.',
                'action': 'Projděte nekompletní transakce v detailním výpisu'
            })
        
        if risk_analysis['large_transactions_incomplete'] > 0:
            recommendations.append({
                'priority': 'high',
                'title': 'Velké výdaje bez dokumentace',
                'message': f'{risk_analysis["large_transactions_incomplete"]} výdajů nad 10 000 Kč nemá dostatečnou dokumentaci.',
                'action': 'U výdajů nad 10 000 Kč vždy doplňte IČO a číslo dokladu'
            })
        
        if risk_analysis['missing_ico_count'] > 5:
            recommendations.append({
                'priority': 'medium',
                'title': 'Často chybějící IČO',
                'message': 'U mnoha transakcí chybí IČO dodavatele, což je důležité pro případnou kontrolu.',
                'action': 'Při focení účtenek dbejte na to, aby bylo vidět IČO (obvykle dole)'
            })
        
        # Pozitivní feedback
        if score >= 90:
            recommendations.append({
                'priority': 'info',
                'title': 'Výborná úroveň compliance',
                'message': 'Vaše účetnictví je na velmi dobré úrovni pro případnou kontrolu.',
                'action': 'Pokračujte v současné praxi'
            })
        
        return recommendations[:5]  # Max 5 doporučení
    
    def _assess_audit_readiness(self, score: float, risk_analysis: Dict) -> str:
        """Hodnotí připravenost na audit"""
        if score >= 90 and risk_analysis['audit_risk_level'] in ['low', 'medium']:
            return 'excellent'
        elif score >= 75 and risk_analysis['audit_risk_level'] != 'very_high':
            return 'good'
        elif score >= 60:
            return 'fair'
        else:
            return 'poor'
    
    def _get_czech_month_name(self, month: int) -> str:
        """Vrátí český název měsíce"""
        months = {
            1: "leden", 2: "únor", 3: "březen", 4: "duben",
            5: "květen", 6: "červen", 7: "červenec", 8: "srpen",
            9: "září", 10: "říjen", 11: "listopad", 12: "prosinec"
        }
        return months.get(month, f"měsíc {month}")
    
    async def generate_compliance_warning_for_user(self, user_id: int) -> Optional[str]:
        """
        Generuje varování o compliance pokud je potřeba
        Používá se pro automatické připomínky
        """
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        report = await self.generate_monthly_compliance_report(user_id, current_month, current_year)
        
        if report.get('error'):
            return None
        
        score = report['compliance_summary']['overall_score']
        critical_count = report['compliance_summary']['critical_transactions']
        
        if score < 50:
            return f"""🚨 **UPOZORNĚNÍ - Nízká compliance**
            
Vaše účetní evidence za {report['month_name']} má pouze {score:.1f}% úroveň kompletnosti.

⚠️ **Rizika:**
• {critical_count} transakcí s nedostatečnými údaji
• Vysoké riziko při kontrole finančního úřadu
• Možné problémy s uznatelností nákladů

💡 **Doporučení:**
• Doplňte chybějící IČO a čísla dokladů
• U výdajů nad 1000 Kč vždy focte celou účtenku
• Napište "přehled compliance" pro detaily"""
        
        elif score < 70 and critical_count > 3:
            return f"""⚠️ **Doporučení zlepšit compliance**
            
Evidence za {report['month_name']}: {score:.1f}% kompletnosti

📊 {critical_count} transakcí potřebuje doplnit údaje pro lepší průkaznost.

💡 Napište "přehled compliance" pro detailní analýzu."""
        
        return None  # Žádné varování není potřeba
    
    def format_monthly_report_for_whatsapp(self, report: Dict) -> str:
        """Formátuje měsíční report pro WhatsApp"""
        
        if report.get('error'):
            return f"❌ {report['error']}"
        
        summary = report['compliance_summary']
        risk = report['risk_analysis']
        
        # Emoji podle statusu
        status_emoji = {
            'excellent': '🟢',
            'good': '🟡',
            'warning': '🟠',
            'critical': '🔴'
        }
        
        emoji = status_emoji.get(summary['status'], '⚪')
        
        message = f"""📊 **Compliance Report - {report['month_name']} {report['year']}**

{emoji} **Celkové hodnocení: {summary['overall_score']:.1f}%**
Status: {self._get_status_text(summary['status'])}

📈 **Transakce ({summary['total_transactions']}):**
✅ Výborné: {summary['excellent_transactions']}
🟡 Dobré: {summary['good_transactions']}
⚠️ Varování: {summary['warning_transactions']}
🚨 Kritické: {summary['critical_transactions']}

💰 **Finanční analýza:**
• Celkem: {summary['total_amount_czk']:,.0f} Kč
• Riziková částka: {summary['high_risk_amount_czk']:,.0f} Kč ({summary['high_risk_percentage']}%)

🔍 **Audit připravenost:** {self._get_audit_readiness_text(report['audit_readiness'])}"""

        # Přidej top problémy
        if risk['most_common_issues']:
            message += "\n\n❌ **Nejčastější problémy:**"
            for issue in risk['most_common_issues'][:2]:
                message += f"\n• {issue['name']}: {issue['count']}x"
        
        # Přidej doporučení
        high_priority_recs = [r for r in report['recommendations'] if r['priority'] in ['urgent', 'high']]
        if high_priority_recs:
            message += "\n\n💡 **Doporučení:**"
            for rec in high_priority_recs[:2]:
                message += f"\n• {rec['title']}"
        
        message += "\n\n📝 Napište 'detaily compliance' pro kompletní analýzu"
        
        return message
    
    def _get_status_text(self, status: str) -> str:
        """Textový popis statusu"""
        status_texts = {
            'excellent': 'Výborné',
            'good': 'Dobré',
            'warning': 'Vyžaduje pozornost',
            'critical': 'Kritické - nutné řešit'
        }
        return status_texts.get(status, status)
    
    def _get_audit_readiness_text(self, readiness: str) -> str:
        """Textový popis audit readiness"""
        readiness_texts = {
            'excellent': 'Výborná - připraven na kontrolu',
            'good': 'Dobrá - menší nedostatky',
            'fair': 'Průměrná - doporučujeme zlepšit',
            'poor': 'Špatná - nutné zlepšení před kontrolou'
        }
        return readiness_texts.get(readiness, readiness)