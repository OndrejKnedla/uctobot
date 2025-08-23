from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import PlainTextResponse, Response, JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from twilio.twiml.messaging_response import MessagingResponse
from twilio.request_validator import RequestValidator
import os
import time
from datetime import datetime
import asyncio
from dotenv import load_dotenv
import psutil
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Load environment variables
load_dotenv()

# Initialize Sentry and logging BEFORE importing other modules
from app.utils.sentry import init_sentry
from app.utils.logging import configure_logging, get_logger, log_api_request, log_whatsapp_message

# Initialize error tracking and logging
init_sentry()
logger = configure_logging()
api_logger = get_logger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
WHATSAPP_MESSAGES = Counter('whatsapp_messages_total', 'Total WhatsApp messages', ['direction', 'status'])

from app.whatsapp_handler import WhatsAppHandler
# Database import removed - using new SQLAlchemy services
from app.onboarding import OnboardingWizard
from app.vat_handler import VatHandler
from app.services.user_service import UserService
from app.services.onboarding_service import OnboardingService
from app.services.activation_service import ActivationService
from app.services.payment_service import payment_service
from app.services.smart_ai_processor import SmartAIProcessor
from app.services.compliance_report_service import ComplianceReportService
from app.middleware.trial_check import TrialCheckMiddleware
from utils.notifications import NotificationManager
from sqlalchemy.orm import sessionmaker

