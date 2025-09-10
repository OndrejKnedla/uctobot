import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Search, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-6xl font-bold text-muted-foreground">
              404
            </div>
            <CardTitle className="text-xl">Stránka nebyla nalezena</CardTitle>
            <CardDescription>
              Stránka, kterou hledáte, neexistuje nebo byla přesunuta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
              <strong>Pokud jste právě dokončili platbu:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Platba byla pravděpodobně úspěšná</li>
                <li>• Zkuste přejít na stránku úspěšné platby</li>
                <li>• Zkontrolujte svůj email</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Hlavní stránka
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/platba-uspesna">
                  <Search className="mr-2 h-4 w-4" />
                  Stránka úspěšné platby
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.history.back()} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zpět
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}