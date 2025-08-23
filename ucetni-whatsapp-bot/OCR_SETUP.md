# OCR Setup - Instalace Tesseract

Aplikace podporuje zpracování obrázků účtenek a faktur pomocí OCR (Optical Character Recognition).

## Požadavky

### Systémové závislosti
```bash
sudo apt update
sudo apt install -y tesseract-ocr tesseract-ocr-ces tesseract-ocr-eng
```

### Python závislosti
```bash
pip install pytesseract Pillow
```

## Kontrola instalace

```bash
tesseract --version
```

Měli byste vidět něco jako:
```
tesseract 4.1.1
```

## Testování OCR funkcionality

Po instalaci můžete otestovat OCR endpoint:

```bash
curl -X GET http://localhost:8000/ocr/status
```

Očekávaný výsledek:
```json
{
  "ocr_available": true,
  "tesseract_path": "tesseract",
  "supported_formats": ["png", "jpg", "jpeg", "gif", "bmp", "tiff", "webp"],
  "max_file_size_mb": 10,
  "service_status": "ready"
}
```

## API Endpointy

### `/ocr/status` - Kontrola stavu OCR služby
### `/ocr/process-receipt` - Zpracování účtenky (OCR + AI parsing)  
### `/ocr/extract-text` - Pouze extrakce textu bez AI
### `/ocr/languages` - Seznam podporovaných jazyků

## Podporované formáty

- PNG, JPG, JPEG
- GIF, BMP, TIFF, WEBP
- Maximální velikost: 10MB

## Podporované jazyky

- `ces` - Čeština
- `eng` - Angličtina
- `deu` - Němčina
- A další dle instalace Tesseract

## Příklad použití

```bash
# Zpracování účtenky s OCR + AI
curl -X POST "http://localhost:8000/ocr/process-receipt" \
  -F "user_id=1" \
  -F "file=@receipt.jpg" \
  -F "transaction_description=Nákup materiálu"

# Pouze extrakce textu
curl -X POST "http://localhost:8000/ocr/extract-text" \
  -F "file=@receipt.jpg" \
  -F "language=ces+eng"
```

## Řešení problémů

### Tesseract not found
```
TesseractNotFoundError: tesseract is not installed or it's not in your PATH
```

Řešení:
1. Nainstalujte Tesseract: `sudo apt install tesseract-ocr`
2. Ověřte PATH: `which tesseract`
3. V kódu můžete nastavit přímou cestu:
   ```python
   pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'
   ```

### Špatné rozpoznávání češtiny
1. Nainstalujte český jazyk: `sudo apt install tesseract-ocr-ces`
2. Použijte language parameter: `ces+eng`

### Nízká přesnost OCR
1. Zvyšte kvalitu obrázku (min. 300 DPI)
2. Zajistěte dostatečný kontrast
3. Odstraňte šum z obrázku
4. Použijte rovný úhel snímku