app = FastAPI(
    title="ÚčetníBot - Czech WhatsApp Accounting Assistant",
    version="1.0.0",
    description="Český WhatsApp bot pro účetnictví OSVČ",
    docs_url="/docs" if os.getenv('ENVIRONMENT') != 'production' else None,
    redoc_url="/redoc" if os.getenv('ENVIRONMENT') != 'production' else None,
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates
templates = Jinja2Templates(directory="app/templates")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ucetnibot.cz",  # pro produkci
        "https://www.ucetnibot.cz"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Middleware for request logging and metrics
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    
    # Log API request
    log_api_request(
        api_logger,
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code,
        duration_ms=duration * 1000,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None
    )
    
    # Update Prometheus metrics
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.observe(duration)
    
    return response

# Globální instance
whatsapp_handler = WhatsAppHandler()
notification_manager = NotificationManager()
vat_handler = VatHandler()

# Tyto budou inicializovány v startup_event
user_service = None
trial_middleware = None
onboarding_wizard = None
onboarding_service = None
activation_service = None
smart_ai_processor = None
compliance_report_service = None

@app.on_event("startup")
async def startup_event():
    global user_service, trial_middleware, onboarding_wizard, onboarding_service, activation_service, smart_ai_processor, compliance_report_service, startup_time
    
    startup_time = time.time()
    api_logger.info("Starting ÚčetníBot WhatsApp service", 
                   environment=os.getenv('ENVIRONMENT'),
                   version="1.0.0")
    
    # Inicializuj databázi (nový connection systém)
    from app.database.connection import init_database
    await init_database()
    
    # Inicializuj služby po připojení k databázi
    user_service = UserService()  # Použije default get_db_session
    trial_middleware = TrialCheckMiddleware(user_service)
    onboarding_wizard = OnboardingWizard(user_service)
    onboarding_service = OnboardingService()
    activation_service = ActivationService()
    smart_ai_processor = SmartAIProcessor()
    compliance_report_service = ComplianceReportService()
    
    api_logger.info("Services initialized successfully", 
                   startup_time_seconds=round(time.time() - startup_time, 2))
    
    # Include payment webhook router
    from app.endpoints.payment_webhook import router as payment_router
    app.include_router(payment_router)
    
    # Include OCR endpoint router
    from app.endpoints.ocr_endpoint import router as ocr_router
    app.include_router(ocr_router)
    
    # Add simple webhook for testing
    from app.simple_webhook import create_simple_webhook_endpoint
    create_simple_webhook_endpoint(app)
    
    # Add minimal webhook
    from app.minimal_webhook import create_minimal_webhook
    create_minimal_webhook(app)
    
    # Add Twilio test webhook
    from app.twilio_test_webhook import create_twilio_test_webhook
    create_twilio_test_webhook(app)
    
    # asyncio.create_task(notification_manager.start_reminder_loop())  # Zatím vypnuto

@app.on_event("shutdown")
async def shutdown_event():
    api_logger.info("Shutting down ÚčetníBot WhatsApp service")
    from app.database.connection import close_database
    await close_database()
    api_logger.info("Service shutdown complete")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api")
async def root():
    return {"message": "Účetní WhatsApp Bot je aktivní", "status": "running"}

@app.get("/registrace", response_class=HTMLResponse)
async def registration_page(request: Request):
    # Redirect na platební stránku nebo registrační formulář
    # Pro testování zatím vrátíme jednoduchou HTML stránku
    return """
    <!DOCTYPE html>
    <html lang="cs">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Registrace - ÚčtoBot</title>
        <style>
            body { 
                font-family: system-ui, sans-serif; 
                max-width: 600px; 
                margin: 50px auto; 
                padding: 20px; 
                line-height: 1.6; 
            }
            .btn {
                background: #25D366;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                text-decoration: none;
                display: inline-block;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <h1>🎉 Vítejte v ÚčtoBotu!</h1>
        <p>Děkujeme za zájem o ÚčtoBot. Začněte již dnes:</p>
        
        <h2>Způsob registrace:</h2>
        <ol>
            <li><strong>Napište 'START'</strong> na WhatsApp číslo: <strong>+420 123 456 789</strong></li>
            <li>Bot vás provede jednoduchým nastavením</li>
            <li>Začněte zadávat své výdaje a příjmy</li>
        </ol>

        <a href="https://wa.me/420123456789?text=START" class="btn">
            💬 Spustit na WhatsApp
        </a>

        <h3>Cena:</h3>
        <ul>
            <li>💚 První 14 dní ZDARMA</li>
            <li>💰 Poté pouze 299 Kč/měsíc nebo 2 990 Kč/rok</li>
            <li>❌ Kdykoliv zrušitelné</li>
        </ul>

        <p><a href="/">← Zpět na hlavní stránku</a></p>
    </body>
    </html>
    """

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint for monitoring"""
    try:
        # Check database connection
        db_healthy = False
        db_error = None
        try:
            from app.database.connection import db_manager
            db_healthy = await db_manager.check_connection()
        except Exception as e:
            db_error = str(e)
        
        # Check system resources
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Application metrics
        uptime = time.time() - startup_time if 'startup_time' in globals() else 0
        
        health_data = {
            "status": "healthy" if db_healthy else "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0",
            "environment": os.getenv('ENVIRONMENT', 'development'),
            "uptime_seconds": round(uptime, 2),
            "checks": {
                "database": {
                    "status": "healthy" if db_healthy else "unhealthy",
                    "error": db_error
                },
                "system": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_mb": round(memory.available / 1024 / 1024, 2),
                    "disk_free_gb": round(disk.free / 1024 / 1024 / 1024, 2),
                    "disk_percent": round((disk.used / disk.total) * 100, 2)
                }
            }
        }
        
        status_code = 200 if db_healthy else 503
        return JSONResponse(content=health_data, status_code=status_code)
        
    except Exception as e:
        api_logger.error("Health check failed", error=str(e))
        return JSONResponse(
            content={
                "status": "unhealthy", 
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            },
            status_code=503
        )

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/status")
async def status():
    """Simple status endpoint for load balancers"""
    return {"status": "ok", "service": "ucetni-whatsapp-bot"}

@app.post("/webhook/whatsapp")
@app.get("/webhook/whatsapp")  # Pro bypass localtunnel security
async def whatsapp_webhook(request: Request):
    """
    Zpracuje WhatsApp zprávy včetně obrázků účtenek
    """
    try:
        # Získej form data z requestu
        form_data = await request.form()
        
        # Základní údaje z Twilio
        from_number = form_data.get('From', '').replace('whatsapp:', '')
        to_number = form_data.get('To', '')
        message_body = form_data.get('Body', '').strip()
        message_sid = form_data.get('MessageSid', '')
        profile_name = form_data.get('ProfileName', 'Uživatel')
        
        # NOVÉ: Kontrola přiložených médií
        num_media = int(form_data.get('NumMedia', '0'))
        
        api_logger.info(f"WhatsApp webhook: from={from_number}, body='{message_body[:50]}...', media={num_media}")
        
        # Log incoming message
        log_whatsapp_message(
            api_logger,
            direction="incoming",
            phone_number=from_number,
            message=f"{message_body} [+{num_media} media]" if num_media > 0 else message_body,
            message_sid=message_sid
        )
        WHATSAPP_MESSAGES.labels(direction="incoming", status="received").inc()
        
        # BEZPEČNÝ AKTIVAČNÍ SYSTÉM
        response_text = ""
        user_id = None  # Initialize user_id
        
        # 1. Zkontroluj jestli je uživatel už aktivovaný
        activation_status = await activation_service.check_user_activation_status(from_number)
        
        if activation_status.get('activated'):
            # Uživatel je aktivovaný - normální flow
            user_id = activation_status['user_id']
            
            # Zkontroluj předplatné
            if activation_status['subscription_status'] != "active":
                response_text = f"""⚠️ Vaše předplatné vypršelo.

📅 Platné do: {activation_status.get('subscription_ends', 'N/A')}
💳 Obnovit: ucetnibot.cz/platba
📧 Pomoc: podpora@ucetnibot.cz"""
            elif activation_status.get('needs_onboarding'):
                # Uživatel potřebuje dokončit onboarding
                from app.database.connection import db_manager
                async with db_manager.get_session() as db:
                    from sqlalchemy import select
                    from app.database.models import User
                    
                    stmt = select(User).where(User.id == user_id)
                    result = await db.execute(stmt)
                    user = result.scalar_one_or_none()
                    
                    if user:
                        onboarding_result = await onboarding_service.process_onboarding_step(user, message_body, db)
                        response_text = onboarding_result.get('message', 'Chyba v onboardingu')
            else:
                # Normální zpracování zpráv a obrázků
                if num_media > 0:
                    # Zpracování obrázku účtenky
                    for i in range(num_media):
                        media_url = form_data.get(f'MediaUrl{i}')
                        media_type = form_data.get(f'MediaContentType{i}')
                        
                        if media_type and media_type.startswith('image/'):
                            try:
                                image_data = await _download_twilio_media(media_url)
                                from app.services.whatsapp_ocr_service import whatsapp_ocr_service
                                ocr_result = await whatsapp_ocr_service.process_receipt_from_whatsapp(
                                    image_data, message_body, user_id
                                ) if user_id else {'success': False, 'message': 'Uživatel není aktivován'}
                                
                                if ocr_result.get('success') and user_id:
                                    transaction = await _create_transaction_from_ocr(
                                        user_id, ocr_result, message_body
                                    )
                                    response_text = _format_ocr_response(ocr_result, transaction)
                                else:
                                    response_text = f"""📸 {ocr_result.get('message', 'Nepodařilo se zpracovat obrázek')}

💡 **Tipy pro lepší rozpoznání:**
• Vyfoťte účtenku na rovném povrchu
• Zajistěte dobré osvětlení  
• Celá účtenka musí být vidět
• Zkuste ostřejší fotografii

📝 Nebo napište údaje ručně: "Alza 1500 Kč"""
                            except Exception as e:
                                api_logger.error(f"OCR processing failed: {str(e)}")
                                response_text = "❌ Chyba při zpracování obrázku."
                        break
                elif message_body:
                    # Textové příkazy
                    if message_body.lower() in ["/start", "start", "začít", "zacit", "ahoj", "hello"]:
                        # Najdi uživatele pro welcome message
                        from app.database.connection import db_manager
                        async with db_manager.get_session() as db:
                            from sqlalchemy import select
                            from app.database.models import User
                            
                            if user_id:
                                stmt = select(User).where(User.id == user_id)
                                result = await db.execute(stmt)
                                user = result.scalar_one_or_none()
                            else:
                                user = None
                            
                            if user:
                                response_text = _get_welcome_message_registered(user)
                            else:
                                response_text = _get_welcome_message_unregistered()
                    elif message_body.lower() in ["pomoc", "help", "?"]:
                        response_text = _get_help_message()
                    elif message_body.lower() in ["přehled", "prehled", "souhrn"]:
                        if user_id:
                            response_text = await _get_monthly_summary(user_id)
                        else:
                            response_text = "❌ Nejste aktivovaný uživatel"
                    elif message_body.lower() in ["compliance", "přehled compliance", "prehled compliance", "compliance report"]:
                        if user_id:
                            # Generuj compliance report
                            report = await compliance_report_service.generate_monthly_compliance_report(user_id)
                            response_text = compliance_report_service.format_monthly_report_for_whatsapp(report)
                        else:
                            response_text = "❌ Nejste aktivovaný uživatel"
                    elif message_body.lower() in ["detaily compliance", "detailní compliance", "compliance detaily"]:
                        if user_id:
                            # Detailní compliance analýza
                            report = await compliance_report_service.generate_monthly_compliance_report(user_id)
                            response_text = await _format_detailed_compliance_report(report)
                        else:
                            response_text = "❌ Nejste aktivovaný uživatel"
                    else:
                        # Zpracuj jako transakci s tax evidence validací
                        if user_id:
                            # Získej user objekt pro tax validation
                            from app.database.connection import db_manager
                            async with db_manager.get_session() as db:
                                from sqlalchemy import select
                                from app.database.models import User
                                
                                stmt = select(User).where(User.id == user_id)
                                result = await db.execute(stmt)
                                user = result.scalar_one_or_none()
                                
                                if user:
                                    # Použij SmartAIProcessor pro tax evidence validation
                                    context_id = f"user_{user_id}_{from_number}"
                                    tax_result = await smart_ai_processor.process_for_non_vat_payer(
                                        message_body, user, context_id
                                    )
                                    
                                    if tax_result.get('needs_more_info'):
                                        # Bot potřebuje více informací
                                        response_text = tax_result['question']
                                    elif tax_result.get('success'):
                                        # Transakce byla úspěšně uložena
                                        response_text = tax_result['message']
                                    else:
                                        # Chyba v processing
                                        response_text = tax_result.get('message', "❌ Nastala chyba při zpracování.")
                                else:
                                    response_text = "❌ Uživatel nenalezen v databázi"
                        else:
                            response_text = "❌ Nejste aktivovaný uživatel"
        else:
            # 2. Neznámý uživatel - zkontroluj aktivační token nebo přivítej
            if message_body:
                # Vyčisti token - odstraň mezery a převeď na lowercase
                clean_token = message_body.replace(' ', '').replace('-', '').lower()
                
                # Zkontroluj jestli vypadá jako aktivační token (32 hex znaků)
                from app.database.models import is_valid_activation_token
                if is_valid_activation_token(clean_token):
                    # Pokus o aktivaci
                    client_ip = request.client.host if request.client else None
                    user_agent = request.headers.get("user-agent")
                    
                    activation_result = await activation_service.activate_whatsapp(
                        phone_number=from_number,
                        token=clean_token,
                        ip_address=client_ip,
                        user_agent=user_agent
                    )
                    
                    response_text = activation_result.get('message', 'Chyba při aktivaci')
                    
                    # Pokud aktivace úspěšná a potřebuje onboarding, nastav kroky
                    if activation_result.get('success') and activation_result.get('needs_onboarding'):
                        # Onboarding bude pokračovat v dalších zprávách
                        pass
                else:
                    # Není to aktivační kód - uvítací zpráva
                    response_text = activation_status.get('message', _get_welcome_message_unregistered())
            else:
                # Žádný text ani obrázek
                response_text = _get_welcome_message_unregistered()
        
        # NOVÉ: Zpracuj obrázky pokud jsou přiložené
        if num_media > 0:
            for i in range(num_media):
                media_url = form_data.get(f'MediaUrl{i}')
                media_type = form_data.get(f'MediaContentType{i}')
                
                api_logger.info(f"Processing media {i}: type={media_type}, url={media_url[:50] if media_url else 'None'}...")
                
                if media_type and media_type.startswith('image/'):
                    try:
                        # Stáhni a zpracuj obrázek
                        image_data = await _download_twilio_media(media_url)
                        
                        # OCR zpracování pomocí WhatsApp OCR service
                        from app.services.whatsapp_ocr_service import whatsapp_ocr_service
                        ocr_result = await whatsapp_ocr_service.process_receipt_from_whatsapp(
                            image_data, message_body, user_id if user_id else 0
                        )
                        
                        if ocr_result.get('success'):
                            # Vytvoř transakci z OCR dat
                            transaction = await _create_transaction_from_ocr(
                                user_id, ocr_result, message_body
                            )
                            
                            # Připrav odpověď
                            response_text = _format_ocr_response(ocr_result, transaction)
                        else:
                            response_text = f"""📸 {ocr_result.get('message', 'Nepodařilo se zpracovat obrázek')}

💡 **Tipy pro lepší rozpoznání:**
• Vyfoťte účtenku na rovném povrchu
• Zajistěte dobré osvětlení  
• Celá účtenka musí být vidět
• Zkuste ostřejší fotografii

📝 Nebo napište údaje ručně: "Alza 1500 Kč\""""
                            
                    except Exception as e:
                        api_logger.error(f"Chyba při zpracování obrázku: {str(e)}")
                        response_text = """❌ Chyba při zpracování obrázku.

📝 Zkuste napsat údaje ručně:
"Nákup materiálu 500 Kč"

📞 Nebo kontaktujte podporu pokud problém přetrvává."""
                        
                else:
                    response_text = """📎 Podporuji pouze obrázky účtenek.

📸 **Pošlete prosím:**
• Fotku účtenky nebo faktury
• Screenshot e-fakturou
• Obrázek dokladu

📝 **Nebo napište text:**
"Benzín 800 Kč" """
                    
                break  # Zpracuj jen první médium
        
        else:
            # Ani text ani obrázek
            response_text = """👋 Ahoj! Jsem váš AI účetní asistent.

📸 **Pošlete mi:**
• Fotku účtenky → automaticky zpracuji
• Text: "Benzín 500 Kč" → okamžitě uložím

📊 **Příkazy:**
• "Pomoc" - návod
• "Přehled" - měsíční souhrn
• "Export" - export dat

Začněme! 🚀"""
        
        # Pošli odpověď přímo přes Twilio API místo TwiML
        # from_number už má odstraněný whatsapp: prefix, musíme ho přidat zpět
        whatsapp_from_number = f'whatsapp:{from_number}' if not from_number.startswith('whatsapp:') else from_number
        await _send_whatsapp_message(whatsapp_from_number, response_text)
        
        # Log outgoing message
        log_whatsapp_message(
            api_logger,
            direction="outgoing",
            phone_number=from_number,
            message=response_text,
            user_id=user_id
        )
        WHATSAPP_MESSAGES.labels(direction="outgoing", status="sent").inc()
        
        return Response(content="", status_code=200)
        
    except Exception as e:
        # Get from_number from variables if available
        error_phone = locals().get('from_number', 'unknown')
        error_message = locals().get('message_body', 'unknown')
        
        api_logger.error("Webhook processing failed", 
                        error=str(e),
                        phone_number=error_phone,
                        message_preview=error_message[:50] if error_message else None)
        
        WHATSAPP_MESSAGES.labels(direction="outgoing", status="error").inc()
        
        # Try to send error message if we have a phone number
        if error_phone != 'unknown':
            try:
                await _send_whatsapp_message(error_phone, "❌ Omlouvám se, nastala chyba při zpracování vaší zprávy. Zkuste to prosím znovu.")
            except:
                pass  # Ignore errors when sending error message
                
        return Response(content="", status_code=200)

async def _handle_payment_request(user_id: int, user_name: str, user_number: str) -> str:
    """Handle payment request from user"""
    try:
        # Get user's email (we'll need this for invoicing)
        # For now, we'll generate a placeholder email
        user_email = f"user{user_id}@temp-email.cz"  # TODO: Get real email during onboarding
        
        # Check if user already has active subscription
        subscription_info = await payment_service.get_user_subscription_info(user_id)
        
        if subscription_info.get('subscription_status') == 'active':
            ends_at = subscription_info.get('subscription_ends_at')
            if ends_at:
                from datetime import datetime
                end_date = datetime.fromisoformat(ends_at.replace('Z', '+00:00'))
                return f"""✅ *Vaše předplatné je již aktivní*

📅 Aktivní do: {end_date.strftime('%d.%m.%Y')}
💳 Status: Aktivní předplatné

Můžete začít používat všechny funkce ÚčetníBota!
Napište libovolnou transakci pro začátek."""
        
        # Create payment link
        result = await payment_service.create_subscription_payment(
            user_id=user_id,
            customer_email=user_email,
            customer_name=user_name or f"Uživatel {user_id}",
            provider="stripe"  # Default to Stripe
        )
        
        if result.success:
            return f"""💳 *Aktivace předplatného ÚčetníBot*

**Cena:** 299 Kč/měsíc
**První týden:** ZDARMA (zkušební období)

✅ *Co získáte:*
• Neomezené transakce
• AI kategorizace výdajů  
• Měsíční a kvartální přehledy
• DPH výpočty a reporty
• Export do CSV/XML
• Automatické faktury
• Připomínky daňových termínů

🔗 **Klikněte pro platbu:**
{result.payment_url}

💡 *Platba je zabezpečena přes Stripe. Po dokončení platby bude váš účet okamžitě aktivován.*

❓ Máte otázky? Napište "pomoc"."""
        else:
            logger.error("Payment creation failed", 
                        user_id=user_id, 
                        error=result.error_message)
            return f"""❌ *Chyba při vytváření platby*

Omlouváme se, nepodařilo se vytvořit platební odkaz.

🔧 *Zkuste prosím:*
• Napsat "platba" znovu za chvíli
• Kontaktovat podporu: podpora@ucetni-bot.cz

Nebo použijte alternativní způsob platby:
🌐 https://ucetni-bot.cz/subscribe"""
            
    except Exception as e:
        logger.error("Payment request handling failed", error=str(e), user_id=user_id)
        return """❌ *Nastala neočekávaná chyba*

Zkuste to prosím za chvíli znovu nebo kontaktujte podporu:
📧 podpora@ucetni-bot.cz

Děkujeme za pochopení."""

async def _send_whatsapp_message(to_number: str, message: str):
    """Pošle WhatsApp zprávu přímo přes Twilio API"""
    try:
        from twilio.rest import Client
        from twilio.base.exceptions import TwilioException
        
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER')
        
        client = Client(account_sid, auth_token)
        
        # Ensure proper WhatsApp number format
        # to_number should already have whatsapp: prefix from webhook
        if not to_number.startswith('whatsapp:'):
            to_number = f'whatsapp:{to_number}'
            
        sent_message = client.messages.create(
            body=message,
            from_=whatsapp_number,  # This should be whatsapp:+14155238886
            to=to_number           # This should be whatsapp:+420722158002
        )
        logger.info(f"Zpráva odeslána na {to_number}: {sent_message.sid}")
        
    except TwilioException as e:
        if "daily message limit" in str(e).lower() or "429" in str(e):
            logger.warning(f"Twilio rate limit dosažen: {str(e)}")
            # Místo odesílání zprávy logujeme obsah pro dev účely
            logger.info(f"[RATE LIMITED] Zpráva pro {to_number}: {message}")
            print(f"\n🚫 TWILIO RATE LIMIT - Zpráva by byla odeslána:")
            print(f"📱 Číslo: {to_number}")
            print(f"💬 Obsah: {message}")
            print("-" * 50)
        else:
            logger.error(f"Twilio chyba při odesílání zprávy: {str(e)}")
    except Exception as e:
        logger.error(f"Chyba při odesílání zprávy: {str(e)}")

async def _download_twilio_media(media_url: str) -> bytes:
    """
    Stáhne obrázek z Twilio s autentizací
    """
    try:
        import requests
        
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        
        if not media_url:
            raise ValueError("Media URL is empty")
            
        api_logger.info(f"Downloading media from Twilio: {media_url[:50]}...")
        
        response = requests.get(
            media_url,
            auth=(account_sid, auth_token),
            timeout=30  # 30 second timeout
        )
        
        if response.status_code == 200:
            api_logger.info(f"Media downloaded successfully: {len(response.content)} bytes")
            return response.content
        else:
            raise Exception(f"HTTP {response.status_code}: {response.text}")
            
    except Exception as e:
        api_logger.error(f"Chyba při stahování média z Twilio: {str(e)}")
        raise

async def _create_transaction_from_ocr(user_id: int, ocr_result: dict, original_message: str = ""):
    """
    Vytvoří transakci z OCR dat
    """
    try:
        from app.database.operations import db_operations
        from app.database.models import Transaction, TransactionItem, TransactionAttachment
        from app.database.connection import get_db_session
        from datetime import datetime
        
        # Připrav data pro transakci
        transaction_data = {
            'user_id': user_id,
            'type': ocr_result.get('type', 'expense'),
            'original_message': f"OCR: {original_message}" if original_message else "OCR zpracování",
            'description': ocr_result.get('description', ocr_result.get('vendor', 'Nerozpoznaný výdaj')),
            'amount_czk': float(ocr_result.get('amount', ocr_result.get('total', 0))),
            'original_amount': float(ocr_result.get('amount', ocr_result.get('total', 0))),
            'original_currency': 'CZK',
            'exchange_rate': 1.0,
            'category_code': ocr_result.get('category', '549100'),  # Ostatní náklady
            'category_name': ocr_result.get('category_name', 'Ostatní provozní náklady'),
            'processed_by_ai': ocr_result.get('ai_processed', True),
            'ai_confidence': ocr_result.get('ai_confidence', 0.7),
            'ai_model_used': ocr_result.get('ai_model', 'OCR+AI'),
            
            # Rozšířené údaje z OCR
            'document_number': ocr_result.get('document_number'),
            'document_date': ocr_result.get('date'),
            'counterparty_name': ocr_result.get('vendor') or ocr_result.get('vendor_verified'),
            'counterparty_ico': ocr_result.get('ico'),
            'counterparty_dic': ocr_result.get('dic'),
            'counterparty_address': ocr_result.get('vendor_address'),
            'vat_rate': ocr_result.get('vat_rate', 21),
            'vat_included': True,
            
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'transaction_date': datetime.now()
        }
        
        # Vypočítej DPH pokud je k dispozici
        if transaction_data['amount_czk'] > 0 and transaction_data['vat_rate'] > 0:
            if ocr_result.get('vat_amount'):
                transaction_data['vat_amount'] = float(ocr_result['vat_amount'])
                transaction_data['vat_base'] = transaction_data['amount_czk'] - transaction_data['vat_amount']
            else:
                # Výpočet DPH ze základu
                vat_multiplier = 1 + (transaction_data['vat_rate'] / 100)
                transaction_data['vat_base'] = transaction_data['amount_czk'] / vat_multiplier
                transaction_data['vat_amount'] = transaction_data['amount_czk'] - transaction_data['vat_base']
        
        # Uložit do databáze (simulace - v reálné implementaci by se použila databáze)
        api_logger.info(f"Transaction created from OCR: {transaction_data['description']} - {transaction_data['amount_czk']} CZK")
        
        # Vytvoř mock transaction object pro response
        class MockTransaction:
            def __init__(self, data):
                self.id = int(datetime.now().timestamp())
                self.description = data['description']
                self.amount_czk = data['amount_czk'] 
                self.category_name = data['category_name']
                self.counterparty_name = data.get('counterparty_name')
                self.document_number = data.get('document_number')
                self.vat_amount = data.get('vat_amount', 0)
                self.items_count = len(ocr_result.get('items', []))
        
        return MockTransaction(transaction_data)
        
    except Exception as e:
        api_logger.error(f"Chyba při vytváření transakce z OCR: {str(e)}")
        raise

def _format_ocr_response(ocr_result: dict, transaction) -> str:
    """
    Formátuje odpověď z OCR zpracování pro WhatsApp
    """
    if ocr_result.get('success'):
        # Hlavní informace
        amount = ocr_result.get('amount', ocr_result.get('total', 'nerozpoznáno'))
        vendor = (ocr_result.get('vendor_verified') or 
                 ocr_result.get('vendor') or 
                 'nerozpoznáno')
        date = ocr_result.get('date', 'nerozpoznáno')
        ico = ocr_result.get('ico', 'nerozpoznáno')
        
        # Sestavení response
        response = f"""✅ **Účtenka zpracována!**

📊 **Detaily:**
💰 Celkem: {amount} Kč
🏢 Obchod: {vendor}
📅 Datum: {date}"""
        
        if ico != 'nerozpoznáno':
            response += f"\n🏷️ IČO: {ico}"
            
        # Přidej DIČ pokud je k dispozici
        if ocr_result.get('dic'):
            response += f"\n🏷️ DIČ: {ocr_result['dic']}"
            
        # Dokument číslo
        if ocr_result.get('document_number'):
            response += f"\n📄 Doklad: {ocr_result['document_number']}"
        
        # Položky (max 5)
        items = ocr_result.get('items', [])
        if items:
            response += "\n\n📝 **Položky:**"
            for i, item in enumerate(items[:5]):
                price = item.get('price', item.get('total_with_vat', 0))
                quantity = item.get('quantity', 1)
                if quantity > 1:
                    response += f"\n  • {item.get('description', 'Položka')}: {quantity}x {price} Kč"
                else:
                    response += f"\n  • {item.get('description', 'Položka')}: {price} Kč"
            
            if len(items) > 5:
                response += f"\n  • ... a {len(items) - 5} dalších"
        
        response += f"\n\n💾 **Transakce #{transaction.id} uložena**"
        response += f"\n📊 Kategorie: {transaction.category_name}"
        
        if hasattr(transaction, 'vat_amount') and transaction.vat_amount > 0:
            response += f"\n💶 DPH: {transaction.vat_amount:.0f} Kč"
        
        # Confidence info
        ocr_confidence = ocr_result.get('ocr_confidence', 0.7) * 100
        response += f"\n🎯 Přesnost: {ocr_confidence:.0f}%"
        
        if ocr_result.get('ai_processed'):
            response += "\n🤖 Zpracováno pomocí AI"
            
        return response
        
    else:
        return f"""❌ **Nepodařilo se přečíst účtenku**

{ocr_result.get('message', 'Neznámá chyba')}

💡 **Tipy pro lepší rozpoznání:**
• Vyfoťte účtenku na rovném povrchu
• Zajistěte dobré osvětlení
• Celá účtenka musí být vidět
• Zkuste ostřejší fotografii

📝 **Nebo napište údaje ručně:**
"Alza 1500 Kč\""""

def _get_welcome_message() -> str:
    """
    Uvítací zpráva pro nové uživatele
    """
    return """👋 **Vítejte v ÚčtoBotu!**

Jsem váš AI účetní asistent pro OSVČ. 

📸 **Pošlete fotku účtenky:**
• Vyfoťte účtenku mobilem
• Pošlete mi ji zde  
• Automaticky rozpoznám všechny údaje
• Uložím transakci do účetnictví

📝 **Nebo napište text:**
• "Benzín 800 Kč"
• "Alza notebook 25000"
• "Faktura od klienta 15000 + DPH"

📊 **Užitečné příkazy:**
• "Pomoc" - podrobný návod
• "Přehled" - měsíční souhrn
• "Export" - export dat do CSV

✨ **První účtenka je ZDARMA!**

Začněme účtovat! 🚀"""

def _get_welcome_message_registered(user) -> str:
    """
    Úvitací zpráva pro registrované uživatele
    """
    name = user.full_name or "uživateli"
    business_type = user.business_type
    business_type_name = {
        'it_programming': 'IT/Programování',
        'graphic_design': 'Grafika/Design',
        'consulting': 'Konzultace/Poradenství',
        'trades_construction': 'Řemesla/Stavebnictví',
        'e_commerce': 'E-commerce',
        'other': 'Jiné'
    }.get(business_type, 'Jiné')
    
    return f"""👋 **Vítejte zpět, {name}!**

🏢 **Typ podnikání:** {business_type_name}
💼 **Status:** Registrován

📸 **Pošlete fotku účtenky:**
• Automaticky zpracuji všechny údaje
• Uložím do vašeho účetnictví
• Kategorizuji podle vašeho podnikání

📝 **Nebo napište text:**
• "Benzín 800 Kč"
• "Alza notebook 25000"
• "Příjem od klienta 15000"

📊 **Užitečné příkazy:**
• "Pomoc" - kompletní návod
• "Přehled" - měsíční souhrn
• "Kvartal" - kvartální přehled + DPH
• "Export" - export dat do CSV
• "Info" - stav účtu a předplatného

Začněme účtovat! 🚀"""

def _get_welcome_message_unregistered() -> str:
    """
    Úvitací zpráva pro neregistrované uživatele
    """
    return """👋 **Vítejte u ÚčetníBota!**

Jsem AI asistent pro účetnictví OSVČ.

🔐 **Pro používání potřebujete:**
1️⃣ Zakoupit předplatné na **ucetnibot.cz**
2️⃣ Získat aktivační kód (32 znaků)
3️⃣ Poslat kód sem pro aktivaci

💰 **Cena:** 299 Kč/měsíc
🌐 **Web:** ucetnibot.cz
📧 **Pomoc:** podpora@ucetnibot.cz

✨ **Co získáte:**
• Neomezené transakce a účtenky
• AI kategorizace výdajů
• Měsíční a kvartální přehledy
• DPH výpočty a reporty
• Export do CSV/XML
• Automatické připomínky daňových terminů

Začněte na **ucetnibot.cz**! 🚀"""

def _get_help_message() -> str:
    """
    Aktualizovaná nápověda s podporou obrázků
    """
    return """🤖 **ÚčtoBot - Kompletní návod**

📸 **OBRÁZKY ÚČTENEK:**
• Vyfoťte účtenku nebo fakturu
• Pošlete obrázek sem
• AI automaticky rozpozná:
  ▪️ Celkovou částku
  ▪️ Název obchodu a IČO  
  ▪️ Datum nákupu
  ▪️ Jednotlivé položky
  ▪️ DPH informace

📝 **TEXTOVÉ PŘÍKAZY:**
• "Koupil jsem [věc] za [částka]"
• "Benzín 800 Kč"
• "Alza notebook 25000"
• "Faktura od klienta 15000 + DPH"
• "Úhrada za služby 5000 bez DPH"

💡 **INTELIGENTNÍ FUNKCE:**
• Automatická kategorizace výdajů
• Rozpoznání DPH a výpočty
• Validace IČO přes ARES registr
• Připomínky na daňové termíny

📊 **REPORTY A PŘEHLEDY:**
• "Přehled" - měsíční souhrn
• "Compliance" - daňová compliance analýza
• "Detaily compliance" - detailní compliance report
• "Kvartál" - kvartální přehled + DPH
• "Export" - export dat do CSV
• "DPH" - DPH přiznání

💳 **PŘEDPLATNÉ:**
• "Info" - stav vašeho účtu
• "Platba" - aktivace předplatného

🎯 **PŘÍKLADY:**
✅ Pošlete fotku účtenky z Lidlu
✅ "Tankoval jsem za 1200"  
✅ "Faktura Alza IČO 27082440 celkem 5000"
✅ "Přijal platbu 10000 od klienta"

**Začněme! Pošlete první účtenku! 📸**"""

def _create_response(message: str):
    # TwiML odpověď pro WhatsApp  
    from fastapi.responses import Response
    response = MessagingResponse()
    msg = response.message()
    msg.body(message)
    return Response(content=str(response), media_type="application/xml")


async def _get_monthly_summary(user_id: int) -> str:
    try:
        from app.database.operations import db_operations
        summary = await db_operations.get_monthly_summary(user_id)
        
        if not summary:
            return "📊 Zatím nemáte žádné transakce v tomto měsíci."
        
        month_name = _get_czech_month_name(datetime.now().month)
        year = datetime.now().year
        
        response = f"""📊 *Přehled za {month_name} {year}:*

📈 *Příjmy:* {_format_currency(summary['total_income'])} Kč
📉 *Výdaje:* {_format_currency(summary['total_expenses'])} Kč
💰 *Zisk:* {_format_currency(summary['profit'])} Kč

*Počet transakcí:* {summary['transaction_count']}"""
        
        if summary['top_expenses']:
            response += "\n\n*Top 3 výdaje:*"
            for i, expense in enumerate(summary['top_expenses'][:3], 1):
                response += f"\n{i}. {expense['category_name']}: {_format_currency(expense['amount'])} Kč"
        
        return response
        
    except Exception as e:
        logger.error(f"Chyba při získávání měsíčního přehledu: {str(e)}")
        return "❌ Nepodařilo se získat měsíční přehled."

async def _get_quarterly_summary(user_id: int) -> str:
    try:
        from app.database.operations import db_operations
        summary = await db_operations.get_quarterly_summary(user_id)
        
        if not summary:
            return "📊 Zatím nemáte žádné transakce v tomto kvartálu."
        
        quarter = (datetime.now().month - 1) // 3 + 1
        year = datetime.now().year
        
        response = f"""📊 *Přehled za Q{quarter} {year}:*

📈 *Příjmy:* {_format_currency(summary['total_income'])} Kč
📉 *Výdaje:* {_format_currency(summary['total_expenses'])} Kč
💰 *Zisk:* {_format_currency(summary['profit'])} Kč

*Počet transakcí:* {summary['transaction_count']}

*DPH info:*
• Odvod DPH (odhad): {_format_currency(summary['vat_estimate'])} Kč
• Termín podání: 25. {_get_quarter_deadline_month(quarter)}"""
        
        if summary['category_breakdown']:
            response += "\n\n*Rozdělení výdajů:*"
            for category in summary['category_breakdown'][:5]:
                percentage = (category['amount'] / summary['total_expenses'] * 100) if summary['total_expenses'] > 0 else 0
                response += f"\n• {category['category_name']}: {_format_currency(category['amount'])} Kč ({percentage:.1f}%)"
        
        return response
        
    except Exception as e:
        logger.error(f"Chyba při získávání kvartálního přehledu: {str(e)}")
        return "❌ Nepodařilo se získat kvartální přehled."

async def _export_data(user_id: int) -> str:
    try:
        from app.database.operations import db_operations
        export_url = await db_operations.export_to_csv(user_id)
        return f"""📥 *Export dat*

Váš export je připraven ke stažení:
{export_url}

Link je platný 24 hodin."""
    except Exception as e:
        logger.error(f"Chyba při exportu dat: {str(e)}")
        return "❌ Nepodařilo se vyexportovat data."

def _format_currency(amount: float) -> str:
    return f"{amount:,.0f}".replace(",", " ")

def _get_czech_month_name(month: int) -> str:
    months = {
        1: "leden", 2: "únor", 3: "březen", 4: "duben",
        5: "květen", 6: "červen", 7: "červenec", 8: "srpen",
        9: "září", 10: "říjen", 11: "listopad", 12: "prosinec"
    }
    return months.get(month, "")

def _get_quarter_deadline_month(quarter: int) -> str:
    deadlines = {1: "dubna", 2: "července", 3: "října", 4: "ledna"}
    return deadlines.get(quarter, "")

async def _format_detailed_compliance_report(report: dict) -> str:
    """Formátuje detailní compliance report pro WhatsApp"""
    
    if report.get('error'):
        return f"❌ {report['error']}"
    
    if report['compliance_summary']['total_transactions'] == 0:
        return f"📊 Žádné transakce za {report['month_name']} {report['year']}"
    
    summary = report['compliance_summary']
    risk = report['risk_analysis']
    
    message = f"""📋 **Detailní Compliance Analýza - {report['month_name']} {report['year']}**

🎯 **Celkové hodnocení: {summary['overall_score']:.1f}%**

📊 **Breakdown transakcí:**
✅ Výborné (95-100%): {summary['excellent_transactions']}
🟡 Dobré (80-94%): {summary['good_transactions']} 
⚠️ Varování (60-79%): {summary['warning_transactions']}
🚨 Kritické (<60%): {summary['critical_transactions']}

💰 **Finanční rizika:**
• Celkem: {summary['total_amount_czk']:,.0f} Kč
• Riziková částka: {summary['high_risk_amount_czk']:,.0f} Kč
• Podíl rizika: {summary['high_risk_percentage']}%

🔍 **Audit analýza:**
• Riziko kontroly: {risk['audit_risk_level'].upper()}
• Velké výdaje bez dokumentace: {risk['large_transactions_incomplete']}
• Chybějící IČO: {risk['missing_ico_count']}x
• Chybějící doklady: {risk['missing_documents_count']}x"""

    # Problematické transakce
    if report['detailed_issues']:
        message += "\n\n🚨 **Top problematické transakce:**"
        for issue in report['detailed_issues'][:3]:
            risk_emoji = "🔴" if issue['priority'] == 'high' else "🟡"
            message += f"\n{risk_emoji} {issue['date']}: {issue['amount']:,.0f} Kč"
            message += f"\n   {issue['description'][:50]}..."
            if issue['missing_required']:
                message += f"\n   ❌ Chybí: {', '.join(issue['missing_required'][:2])}"
    
    # Doporučení
    if report['recommendations']:
        message += "\n\n💡 **Prioritní doporučení:**"
        for rec in report['recommendations'][:3]:
            priority_emoji = "🚨" if rec['priority'] == 'urgent' else "⚠️" if rec['priority'] == 'high' else "ℹ️"
            message += f"\n{priority_emoji} {rec['title']}"
    
    # Právní kontext
    message += f"""\n\n📚 **Právní kontext:**
• Podle zákona č. 586/1992 Sb. (ZDP)
• Povinnost vést evidenci pro uplatnění nákladů
• Kontrola FÚ může probíhat až 3 roky zpět
• Nedostatečná evidence = neuznání nákladů"""
    
    if summary['overall_score'] < 70:
        message += "\n\n🚨 **DŮLEŽITÉ UPOZORNĚNÍ:**\nNízká úroveň compliance může vést k problémům při kontrole finančního úřadu. Doporučujeme neprodleně doplnit chybějící údaje."
    
    return message

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)