from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, JSON, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class SubscriptionStatus(enum.Enum):
    INACTIVE = "inactive"
    TRIAL = "trial"
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class TransactionType(enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"

class User(Base):
    """Hlavní tabulka uživatelů"""
    __tablename__ = "users"
    
    # Základní info
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(20), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Osobní údaje
    full_name = Column(String(255))
    business_name = Column(String(255))
    ico = Column(String(8), nullable=True)
    dic = Column(String(12), nullable=True)
    address = Column(Text)
    bank_account = Column(String(50))
    
    # DPH status
    vat_payer = Column(Boolean, default=False)
    vat_registration_date = Column(Date, nullable=True)
    vat_period = Column(String(20), default="monthly")  # monthly/quarterly
    
    # Subscription
    subscription_status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.INACTIVE)
    subscription_plan = Column(String(50))  # monthly/yearly
    subscription_until = Column(DateTime)
    trial_transactions_used = Column(Integer, default=0)
    trial_transactions_limit = Column(Integer, default=10)
    
    # Aktivace
    activation_token = Column(String(64), unique=True, nullable=True)
    activation_created_at = Column(DateTime, nullable=True)
    activation_expires_at = Column(DateTime)
    activation_used = Column(Boolean, default=False)
    activation_used_at = Column(DateTime, nullable=True)
    whatsapp_activated = Column(Boolean, default=False)
    
    # Stripe
    stripe_customer_id = Column(String(255), unique=True, nullable=True)
    stripe_subscription_id = Column(String(255), unique=True, nullable=True)
    
    # Statistiky
    current_year_revenue = Column(Float, default=0)
    last_12_months_revenue = Column(Float, default=0)
    total_transactions = Column(Integer, default=0)
    
    # Nastavení
    tax_type = Column(String(20), default="60_40")  # 60_40 nebo real_costs
    default_vat_rate = Column(Integer, default=21)
    
    # Vztahy
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="user", cascade="all, delete-orphan")
    vat_records = relationship("VatRecord", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    conversation_states = relationship("ConversationState", back_populates="user", cascade="all, delete-orphan")
    activation_tokens = relationship("ActivationToken", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email or self.phone}>"

class Transaction(Base):
    """Tabulka transakcí"""
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="transactions")
    
    # Základní údaje
    type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Float, nullable=False)
    vat_amount = Column(Float, default=0)
    vat_rate = Column(Integer, default=21)
    amount_without_vat = Column(Float)
    
    # Popis
    description = Column(Text)
    category = Column(String(100))
    
    # Protistrana
    counterparty_name = Column(String(255))
    counterparty_ico = Column(String(8))
    counterparty_dic = Column(String(12))
    counterparty_address = Column(Text)
    
    # Doklad
    document_number = Column(String(100))
    document_date = Column(Date, default=datetime.utcnow)
    due_date = Column(Date)
    payment_date = Column(Date)
    
    # Platební údaje
    payment_method = Column(String(50))  # cash/card/transfer
    bank_account = Column(String(50))
    variable_symbol = Column(String(20))
    constant_symbol = Column(String(20))
    specific_symbol = Column(String(20))
    
    # Metadata
    raw_message = Column(Text)  # Původní WhatsApp zpráva
    ai_confidence = Column(Float)  # Jak moc si AI je jistá
    completeness_score = Column(Integer)  # 0-100% kompletnosti údajů
    
    # Časové údaje
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Vztahy
    items = relationship("TransactionItem", back_populates="transaction", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="transaction", cascade="all, delete-orphan")

class TransactionItem(Base):
    """Položky na faktuře/účtence"""
    __tablename__ = "transaction_items"
    
    id = Column(Integer, primary_key=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    transaction = relationship("Transaction", back_populates="items")
    
    description = Column(String(255), nullable=False)
    quantity = Column(Float, default=1)
    unit = Column(String(20), default="ks")
    unit_price = Column(Float, nullable=False)
    vat_rate = Column(Integer, default=21)
    total_without_vat = Column(Float)
    vat_amount = Column(Float)
    total_with_vat = Column(Float)

class Attachment(Base):
    """Přílohy (účtenky, faktury)"""
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    transaction = relationship("Transaction", back_populates="attachments")
    
    file_name = Column(String(255))
    file_url = Column(String(500))
    file_type = Column(String(50))  # image/jpeg, application/pdf
    file_size = Column(Integer)  # v bytech
    
    # OCR data
    ocr_processed = Column(Boolean, default=False)
    ocr_text = Column(Text)
    ocr_data = Column(JSON)  # Strukturovaná data z OCR
    ocr_confidence = Column(Float)
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Invoice(Base):
    """Vydané faktury"""
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="invoices")
    
    invoice_number = Column(String(50), unique=True)
    issue_date = Column(Date, default=datetime.utcnow)
    due_date = Column(Date)
    payment_date = Column(Date)
    
    # Odběratel
    client_name = Column(String(255))
    client_ico = Column(String(8))
    client_dic = Column(String(12))
    client_address = Column(Text)
    
    # Částky
    amount_without_vat = Column(Float)
    vat_amount = Column(Float)
    total_amount = Column(Float)
    
    # Status
    is_paid = Column(Boolean, default=False)
    is_cancelled = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class VatRecord(Base):
    """Evidence DPH pro přiznání"""
    __tablename__ = "vat_records"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="vat_records")
    
    period_year = Column(Integer)
    period_month = Column(Integer)
    period_quarter = Column(Integer)
    
    # DPH vstupy (nákupy)
    input_vat_base_21 = Column(Float, default=0)
    input_vat_21 = Column(Float, default=0)
    input_vat_base_12 = Column(Float, default=0)
    input_vat_12 = Column(Float, default=0)
    input_vat_base_10 = Column(Float, default=0)
    input_vat_10 = Column(Float, default=0)
    
    # DPH výstupy (prodeje)
    output_vat_base_21 = Column(Float, default=0)
    output_vat_21 = Column(Float, default=0)
    output_vat_base_12 = Column(Float, default=0)
    output_vat_12 = Column(Float, default=0)
    output_vat_base_10 = Column(Float, default=0)
    output_vat_10 = Column(Float, default=0)
    
    # Výsledek
    vat_liability = Column(Float)  # K úhradě
    vat_refund = Column(Float)  # Nadměrný odpočet
    
    # Status
    is_submitted = Column(Boolean, default=False)
    submitted_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class Payment(Base):
    """Platby za předplatné"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="payments")
    
    amount = Column(Float)
    currency = Column(String(3), default="CZK")
    payment_method = Column(String(50))  # card/bank_transfer
    
    stripe_payment_intent_id = Column(String(255))
    stripe_invoice_id = Column(String(255))
    
    status = Column(String(50))  # pending/completed/failed
    paid_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class ConversationState(Base):
    """Stav konverzace pro vícekrokové zadávání"""
    __tablename__ = "conversation_states"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="conversation_states")
    
    active = Column(Boolean, default=True)
    current_step = Column(String(50))
    partial_data = Column(JSON, default={})
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime)

class ActivationToken(Base):
    """Historie aktivačních kódů pro sledovatelnost"""
    __tablename__ = "activation_tokens"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", overlaps="activation_tokens")
    
    token = Column(String(64), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    
    # Status použití
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    used_from_phone = Column(String(20), nullable=True)
    
    # Kontext vytvoření
    created_from = Column(String(50))  # "stripe_payment", "manual", etc.
    stripe_session_id = Column(String(255), nullable=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    
    def __repr__(self):
        return f"<ActivationToken(token={self.token}, user_id={self.user_id}, used={self.is_used})>"