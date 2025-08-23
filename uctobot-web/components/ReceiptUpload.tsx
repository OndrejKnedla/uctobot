"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Upload, Camera, FileImage, Loader2, CheckCircle, XCircle, Info } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ReceiptUploadProps {
  userId: number
  onTransactionCreated?: (transaction: any) => void
}

interface ProcessingResult {
  success: boolean
  message: string
  transaction?: {
    id: number
    type: string
    description: string
    amount: number
    currency: string
    category: string
    document_number?: string
    counterparty?: string
    items_count: number
  }
  ocr_info?: {
    text_extracted: number
    confidence: number
    processing_time: string
  }
  ai_info?: {
    model_used: string
    confidence: number
    fields_extracted: number
  }
}

export default function ReceiptUpload({ userId, onTransactionCreated }: ReceiptUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  const handleFileSelect = (selectedFile: File) => {
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "Nepodporovaný formát",
        description: "Prosím nahrajte obrázek (PNG, JPG, GIF, BMP, TIFF, WebP)",
        variant: "destructive"
      })
      return
    }

    if (selectedFile.size > maxSize) {
      toast({
        title: "Soubor je příliš velký",
        description: "Maximální velikost je 10MB",
        variant: "destructive"
      })
      return
    }

    setFile(selectedFile)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(selectedFile)
    setResult(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const processReceipt = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('user_id', userId.toString())
      formData.append('file', file)
      if (description) {
        formData.append('transaction_description', description)
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('http://localhost:8000/ocr/process-receipt', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data: ProcessingResult = await response.json()

      if (response.ok && data.success) {
        setResult(data)
        toast({
          title: "Účtenka zpracována",
          description: data.message,
        })
        
        if (onTransactionCreated && data.transaction) {
          onTransactionCreated(data.transaction)
        }
      } else {
        throw new Error(data.message || 'Chyba při zpracování')
      }

    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Nastala neočekávaná chyba'
      })
      toast({
        title: "Chyba při zpracování",
        description: error.message || 'Nastala neočekávaná chyba',
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setDescription('')
    setResult(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Nahrát účtenku
        </CardTitle>
        <CardDescription>
          Nahrajte fotografii účtenky nebo faktury a AI automaticky extrahuje všechny účetní údaje
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="space-y-4">
              <img 
                src={preview} 
                alt="Náhled účtenky" 
                className="max-h-64 mx-auto rounded-lg shadow-md"
              />
              <p className="text-sm text-gray-600">
                {file?.name} ({(file?.size || 0) / 1024 / 1024 < 1 
                  ? `${Math.round((file?.size || 0) / 1024)} KB`
                  : `${((file?.size || 0) / 1024 / 1024).toFixed(1)} MB`
                })
              </p>
              <Button 
                variant="outline" 
                onClick={reset}
                disabled={isProcessing}
              >
                Změnit soubor
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <FileImage className="w-12 h-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Přetáhněte účtenku sem
                </p>
                <p className="text-sm text-gray-600">
                  nebo klikněte pro výběr souboru
                </p>
              </div>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Upload className="w-4 h-4 mr-2" />
                Vybrat soubor
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={allowedTypes.join(',')}
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Dodatečné informace (volitelné)
          </Label>
          <Textarea
            id="description"
            placeholder="Např. 'Nákup kancelářských potřeb pro projekt X'"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isProcessing}
            rows={2}
          />
        </div>

        {/* Process Button */}
        <Button 
          onClick={processReceipt}
          disabled={!file || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Zpracovávám...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Zpracovat účtenku
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-gray-600">
              {progress < 30 && "Nahrávám obrázek..."}
              {progress >= 30 && progress < 60 && "Rozpoznávám text (OCR)..."}
              {progress >= 60 && progress < 90 && "Zpracovávám AI parserem..."}
              {progress >= 90 && "Ukládám do databáze..."}
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <Separator />
            
            {result.success ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="font-medium text-green-800">
                  {result.message}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {result.message}
                </AlertDescription>
              </Alert>
            )}

            {result.transaction && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Transakce vytvořena
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Typ:</span>
                      <Badge variant={result.transaction.type === 'income' ? 'default' : 'secondary'} className="ml-2">
                        {result.transaction.type === 'income' ? 'Příjem' : 'Výdaj'}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Částka:</span>
                      <span className="ml-2 font-bold">
                        {result.transaction.amount.toLocaleString()} {result.transaction.currency}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Popis:</span>
                      <p className="mt-1">{result.transaction.description}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Kategorie:</span>
                      <p className="text-sm">{result.transaction.category}</p>
                    </div>
                    {result.transaction.counterparty && (
                      <div>
                        <span className="font-medium text-gray-600">Dodavatel:</span>
                        <p className="text-sm">{result.transaction.counterparty}</p>
                      </div>
                    )}
                    {result.transaction.document_number && (
                      <div>
                        <span className="font-medium text-gray-600">Číslo dokladu:</span>
                        <p className="text-sm">{result.transaction.document_number}</p>
                      </div>
                    )}
                    {result.transaction.items_count > 0 && (
                      <div>
                        <span className="font-medium text-gray-600">Položky:</span>
                        <p className="text-sm">{result.transaction.items_count} položek</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing Info */}
            {(result.ocr_info || result.ai_info) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Detaily zpracování
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.ocr_info && (
                    <div className="text-sm space-y-1">
                      <h4 className="font-medium">OCR rozpoznávání:</h4>
                      <div className="text-gray-600 space-y-1">
                        <p>• Extrahováno {result.ocr_info.text_extracted} znaků</p>
                        <p>• Přesnost: {result.ocr_info.confidence.toFixed(1)}%</p>
                        <p>• Doba zpracování: {result.ocr_info.processing_time}</p>
                      </div>
                    </div>
                  )}
                  
                  {result.ai_info && (
                    <div className="text-sm space-y-1">
                      <h4 className="font-medium">AI zpracování:</h4>
                      <div className="text-gray-600 space-y-1">
                        <p>• Model: {result.ai_info.model_used}</p>
                        <p>• Spolehlivost: {(result.ai_info.confidence * 100).toFixed(1)}%</p>
                        <p>• Extrahováno polí: {result.ai_info.fields_extracted}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* File Format Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Podporované formáty:</strong> PNG, JPG, GIF, BMP, TIFF, WebP</p>
          <p><strong>Maximální velikost:</strong> 10MB</p>
          <p><strong>Tip:</strong> Pro nejlepší výsledky použijte kvalitní fotografii s dobrým osvětlením a ostrým textem.</p>
        </div>
      </CardContent>
    </Card>
  )
}