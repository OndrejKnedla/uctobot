from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, Literal
from decimal import Decimal

class Transaction(BaseModel):
    id: Optional[int] = None
    user_id: int
    type: Literal['income', 'expense']
    amount: Decimal = Field(..., gt=0, le=10000000)
    description: str = Field(..., max_length=500)
    category: str = Field(..., max_length=10)
    category_name: str = Field(..., max_length=100)
    original_message: Optional[str] = Field(None, max_length=1000)
    created_at: Optional[datetime] = None
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Částka musí být větší než 0')
        if v > 10000000:
            raise ValueError('Částka je příliš vysoká')
        return v
    
    @validator('description')
    def validate_description(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Popis nemůže být prázdný')
        return v.strip()
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }

class User(BaseModel):
    id: Optional[int] = None
    whatsapp_number: str = Field(..., regex=r'^whatsapp:\+[1-9]\d{1,14}$')
    business_name: Optional[str] = Field(None, max_length=200)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @validator('whatsapp_number')
    def validate_whatsapp_number(cls, v):
        if not v.startswith('whatsapp:'):
            raise ValueError('WhatsApp číslo musí začínat "whatsapp:"')
        return v

class Reminder(BaseModel):
    id: Optional[int] = None
    user_id: int
    reminder_type: str = Field(..., max_length=20)
    message: str = Field(..., max_length=500)
    due_date: datetime
    sent: bool = False
    sent_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    
    @validator('reminder_type')
    def validate_reminder_type(cls, v):
        valid_types = ['tax_advance', 'vat', 'custom', 'monthly_summary', 'quarterly_summary']
        if v not in valid_types:
            raise ValueError(f'Neplatný typ připomínky. Povolené: {", ".join(valid_types)}')
        return v

class TransactionSummary(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    profit: Decimal
    transaction_count: int
    period: str
    
    @property
    def profit_margin(self) -> float:
        if self.total_income > 0:
            return float((self.profit / self.total_income) * 100)
        return 0.0
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }

class CategorySummary(BaseModel):
    category: str
    category_name: str
    total_amount: Decimal
    transaction_count: int
    percentage: float
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }