from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from datetime import datetime, timedelta

# Import nových modelů a databáze
from app.database_new import get_db, init_db
from app.models import User, Transaction, TransactionType, SubscriptionStatus
from app.core.config import settings

# Import služeb
from app.services.whatsapp import send_whatsapp_message
from app.services.ai_processor import process_message_with_ai

# Import routerů
from app.routers.payments import router as payments_router

# Pydantic modely pro API
from pydantic import BaseModel

class TransactionResponse(BaseModel):
    id: int
    type: str
    amount: float
    vat_amount: float
    vat_rate: int
    description: str
    category: Optional[str] = None
    counterparty_name: Optional[str] = None
    counterparty_ico: Optional[str] = None
    document_date: Optional[str] = None
    payment_date: Optional[str] = None
    created_at: str
    
    class Config:
        from_attributes = True

class UserStats(BaseModel):
    total_users: int
    active_users: int
    trial_users: int
    
class TransactionStats(BaseModel):
    total_transactions: int
    total_income: float
    total_expenses: float
    profit: float
    current_month_transactions: int

class CreateTransactionRequest(BaseModel):
    type: TransactionType
    amount: float
    description: str
    category: Optional[str] = None
    counterparty_name: Optional[str] = None
    vat_rate: int = 21

# FastAPI aplikace
app = FastAPI(
    title="ÚčetníBot API",
    version="2.0.0",
    description="České WhatsApp účetní API s novou databází",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ucetnibot.cz",
        "https://www.ucetnibot.cz"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Mount static files
try:
    app.mount("/static", StaticFiles(directory="app/static"), name="static")
    templates = Jinja2Templates(directory="app/templates")
except:
    print("⚠️ Static files nebo templates nenalezeny")

@app.on_event("startup")
async def startup_event():
    """Inicializace databáze při startu"""
    print("🚀 Spouštím ÚčetníBot API v2.0.0")
    print(f"📦 Environment: {settings.DEBUG and 'development' or 'production'}")
    print(f"🗄️ Database: {settings.DATABASE_URL}")
    
    # Inicializuj databázi
    init_db()
    print("✅ Databáze inicializována")

# Zahrň routery
app.include_router(payments_router)

# === ZÁKLADNÍ ENDPOINTY ===

@app.get("/")
async def root():
    return {
        "message": "ÚčetníBot API v2.0.0",
        "status": "running",
        "database": "connected",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check pro monitoring"""
    try:
        # Test databáze
        db = next(get_db())
        user_count = db.query(User).count()
        db.close()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0.0",
            "database": "connected",
            "users": user_count
        }
    except Exception as e:
        return JSONResponse(
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            },
            status_code=503
        )

# === API ENDPOINTY PRO UŽIVATELE ===

@app.get("/api/users/stats", response_model=UserStats)
async def get_user_stats(db: Session = Depends(get_db)):
    """Základní statistiky uživatelů"""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.subscription_status == SubscriptionStatus.ACTIVE).count()
    trial_users = db.query(User).filter(User.subscription_status == SubscriptionStatus.TRIAL).count()
    
    return UserStats(
        total_users=total_users,
        active_users=active_users,
        trial_users=trial_users
    )

@app.get("/api/users")
async def get_users(
    limit: int = 10, 
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Seznam uživatelů s paginací"""
    users = db.query(User).offset(offset).limit(limit).all()
    total = db.query(User).count()
    
    return {
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "phone": user.phone,
                "full_name": user.full_name,
                "business_name": user.business_name,
                "subscription_status": user.subscription_status.value,
                "vat_payer": user.vat_payer,
                "total_transactions": user.total_transactions,
                "current_year_revenue": user.current_year_revenue,
                "created_at": user.created_at.isoformat()
            }
            for user in users
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@app.get("/api/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Detail uživatele"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Uživatel nenalezen")
    
    return {
        "id": user.id,
        "email": user.email,
        "phone": user.phone,
        "full_name": user.full_name,
        "business_name": user.business_name,
        "ico": user.ico,
        "dic": user.dic,
        "address": user.address,
        "vat_payer": user.vat_payer,
        "subscription_status": user.subscription_status.value,
        "subscription_plan": user.subscription_plan,
        "subscription_until": user.subscription_until.isoformat() if user.subscription_until else None,
        "total_transactions": user.total_transactions,
        "current_year_revenue": user.current_year_revenue,
        "created_at": user.created_at.isoformat()
    }

# === API ENDPOINTY PRO TRANSAKCE ===

@app.get("/api/transactions/stats", response_model=TransactionStats)
async def get_transaction_stats(db: Session = Depends(get_db)):
    """Statistiky transakcí"""
    total_transactions = db.query(Transaction).count()
    
    # Příjmy a výdaje
    income_sum = db.query(Transaction).filter(
        Transaction.type == TransactionType.INCOME
    ).with_entities(Transaction.amount).all()
    total_income = sum(t.amount for t in income_sum)
    
    expense_sum = db.query(Transaction).filter(
        Transaction.type == TransactionType.EXPENSE
    ).with_entities(Transaction.amount).all()
    total_expenses = sum(t.amount for t in expense_sum)
    
    # Aktuální měsíc
    current_month = datetime.now().replace(day=1)
    current_month_count = db.query(Transaction).filter(
        Transaction.created_at >= current_month
    ).count()
    
    return TransactionStats(
        total_transactions=total_transactions,
        total_income=total_income,
        total_expenses=total_expenses,
        profit=total_income - total_expenses,
        current_month_transactions=current_month_count
    )

@app.get("/api/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    limit: int = 20,
    offset: int = 0,
    user_id: Optional[int] = None,
    type: Optional[TransactionType] = None,
    db: Session = Depends(get_db)
):
    """Seznam transakcí s filtrováním"""
    query = db.query(Transaction)
    
    if user_id:
        query = query.filter(Transaction.user_id == user_id)
    if type:
        query = query.filter(Transaction.type == type)
    
    transactions = query.order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()
    
    return [
        TransactionResponse(
            id=t.id,
            type=t.type.value,
            amount=t.amount,
            vat_amount=t.vat_amount,
            vat_rate=t.vat_rate,
            description=t.description,
            category=t.category,
            counterparty_name=t.counterparty_name,
            counterparty_ico=t.counterparty_ico,
            document_date=t.document_date.isoformat() if t.document_date else None,
            payment_date=t.payment_date.isoformat() if t.payment_date else None,
            created_at=t.created_at.isoformat()
        )
        for t in transactions
    ]

@app.get("/api/transactions/{transaction_id}")
async def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Detail transakce"""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transakce nenalezena")
    
    return {
        "id": transaction.id,
        "user_id": transaction.user_id,
        "type": transaction.type.value,
        "amount": transaction.amount,
        "vat_amount": transaction.vat_amount,
        "vat_rate": transaction.vat_rate,
        "amount_without_vat": transaction.amount_without_vat,
        "description": transaction.description,
        "category": transaction.category,
        "counterparty_name": transaction.counterparty_name,
        "counterparty_ico": transaction.counterparty_ico,
        "counterparty_dic": transaction.counterparty_dic,
        "counterparty_address": transaction.counterparty_address,
        "document_number": transaction.document_number,
        "document_date": transaction.document_date.isoformat() if transaction.document_date else None,
        "payment_date": transaction.payment_date.isoformat() if transaction.payment_date else None,
        "payment_method": transaction.payment_method,
        "completeness_score": transaction.completeness_score,
        "ai_confidence": transaction.ai_confidence,
        "created_at": transaction.created_at.isoformat(),
        "updated_at": transaction.updated_at.isoformat()
    }

@app.post("/api/transactions")
async def create_transaction(
    transaction_data: CreateTransactionRequest,
    db: Session = Depends(get_db)
):
    """Vytvoření nové transakce"""
    try:
        # Vypočítej DPH
        total_amount = transaction_data.amount
        if transaction_data.vat_rate > 0 and transaction_data.type == TransactionType.EXPENSE:
            amount_without_vat = total_amount / (1 + transaction_data.vat_rate/100)
            vat_amount = total_amount - amount_without_vat
        else:
            amount_without_vat = total_amount
            vat_amount = 0
        
        # Vytvoř transakci
        transaction = Transaction(
            user_id=1,  # TODO: Získat z autentizace
            type=transaction_data.type,
            amount=total_amount,
            amount_without_vat=amount_without_vat,
            vat_amount=vat_amount,
            vat_rate=transaction_data.vat_rate,
            description=transaction_data.description,
            category=transaction_data.category,
            counterparty_name=transaction_data.counterparty_name,
            document_date=datetime.now().date(),
            payment_date=datetime.now().date(),
            completeness_score=70,  # Základní skóre pro manuální zadání
            ai_confidence=0.0
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        return {
            "message": "Transakce vytvořena",
            "transaction_id": transaction.id,
            "amount": transaction.amount,
            "vat_amount": transaction.vat_amount
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Chyba při vytváření transakce: {str(e)}")

@app.get("/api/users/{user_id}/transactions")
async def get_user_transactions(
    user_id: int,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Transakce konkrétního uživatele"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Uživatel nenalezen")
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.created_at.desc()).limit(limit).all()
    
    # Statistiky uživatele
    income_sum = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.INCOME
    ).with_entities(Transaction.amount).all()
    total_income = sum(t.amount for t in income_sum)
    
    expense_sum = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.EXPENSE
    ).with_entities(Transaction.amount).all()
    total_expenses = sum(t.amount for t in expense_sum)
    
    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "business_name": user.business_name,
            "subscription_status": user.subscription_status.value
        },
        "stats": {
            "total_transactions": len(transactions),
            "total_income": total_income,
            "total_expenses": total_expenses,
            "profit": total_income - total_expenses
        },
        "transactions": [
            {
                "id": t.id,
                "type": t.type.value,
                "amount": t.amount,
                "description": t.description,
                "category": t.category,
                "counterparty_name": t.counterparty_name,
                "created_at": t.created_at.isoformat()
            }
            for t in transactions
        ]
    }

# === WHATSAPP WEBHOOK ENDPOINTS ===

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """WhatsApp webhook endpoint pro zpracování příchozích zpráv"""
    try:
        # Získej raw data z requestu
        form_data = await request.form()
        
        # Twilio WhatsApp webhook data
        from_number = form_data.get("From", "")
        to_number = form_data.get("To", "") 
        body = form_data.get("Body", "")
        message_sid = form_data.get("MessageSid", "")
        
        print(f"📱 Webhook přijat:")
        print(f"   Od: {from_number}")
        print(f"   Komu: {to_number}")
        print(f"   Zpráva: {body}")
        print(f"   SID: {message_sid}")
        
        if not body:
            return {"status": "error", "message": "Prázdná zpráva"}
        
        # Získej nebo vytvoř uživatele na základě telefonního čísla
        phone_number = from_number.replace("whatsapp:", "")
        user = db.query(User).filter(User.phone == phone_number).first()
        
        if not user:
            # Vytvoř nového uživatele
            user = User(
                phone=phone_number,
                full_name=f"Uživatel {phone_number[-4:]}",
                subscription_status=SubscriptionStatus.TRIAL
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Vytvořen nový uživatel: {user.full_name}")
        
        # Zpracuj zprávu pomocí AI
        ai_response = await process_message_with_ai(body, user, db)
        
        # Pošli odpověď zpět přes Twilio
        await send_whatsapp_message(from_number, ai_response)
        
        return {"status": "success", "message": "Zpráva zpracována"}
        
    except Exception as e:
        print(f"❌ Chyba ve webhook: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/webhook/whatsapp") 
async def whatsapp_webhook_verification(request: Request):
    """Webhook verification endpoint pro Twilio"""
    return {"status": "ok", "message": "WhatsApp webhook is active"}

# === DEMO DATA ENDPOINT ===

@app.get("/api/demo")
async def get_demo_data(db: Session = Depends(get_db)):
    """Vrátí demo data pro frontend"""
    users = db.query(User).limit(3).all()
    recent_transactions = db.query(Transaction).order_by(
        Transaction.created_at.desc()
    ).limit(10).all()
    
    return {
        "demo_users": [
            {
                "id": user.id,
                "full_name": user.full_name,
                "business_name": user.business_name,
                "subscription_status": user.subscription_status.value,
                "total_transactions": len(user.transactions),
                "current_year_revenue": user.current_year_revenue
            }
            for user in users
        ],
        "recent_transactions": [
            {
                "id": t.id,
                "user_name": t.user.full_name if t.user else "Neznámý",
                "type": t.type.value,
                "amount": t.amount,
                "description": t.description,
                "counterparty_name": t.counterparty_name,
                "created_at": t.created_at.isoformat()
            }
            for t in recent_transactions
        ]
    }

# === HTML STRÁNKY (FALLBACK) ===

@app.get("/demo", response_class=HTMLResponse)
async def demo_page(request: Request):
    """Demo stránka s daty z databáze"""
    try:
        return templates.TemplateResponse("demo.html", {"request": request})
    except:
        # Fallback pokud template neexistuje
        return HTMLResponse("""
        <!DOCTYPE html>
        <html>
        <head><title>ÚčetníBot Demo</title></head>
        <body>
            <h1>🚀 ÚčetníBot API v2.0.0</h1>
            <p>✅ Backend běží s novou databází!</p>
            <ul>
                <li><a href="/docs">📖 API Documentation</a></li>
                <li><a href="/api/demo">📊 Demo Data JSON</a></li>
                <li><a href="/health">💚 Health Check</a></li>
            </ul>
            <p><strong>Frontend:</strong> <a href="http://localhost:3000">localhost:3000</a></p>
        </body>
        </html>
        """)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)