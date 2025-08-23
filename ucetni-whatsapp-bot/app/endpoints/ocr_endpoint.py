"""
OCR Endpoint pro zpracování obrázků účtenek a faktur
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
import logging
import io
import os
from datetime import datetime

# OCR dependencies
try:
    import pytesseract
    from PIL import Image
    # Test if tesseract binary is available
    try:
        pytesseract.get_tesseract_version()
        OCR_AVAILABLE = True
    except pytesseract.TesseractNotFoundError:
        OCR_AVAILABLE = False
        print("WARNING: Tesseract OCR binary not found. Install with: sudo apt install tesseract-ocr tesseract-ocr-ces tesseract-ocr-eng")
except ImportError as e:
    OCR_AVAILABLE = False
    print(f"WARNING: OCR dependencies not installed: {e}")

from app.ai_processor import AIProcessor
from app.services.user_service import UserService
from app.database.models import TransactionAttachment, Transaction, TransactionItem
from app.database.connection import get_db_session
from sqlalchemy.orm import Session

router = APIRouter(prefix="/ocr", tags=["OCR"])
logger = logging.getLogger(__name__)

# Initialize services
ai_processor = AIProcessor()
user_service = UserService()

# Allowed file types for OCR
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@router.get("/status")
async def ocr_status():
    """Check OCR service status"""
    return {
        "ocr_available": OCR_AVAILABLE,
        "tesseract_path": pytesseract.pytesseract.tesseract_cmd if OCR_AVAILABLE else None,
        "supported_formats": list(ALLOWED_EXTENSIONS) if OCR_AVAILABLE else [],
        "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024),
        "service_status": "ready" if OCR_AVAILABLE else "dependencies_missing"
    }

@router.post("/process-receipt")
async def process_receipt(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    transaction_description: Optional[str] = Form(None),
    db: Session = Depends(get_db_session)
):
    """
    Zpracuje obrázek účtenky/faktury pomocí OCR a AI
    """
    if not OCR_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="OCR služba není dostupná. Chybí pytesseract nebo Pillow dependencies."
        )
    
    try:
        # Validate file
        if not file.filename or not allowed_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Nepodporovaný formát souboru. Povolené: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Check file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Soubor je příliš velký. Maximum: {MAX_FILE_SIZE // (1024 * 1024)}MB"
            )
        
        # Validate user exists
        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Uživatel nenalezen")
        
        logger.info(f"Processing OCR for user {user_id}, file: {file.filename}")
        
        # Process image with OCR
        try:
            image = Image.open(io.BytesIO(content))
            
            # Extract text using Tesseract
            ocr_text = pytesseract.image_to_string(image, lang='ces+eng')
            
            # Get confidence score
            ocr_data = pytesseract.image_to_data(image, lang='ces+eng', output_type=pytesseract.Output.DICT)
            confidences = [int(conf) for conf in ocr_data['conf'] if int(conf) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
        except Exception as e:
            logger.error(f"OCR processing failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Chyba při OCR zpracování: {str(e)}")
        
        if not ocr_text.strip():
            raise HTTPException(status_code=422, detail="Z obrázku se nepodařilo extrahovat žádný text")
        
        logger.info(f"OCR extracted {len(ocr_text)} characters with {avg_confidence:.1f}% confidence")
        
        # Process with enhanced AI parser
        try:
            attachment_info = {
                "file_name": file.filename,
                "file_size": len(content),
                "file_type": file.content_type,
                "ocr_confidence": avg_confidence
            }
            
            ai_result = await ai_processor.process_enhanced_message(
                message=transaction_description or "",
                ocr_text=ocr_text,
                attachment_info=attachment_info
            )
            
        except Exception as e:
            logger.error(f"AI processing failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Chyba při AI zpracování: {str(e)}")
        
        if not ai_result:
            # Return OCR text even if AI parsing failed
            return JSONResponse(content={
                "success": False,
                "message": "AI parser nemohl extrahovat strukturovaná data",
                "ocr_text": ocr_text,
                "ocr_confidence": avg_confidence,
                "raw_data": {
                    "file_info": attachment_info
                }
            })
        
        # Save transaction and attachment to database
        try:
            # Create transaction
            transaction = Transaction(
                user_id=user_id,
                type=ai_result['type'],
                original_message=f"OCR: {file.filename}",
                description=ai_result['description'],
                amount_czk=ai_result['amount'],
                original_amount=ai_result.get('original_amount'),
                original_currency=ai_result.get('original_currency', 'CZK'),
                exchange_rate=ai_result.get('exchange_rate', 1.0),
                category_code=ai_result.get('category'),
                category_name=ai_result.get('category_name'),
                processed_by_ai=True,
                ai_confidence=ai_result.get('ai_confidence', 0.8),
                ai_model_used=ai_result.get('ai_model_used', 'llama-3.1-8b-instant'),
                
                # Extended accounting fields
                document_number=ai_result.get('document_number'),
                document_date=ai_result.get('document_date'),
                due_date=ai_result.get('due_date'),
                payment_date=ai_result.get('payment_date'),
                counterparty_name=ai_result.get('counterparty_name'),
                counterparty_ico=ai_result.get('counterparty_ico'),
                counterparty_dic=ai_result.get('counterparty_dic'),
                counterparty_address=ai_result.get('counterparty_address'),
                payment_method=ai_result.get('payment_method'),
                bank_account=ai_result.get('bank_account'),
                variable_symbol=ai_result.get('variable_symbol'),
                constant_symbol=ai_result.get('constant_symbol'),
                specific_symbol=ai_result.get('specific_symbol'),
                
                # VAT info
                vat_rate=ai_result.get('vat_rate'),
                vat_base=ai_result.get('vat_base'),
                vat_amount=ai_result.get('vat_amount'),
                vat_included=ai_result.get('vat_included', True),
                
                created_at=datetime.now(),
                updated_at=datetime.now(),
                transaction_date=datetime.now()
            )
            
            db.add(transaction)
            db.flush()  # Get transaction ID
            
            # Create attachment record
            attachment = TransactionAttachment(
                transaction_id=transaction.id,
                uploaded_by_user_id=user_id,
                file_name=file.filename,
                original_name=file.filename,
                file_type=file.content_type,
                file_size=len(content),
                uploaded_via="api",
                ocr_processed=True,
                ocr_confidence=avg_confidence / 100.0,  # Convert to 0-1 range
                ocr_text=ocr_text,
                ai_processed=True,
                ai_extracted_data=ai_result,
                ai_confidence=ai_result.get('ai_confidence', 0.8),
                uploaded_at=datetime.now(),
                processed_at=datetime.now()
            )
            
            db.add(attachment)
            
            # Create transaction items if available
            transaction_items = []
            if ai_result.get('items'):
                for item_data in ai_result['items']:
                    transaction_item = TransactionItem(
                        transaction_id=transaction.id,
                        description=item_data.get('description', ''),
                        quantity=item_data.get('quantity', 1.0),
                        unit=item_data.get('unit', 'ks'),
                        unit_price=item_data.get('unit_price'),
                        unit_price_with_vat=item_data.get('unit_price_with_vat'),
                        vat_rate=item_data.get('vat_rate', 21),
                        total_without_vat=item_data.get('total_without_vat'),
                        vat_amount=item_data.get('vat_amount'),
                        total_with_vat=item_data.get('total_with_vat'),
                        item_category_code=item_data.get('item_category_code'),
                        item_category_name=item_data.get('item_category_name'),
                        created_at=datetime.now()
                    )
                    db.add(transaction_item)
                    transaction_items.append(transaction_item)
            
            db.commit()
            
            logger.info(f"Successfully processed OCR transaction {transaction.id} for user {user_id}")
            
            # Prepare response
            response_data = {
                "success": True,
                "message": "Účtenka byla úspěšně zpracována",
                "transaction": {
                    "id": transaction.id,
                    "type": transaction.type,
                    "description": transaction.description,
                    "amount": float(transaction.amount_czk),
                    "currency": transaction.original_currency,
                    "category": transaction.category_name,
                    "document_number": transaction.document_number,
                    "counterparty": transaction.counterparty_name,
                    "items_count": len(transaction_items)
                },
                "ocr_info": {
                    "text_extracted": len(ocr_text),
                    "confidence": avg_confidence,
                    "processing_time": "< 5s"
                },
                "ai_info": {
                    "model_used": ai_result.get('ai_model_used'),
                    "confidence": ai_result.get('ai_confidence'),
                    "fields_extracted": len([k for k, v in ai_result.items() if v is not None])
                }
            }
            
            return JSONResponse(content=response_data)
            
        except Exception as e:
            db.rollback()
            logger.error(f"Database save failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Chyba při ukládání do databáze: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in OCR processing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Neočekávaná chyba: {str(e)}")

@router.post("/extract-text")
async def extract_text_only(
    file: UploadFile = File(...),
    language: str = Form("ces+eng")
):
    """
    Pouze extrahuje text z obrázku pomocí OCR bez AI zpracování
    """
    if not OCR_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="OCR služba není dostupná"
        )
    
    try:
        if not allowed_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail="Nepodporovaný formát souboru"
            )
        
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Soubor je příliš velký"
            )
        
        # Process with OCR
        image = Image.open(io.BytesIO(content))
        ocr_text = pytesseract.image_to_string(image, lang=language)
        
        # Get confidence data
        ocr_data = pytesseract.image_to_data(image, lang=language, output_type=pytesseract.Output.DICT)
        confidences = [int(conf) for conf in ocr_data['conf'] if int(conf) > 0]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        return JSONResponse(content={
            "success": True,
            "ocr_text": ocr_text,
            "confidence": avg_confidence,
            "character_count": len(ocr_text),
            "language": language
        })
        
    except Exception as e:
        logger.error(f"Text extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chyba při extrakci textu: {str(e)}")

@router.get("/languages")
async def get_supported_languages():
    """
    Vrátí seznam podporovaných jazyků pro OCR
    """
    if not OCR_AVAILABLE:
        raise HTTPException(status_code=503, detail="OCR služba není dostupná")
    
    try:
        # Get available languages from tesseract
        available_langs = pytesseract.get_languages()
        
        # Common language mappings
        lang_names = {
            'ces': 'Čeština',
            'eng': 'Angličtina', 
            'deu': 'Němčina',
            'fra': 'Francouzština',
            'spa': 'Španělština',
            'ita': 'Italština',
            'pol': 'Polština',
            'slk': 'Slovenština'
        }
        
        supported_langs = []
        for lang in available_langs:
            supported_langs.append({
                "code": lang,
                "name": lang_names.get(lang, lang.capitalize()),
                "recommended": lang in ['ces', 'eng']
            })
        
        return JSONResponse(content={
            "languages": supported_langs,
            "default": "ces+eng",
            "total_count": len(supported_langs)
        })
        
    except Exception as e:
        logger.error(f"Failed to get languages: {str(e)}")
        return JSONResponse(content={
            "languages": [
                {"code": "ces", "name": "Čeština", "recommended": True},
                {"code": "eng", "name": "Angličtina", "recommended": True}
            ],
            "default": "ces+eng",
            "error": "Nelze načíst seznam jazyků z Tesseract"
        })