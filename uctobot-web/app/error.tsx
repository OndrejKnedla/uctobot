"use client"


export const dynamic = "force-dynamic"

import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-destructive">
              <AlertCircle className="h-full w-full" />
            </div>
            <CardTitle className="text-xl">Něco se pokazilo</CardTitle>
            <CardDescription>
              Došlo k neočekávané chybě. Pokud probíhala platba, pravděpodobně byla úspěšná.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <strong>Pokud jste právě zaplatili:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Platba byla pravděpodobně zpracována</li>
                <li>• Zkontrolujte svůj email</li>
                <li>• Kontaktujte podporu na info@dokladbot.cz</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Zkusit znovu
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Zpět na hlavní stránku
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/platba-uspesna'}
                className="w-full"
              >
                Pokračovat na úspěšnou platbu
              </Button>
            </div>
            
            {error.digest && (
              <div className="text-xs text-muted-foreground text-center">
                Kód chyby: {error.digest}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}