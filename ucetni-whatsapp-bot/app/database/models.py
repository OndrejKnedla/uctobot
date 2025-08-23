from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Index, Numeric, Date, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
import secrets

Base = declarative_base()

class User(Base):
    """Model pro uživatele"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    whatsapp_number = Column(String(50), unique=True, nullable=True, index=True)
    profile_name = Column(String(200))
    
    # Onboarding status
    onboarding_completed = Column(Boolean, default=False)
    onboarding_step = Column(String(50))  # 'start', 'name', 'ico', 'dic', 'business_type', 'completed'
    onboarding_data = Column(JSON)  # Temporary storage during onboarding
    
    # Business information (filled during onboarding)
    full_name = Column(String(200))  # Jméno a příjmení
    business_name = Column(String(200))  # Obchodní jméno (pokud jiné)
    ico = Column(String(8), index=True)  # 8-digit IČO
    dic = Column(String(12), index=True)  # DIČ (CZ + IČO)
    business_type = Column(String(50))  # 'it_programming', 'consulting', etc.
    
    # Address information
    street = Column(String(200))
    house_number = Column(String(10))
    city = Column(String(100))
    postal_code = Column(String(10))
    country = Column(String(50), default='Česká republika')
    
    # Additional business info
    vat_payer = Column(Boolean, default=False)  # Je plátce DPH?
    tax_mode = Column(String(20))  # 'pausalni', 'skutecne_60', 'skutecne_real'
    
    # SECURE ACTIVATION SYSTEM
    activation_token = Column(String(64), unique=True, nullable=True, index=True)  # 32-znak bezpečný kód
    activation_created_at = Column(DateTime, nullable=True)
    activation_expires_at = Column(DateTime, nullable=True)  # Platnost 48 hodin
    activation_used = Column(Boolean, default=False)
    activation_used_at = Column(DateTime, nullable=True)
    
    # WhatsApp activation status
    whatsapp_activated = Column(Boolean, default=False)
    activation_ip_address = Column(String(45), nullable=True)  # IP adresa při aktivaci
    
    # Email for payment and communication
    email = Column(String(200), nullable=True)
    
    # Trial and subscription
    subscription_status = Column(String(20), default='trial')  # trial, active, expired, cancelled
    subscription_plan = Column(String(20), nullable=True)  # monthly, yearly
    trial_ends_at = Column(DateTime)
    subscription_ends_at = Column(DateTime)
    
    # Payment provider data
    stripe_customer_id = Column(String(100), index=True)
    stripe_subscription_id = Column(String(100), index=True)
    comgate_customer_id = Column(String(100), index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    last_activity = Column(DateTime, default=func.now())
    
    # Relationships
    settings = relationship("UserSettings", back_populates="user", uselist=False)
    transactions = relationship("Transaction", back_populates="user")
    vat_records = relationship("VatRecord", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    invoices = relationship("Invoice", back_populates="user")
    activation_logs = relationship("ActivationLog", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, whatsapp_number='{self.whatsapp_number}', activated={self.whatsapp_activated})>"
    
    @classmethod
    def generate_activation_token(cls) -> str:
        """Generuje cryptographically secure 32-znakový aktivační token"""
        return secrets.token_hex(16)  # 16 bytů = 32 hexadecimálních znaků
    
    def create_activation_token(self) -> str:
        """Vytvoří nový aktivační token s expirací 48 hodin"""
        self.activation_token = self.generate_activation_token()
        self.activation_created_at = datetime.now()
        self.activation_expires_at = datetime.now() + timedelta(hours=48)
        self.activation_used = False
        self.activation_used_at = None
        return self.activation_token
    
    def is_activation_valid(self) -> bool:
        """Kontroluje platnost aktivačního tokenu"""
        if self.activation_used:
            return False
        if not self.activation_token or not self.activation_expires_at:
            return False
        return datetime.now() < self.activation_expires_at
    
    def activate_whatsapp(self, phone_number: str, ip_address: str = None) -> bool:
        """Aktivuje WhatsApp pro uživatele"""
        if not self.is_activation_valid():
            return False
        
        self.whatsapp_number = phone_number
        self.whatsapp_activated = True
        self.activation_used = True
        self.activation_used_at = datetime.now()
        self.activation_ip_address = ip_address
        return True
    
    def get_activation_status(self) -> dict:
        """Vrátí status aktivace"""
        return {
            'has_token': bool(self.activation_token),
            'token_valid': self.is_activation_valid() if self.activation_token else False,
            'whatsapp_activated': self.whatsapp_activated,
            'expires_at': self.activation_expires_at.isoformat() if self.activation_expires_at else None,
            'used_at': self.activation_used_at.isoformat() if self.activation_used_at else None
        }

class UserSettings(Base):
    """Nastavení uživatele"""
    __tablename__ = 'user_settings'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True)
    
    # Základní údaje
    full_name = Column(String(200))
    first_name = Column(String(100))
    last_name = Column(String(100))
    
    # Podnikatelské údaje
    ico = Column(String(20), index=True)
    dic = Column(String(20), index=True)
    company_name = Column(String(200))
    business_type = Column(String(50))  # it_programming, graphic_design, etc.
    
    # Adresa
    street = Column(String(200))
    house_number = Column(String(10))
    city = Column(String(100))
    postal_code = Column(String(10))
    country = Column(String(50), default='Česká republika')
    
    # Kontakt
    email = Column(String(200))
    phone = Column(String(20))
    
    # Daňové nastavení
    tax_mode = Column(String(20))  # pausalni, skutecne_60, skutecne_real
    vat_payer = Column(Boolean, default=False)
    vat_monthly = Column(Boolean, default=True)  # True=měsíčně, False=čtvrtletně
    vat_registration_date = Column(DateTime)
    
    # Finanční úřad
    tax_office_code = Column(String(10), default='001')
    tax_office_workplace = Column(String(10), default='01')
    okec_code = Column(String(10), default='620200')  # Programování
    
    # Bankovní spojení
    bank_connection = Column(JSON)  # {bank: 'fio', api_key: '...', account_number: '...'}
    
    # Notifikace
    reminder_settings = Column(JSON, default={
        'tax_advance': {'days_before': [5, 2], 'enabled': True},
        'vat': {'days_before': [7, 2], 'enabled': True},
        'annual_tax': {'days_before': [30, 7, 1], 'enabled': True}
    })
    
    # Preferované kategorie podle typu podnikání
    default_categories = Column(JSON)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="settings")
    
    def __repr__(self):
        return f"<UserSettings(user_id={self.user_id}, full_name='{self.full_name}')>"

class Transaction(Base):
    """Transakce - příjmy a výdaje"""
    __tablename__ = 'transactions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Základní údaje transakce
    type = Column(String(10), nullable=False)  # income, expense
    original_message = Column(Text, nullable=False)
    description = Column(String(500))
    
    # Částky - vždy v CZK pro účetnictví
    amount_czk = Column(Numeric(12, 2), nullable=False)
    
    # Původní měna (pokud jiná než CZK)
    original_amount = Column(Numeric(12, 2))
    original_currency = Column(String(3), default='CZK')
    exchange_rate = Column(Numeric(10, 6), default=1.0)
    conversion_date = Column(DateTime)
    
    # Kategorizace
    category_code = Column(String(10))  # 501100, 518300, etc.
    category_name = Column(String(100))
    auto_categorized = Column(Boolean, default=True)
    
    # DPH informace (pouze pro plátce DPH)
    vat_rate = Column(Integer, default=0)  # 0, 12, 21
    vat_base = Column(Numeric(12, 2))     # základ daně
    vat_amount = Column(Numeric(12, 2))   # výše DPH
    vat_included = Column(Boolean, default=False)  # byla DPH už v částce?
    
    # ROZŠÍŘENÉ DOKUMENTAČNÍ FIELDY
    document_number = Column(String(50))   # číslo faktury/dokladu
    document_date = Column(Date, nullable=True)         # Datum vystavení
    due_date = Column(Date, nullable=True)             # Datum splatnosti  
    payment_date = Column(Date, nullable=True)         # Datum úhrady
    
    # PROTISTRANA - rozšířené údaje
    counterparty_name = Column(String(200))  # "Alza.cz s.r.o."
    counterparty_ico = Column(String(8))     # "27082440" - pouze 8 číslic
    counterparty_dic = Column(String(12))    # "CZ27082440" - DIČ
    counterparty_address = Column(Text)
    
    # LEGACY fieldy (zachováme pro zpětnou kompatibilitu)
    partner_name = Column(String(200))     # název dodavatele/odběratele
    partner_vat_id = Column(String(20))    # DIČ partnera (pro kontrolní hlášení)
    partner_address = Column(Text)
    
    # PLATEBNÍ ÚDAJE
    payment_method = Column(String(20), nullable=True)  # "card", "bank_transfer", "cash"
    bank_account = Column(String(30), nullable=True)    # Číslo účtu protistrany
    variable_symbol = Column(String(10), nullable=True)
    constant_symbol = Column(String(4), nullable=True)
    specific_symbol = Column(String(10), nullable=True)
    
    # Dodatečné informace
    notes = Column(Text)
    tags = Column(JSON)  # ["important", "recurring", "travel"]
    
    # AI zpracování
    processed_by_ai = Column(Boolean, default=False)
    ai_confidence = Column(Numeric(3, 2))  # 0.85 = 85% jistota
    ai_model_used = Column(String(50))     # groq-llama-3.1-8b
    
    # TAX EVIDENCE COMPLIANCE TRACKING (Czech law compliance)
    evidence_completeness_score = Column(Numeric(5, 2), default=0.0)  # 0.0 - 100.0%
    evidence_risk_level = Column(String(20), default='high')  # low, medium, medium-high, high
    evidence_missing_required = Column(JSON)  # ['counterparty_name', 'amount']
    evidence_missing_recommended = Column(JSON)  # ['counterparty_ico', 'document_number']
    evidence_compliance_warnings = Column(JSON)  # ['Chybí IČO pro výdaj nad 10k']
    evidence_validation_date = Column(DateTime)  # Kdy byla naposledy validována
    evidence_needs_attention = Column(Boolean, default=False)  # Vyžaduje pozornost uživatele
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    transaction_date = Column(DateTime, default=func.now())
    
    # Indexy pro rychlé dotazy
    __table_args__ = (
        Index('ix_transactions_user_date', 'user_id', 'transaction_date'),
        Index('ix_transactions_user_type', 'user_id', 'type'),
        Index('ix_transactions_user_category', 'user_id', 'category_code'),
        Index('ix_transactions_vat', 'user_id', 'vat_rate', 'transaction_date'),
    )
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    items = relationship("TransactionItem", back_populates="transaction", cascade="all, delete-orphan")
    attachments = relationship("TransactionAttachment", back_populates="transaction", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, type='{self.type}', amount={self.amount_czk})>"
    
    @property
    def month(self) -> int:
        return self.transaction_date.month
    
    @property
    def year(self) -> int:
        return self.transaction_date.year
    
    @property
    def quarter(self) -> int:
        return (self.transaction_date.month - 1) // 3 + 1

class VatRecord(Base):
    """DPH evidence pro jednotlivá období"""
    __tablename__ = 'vat_records'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Období
    period_month = Column(Integer, nullable=False)
    period_year = Column(Integer, nullable=False)
    
    # Výstupy (uskutečněná zdanitelná plnění)
    output_base_21 = Column(Numeric(12, 2), default=0)
    output_vat_21 = Column(Numeric(12, 2), default=0)
    output_base_12 = Column(Numeric(12, 2), default=0)
    output_vat_12 = Column(Numeric(12, 2), default=0)
    output_base_0 = Column(Numeric(12, 2), default=0)
    
    # Vstupy (přijatá zdanitelná plnění)
    input_base_21 = Column(Numeric(12, 2), default=0)
    input_vat_21 = Column(Numeric(12, 2), default=0)
    input_base_12 = Column(Numeric(12, 2), default=0)
    input_vat_12 = Column(Numeric(12, 2), default=0)
    input_base_0 = Column(Numeric(12, 2), default=0)
    
    # Výsledek
    vat_liability = Column(Numeric(12, 2))  # kladné = k zaplacení, záporné = nadměrný odpočet
    
    # Stav podání
    filed = Column(Boolean, default=False)
    filed_date = Column(DateTime)
    xml_generated = Column(Boolean, default=False)
    xml_dp3_path = Column(String(500))  # cesta k DP3 souboru
    xml_kh1_path = Column(String(500))  # cesta k KH1 souboru
    
    # Platba
    paid = Column(Boolean, default=False)
    paid_date = Column(DateTime)
    paid_amount = Column(Numeric(12, 2))
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Indexy
    __table_args__ = (
        Index('ix_vat_records_user_period', 'user_id', 'period_year', 'period_month'),
    )
    
    # Relationships
    user = relationship("User", back_populates="vat_records")
    
    def __repr__(self):
        return f"<VatRecord(user_id={self.user_id}, period={self.period_month}/{self.period_year})>"
    
    @property
    def total_output_vat(self) -> Decimal:
        return (self.output_vat_21 or 0) + (self.output_vat_12 or 0)
    
    @property
    def total_input_vat(self) -> Decimal:
        return (self.input_vat_21 or 0) + (self.input_vat_12 or 0)

class BusinessCategory(Base):
    """Přednastavené kategorie podle typu podnikání"""
    __tablename__ = 'business_categories'
    
    id = Column(Integer, primary_key=True)
    business_type = Column(String(50), nullable=False)  # it_programming, graphic_design
    category_code = Column(String(10), nullable=False)  # 518300
    category_name = Column(String(100), nullable=False) # Software a služby
    is_primary = Column(Boolean, default=False)         # hlavní kategorie pro daný typ
    keywords = Column(JSON)  # ["software", "hosting", "saas"]
    
    def __repr__(self):
        return f"<BusinessCategory(type='{self.business_type}', code='{self.category_code}')>"

class Reminder(Base):
    """Připomínky pro daňové povinnosti"""
    __tablename__ = 'reminders'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Typ připomínky
    reminder_type = Column(String(20), nullable=False)  # tax_advance, vat, annual_tax
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Termíny
    due_date = Column(DateTime, nullable=False)
    remind_days_before = Column(Integer, default=7)
    
    # Status
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    dismissed = Column(Boolean, default=False)
    completed = Column(Boolean, default=False)
    
    # Metadata
    priority = Column(String(10), default='normal')  # low, normal, high, urgent
    category = Column(String(50))  # tax, vat, reporting, other
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Indexy
    __table_args__ = (
        Index('ix_reminders_user_due', 'user_id', 'due_date', 'sent'),
        Index('ix_reminders_type_due', 'reminder_type', 'due_date'),
    )
    
    def __repr__(self):
        return f"<Reminder(user_id={self.user_id}, type='{self.reminder_type}', due={self.due_date})>"

class ExportHistory(Base):
    """Historie exportů (XML, CSV)"""
    __tablename__ = 'export_history'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Typ exportu
    export_type = Column(String(20), nullable=False)  # csv, xml_dp3, xml_kh1
    file_name = Column(String(200))
    file_path = Column(String(500))
    file_size = Column(Integer)  # v bytech
    
    # Období exportu
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    
    # Metadata
    download_count = Column(Integer, default=0)
    expires_at = Column(DateTime)  # kdy soubor expire
    
    # Status
    status = Column(String(20), default='created')  # created, ready, expired, deleted
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<ExportHistory(user_id={self.user_id}, type='{self.export_type}', file='{self.file_name}')>"

# Inicializační data pro business_categories
BUSINESS_CATEGORIES_DATA = [
    # IT/Programování
    {'business_type': 'it_programming', 'category_code': '518300', 'category_name': 'Software a služby', 'is_primary': True, 'keywords': ['software', 'hosting', 'cloud', 'saas', 'api']},
    {'business_type': 'it_programming', 'category_code': '501400', 'category_name': 'Drobný majetek', 'is_primary': False, 'keywords': ['notebook', 'monitor', 'klávesnice', 'myš']},
    {'business_type': 'it_programming', 'category_code': '518200', 'category_name': 'Telefon a internet', 'is_primary': False, 'keywords': ['internet', 'telefon', 'mobil', 'data']},
    
    # Grafika/Design
    {'business_type': 'graphic_design', 'category_code': '518300', 'category_name': 'Software a služby', 'is_primary': True, 'keywords': ['adobe', 'figma', 'canva', 'sketch']},
    {'business_type': 'graphic_design', 'category_code': '501100', 'category_name': 'Spotřeba materiálu', 'is_primary': False, 'keywords': ['papír', 'tisk', 'barvy', 'materiál']},
    {'business_type': 'graphic_design', 'category_code': '501400', 'category_name': 'Drobný majetek', 'is_primary': False, 'keywords': ['tablet', 'stylus', 'tiskárna', 'scanner']},
    
    # Konzultace/Poradenství
    {'business_type': 'consulting', 'category_code': '513100', 'category_name': 'Reprezentace', 'is_primary': True, 'keywords': ['oběd', 'káva', 'meeting', 'klient']},
    {'business_type': 'consulting', 'category_code': '512100', 'category_name': 'Cestovné', 'is_primary': False, 'keywords': ['vlak', 'taxi', 'uber', 'letenka']},
    {'business_type': 'consulting', 'category_code': '518200', 'category_name': 'Telefon a internet', 'is_primary': False, 'keywords': ['telefon', 'internet', 'zoom', 'teams']},
    
    # Řemesla/Stavebnictví
    {'business_type': 'trades_construction', 'category_code': '501100', 'category_name': 'Spotřeba materiálu', 'is_primary': True, 'keywords': ['materiál', 'cement', 'dřevo', 'kovy']},
    {'business_type': 'trades_construction', 'category_code': '501300', 'category_name': 'PHM', 'is_primary': False, 'keywords': ['benzín', 'nafta', 'palivo']},
    {'business_type': 'trades_construction', 'category_code': '501400', 'category_name': 'Drobný majetek', 'is_primary': False, 'keywords': ['nářadí', 'vrtačka', 'kladivo']},
    
    # E-commerce
    {'business_type': 'e_commerce', 'category_code': '501200', 'category_name': 'Spotřeba zboží', 'is_primary': True, 'keywords': ['zboží', 'produkty', 'inventory']},
    {'business_type': 'e_commerce', 'category_code': '518600', 'category_name': 'Marketing a reklama', 'is_primary': False, 'keywords': ['google ads', 'facebook', 'reklama', 'ppc']},
    {'business_type': 'e_commerce', 'category_code': '518400', 'category_name': 'Poštovné', 'is_primary': False, 'keywords': ['pošta', 'doprava', 'zásilka', 'dhl']},
]

class TransactionItem(Base):
    """Položky na faktuře/účtence - detailní rozpis"""
    __tablename__ = "transaction_items"
    
    id = Column(Integer, primary_key=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    
    # Popis položky
    description = Column(String(300), nullable=False)  # "MacBook Pro 14" M3"
    
    # Množství a jednotky
    quantity = Column(Float, default=1)           # 2.5
    unit = Column(String(10), default="ks")      # "ks", "hod", "kg", "m"
    
    # Ceny
    unit_price = Column(Numeric(12, 2))          # Cena za jednotku bez DPH: 45000
    unit_price_with_vat = Column(Numeric(12, 2)) # Cena za jednotku s DPH: 54450
    
    # DPH pro tuto položku
    vat_rate = Column(Integer, default=21)       # 21%, 12%, 0%
    
    # Vypočítané částky pro tuto položku
    total_without_vat = Column(Numeric(12, 2))   # quantity * unit_price
    vat_amount = Column(Numeric(12, 2))          # DPH částka
    total_with_vat = Column(Numeric(12, 2))      # celkem s DPH
    
    # Kategorizace specifická pro položku (může se lišit od celkové transakce)
    item_category_code = Column(String(10))      # 501400 (drobný majetek)
    item_category_name = Column(String(100))     # "IT vybavení"
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    transaction = relationship("Transaction", back_populates="items")
    
    def __repr__(self):
        return f"<TransactionItem(id={self.id}, description='{self.description}', total={self.total_with_vat})>"

class TransactionAttachment(Base):
    """Přílohy k transakcím - účtenky, faktury, fotky"""
    __tablename__ = "transaction_attachments"
    
    id = Column(Integer, primary_key=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    
    # Informace o souboru
    file_name = Column(String(200), nullable=False)    # "uctenka_alza_2024_001.jpg"
    original_name = Column(String(200))                # Původní název souboru
    file_url = Column(String(500))                     # URL v cloud storage
    file_type = Column(String(50))                     # "image/jpeg", "application/pdf"
    file_size = Column(Integer)                        # velikost v bytech
    
    # Metadata
    uploaded_via = Column(String(20), default="whatsapp")  # whatsapp, web, email
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"))
    
    # OCR zpracování
    ocr_processed = Column(Boolean, default=False)
    ocr_confidence = Column(Numeric(3, 2))             # 0.85 = 85% confidence
    ocr_text = Column(Text)                            # raw OCR text
    ocr_extracted_data = Column(JSON)                  # strukturovaná data z OCR
    
    # AI zpracování přílohy
    ai_processed = Column(Boolean, default=False)
    ai_extracted_data = Column(JSON)                   # AI výsledky
    ai_confidence = Column(Numeric(3, 2))
    
    # Timestamps
    uploaded_at = Column(DateTime, default=func.now())
    processed_at = Column(DateTime)                    # kdy bylo dokončeno zpracování
    
    # Indexy
    __table_args__ = (
        Index('ix_attachments_transaction', 'transaction_id'),
        Index('ix_attachments_type', 'file_type'),
        Index('ix_attachments_ocr', 'ocr_processed'),
    )
    
    # Relationships
    transaction = relationship("Transaction", back_populates="attachments")
    
    def __repr__(self):
        return f"<TransactionAttachment(id={self.id}, file='{self.file_name}', transaction_id={self.transaction_id})>"

class Payment(Base):
    """Model pro platby a předplatná"""
    __tablename__ = 'payments'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Platební údaje
    payment_id = Column(String(200), nullable=False, index=True)  # ID od poskytovatele
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default='czk')
    status = Column(String(20), nullable=False)  # pending, completed, failed, cancelled
    
    # Poskytovatel platby
    provider = Column(String(20), nullable=False)  # stripe, comgate
    
    # Stripe specifické
    stripe_customer_id = Column(String(100), index=True)
    stripe_subscription_id = Column(String(100), index=True)
    stripe_invoice_id = Column(String(100))
    stripe_payment_intent_id = Column(String(100))
    
    # Comgate specifické
    comgate_transaction_id = Column(String(100))
    comgate_ref_id = Column(String(100))
    
    # Metadata (renamed to avoid SQLAlchemy conflict)
    payment_metadata = Column(JSON)  # Libovolná další data
    payment_method = Column(String(50))  # card, bank_transfer, etc.
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime)
    
    # Indexy
    __table_args__ = (
        Index('ix_payments_user_status', 'user_id', 'status'),
        Index('ix_payments_provider_id', 'provider', 'payment_id'),
    )
    
    # Relationships
    user = relationship("User", back_populates="payments")
    invoices = relationship("Invoice", back_populates="payment")
    
    def __repr__(self):
        return f"<Payment(id={self.id}, user_id={self.user_id}, amount={self.amount}, status='{self.status}')>"

class Invoice(Base):
    """Model pro faktury"""
    __tablename__ = 'invoices'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    payment_id = Column(Integer, ForeignKey('payments.id'), nullable=True)  # Může být i bez platby
    
    # Základní údaje faktury
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    issue_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    
    # Částky
    amount_without_vat = Column(Numeric(12, 2), nullable=False)
    vat_amount = Column(Numeric(12, 2), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default='czk')
    
    # Zákazník
    customer_name = Column(String(200), nullable=False)
    customer_email = Column(String(200))
    customer_address = Column(Text)
    customer_ico = Column(String(20))
    customer_dic = Column(String(20))
    
    # Status
    status = Column(String(20), default='generated')  # generated, sent, paid, cancelled
    
    # PDF soubor
    pdf_path = Column(String(500))
    pdf_size = Column(Integer)  # velikost v bytech
    
    # Email
    email_sent_at = Column(DateTime)
    email_delivery_status = Column(String(20))  # sent, delivered, bounced, failed
    
    # Metadata
    notes = Column(Text)
    invoice_metadata = Column(JSON)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Indexy
    __table_args__ = (
        Index('ix_invoices_user_date', 'user_id', 'issue_date'),
        Index('ix_invoices_status', 'status'),
        Index('ix_invoices_customer', 'customer_email'),
    )
    
    # Relationships
    user = relationship("User", back_populates="invoices")
    payment = relationship("Payment", back_populates="invoices")
    
    def __repr__(self):
        return f"<Invoice(id={self.id}, number='{self.invoice_number}', total={self.total_amount})>"

class ActivationLog(Base):
    """Model pro logoování aktivačních pokusů"""
    __tablename__ = 'activation_logs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Aktivační údaje
    phone_number = Column(String(50), nullable=False, index=True)
    activation_token = Column(String(64), nullable=True)
    
    # Status pokusu
    success = Column(Boolean, default=False)
    error_type = Column(String(50), nullable=True)  # 'invalid_token', 'expired', 'already_used', etc.
    error_message = Column(Text, nullable=True)
    
    # Metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Timestamp
    attempted_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="activation_logs")
    
    def __repr__(self):
        return f"<ActivationLog(phone={self.phone_number}, success={self.success}, attempted={self.attempted_at})>"

# Utility functions for activation system
def is_valid_activation_token(token: str) -> bool:
    """Validuje formát aktivačního tokenu"""
    if not token or len(token) != 32:
        return False
    # Ověří že obsahuje pouze hexadecimální znaky
    return all(c in '0123456789abcdef' for c in token.lower())

def format_activation_token(token: str) -> str:
    """Naformátuje token pro zobrazení (grup po 4 znacích)"""
    if not token or len(token) != 32:
        return token
    return '-'.join([token[i:i+4] for i in range(0, 32, 4)])

def clean_phone_number(phone: str) -> str:
    """Vyčistí telefonní číslo do standardního formátu"""
    if not phone:
        return phone
    # Odstraní whatsapp: prefixu
    phone = phone.replace('whatsapp:', '')
    # Odstraní mezer a dalších znaků
    phone = ''.join(c for c in phone if c.isdigit() or c == '+')
    return phone