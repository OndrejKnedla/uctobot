'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageCircle, Menu, Phone } from 'lucide-react';

interface HeaderProps {
  showMainPageSections?: boolean;
}

export default function Header({ showMainPageSections = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const scrollToSection = (id: string) => {
    if (showMainPageSections) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/#${id}`);
    }
    setMobileMenuOpen(false);
  };

  const handleRegister = () => {
    router.push('/#cenik');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-2">
            <MessageCircle className="h-10 w-10 text-[#25D366]" />
            <span className="text-2xl font-bold">DokladBot</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("jak-funguje")}
              className="text-muted-foreground hover:text-foreground"
            >
              Jak to funguje
            </button>
            <button 
              onClick={() => scrollToSection("cenik")} 
              className="text-muted-foreground hover:text-foreground"
            >
              Ceník
            </button>
            <button
              onClick={() => scrollToSection("recenze")}
              className="text-muted-foreground hover:text-foreground"
            >
              Recenze
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-muted-foreground hover:text-foreground"
            >
              FAQ
            </button>
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground"
            >
              Blog
            </Link>
{!showMainPageSections && (
              <a
                href="tel:+420722158002"
                className="text-muted-foreground hover:text-foreground flex items-center space-x-1"
              >
                <Phone className="h-4 w-4" />
                <span>+420 722 158 002</span>
              </a>
            )}
            <Button 
              size="lg"
              className="bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold"
              onClick={handleRegister}
            >
              VYZKOUŠET ZDARMA
            </Button>
          </div>

          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t">
          <div className="px-4 py-2 space-y-2">
            <button
              onClick={() => scrollToSection("jak-funguje")}
              className="block w-full text-left py-2 text-muted-foreground"
            >
              Jak to funguje
            </button>
            <button
              onClick={() => scrollToSection("cenik")}
              className="block w-full text-left py-2 text-muted-foreground"
            >
              Ceník
            </button>
            <button
              onClick={() => scrollToSection("recenze")}
              className="block w-full text-left py-2 text-muted-foreground"
            >
              Recenze
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="block w-full text-left py-2 text-muted-foreground"
            >
              FAQ
            </button>
            <Link
              href="/blog"
              className="block w-full text-left py-2 text-muted-foreground"
            >
              Blog
            </Link>
{!showMainPageSections && (
              <a
                href="tel:+420722158002"
                className="block w-full text-left py-2 text-muted-foreground"
              >
                📞 +420 722 158 002
              </a>
            )}
            <Button 
              size="lg"
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold mt-2"
              onClick={handleRegister}
            >
              VYZKOUŠET ZDARMA
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}