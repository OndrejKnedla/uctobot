"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

interface FooterProps {
  showMainPageSections?: boolean;
}

export default function Footer({ showMainPageSections = false }: FooterProps) {
  const router = useRouter();

  const scrollToSection = (id: string) => {
    if (showMainPageSections) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/#${id}`);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <footer className="bg-background border-t py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <MessageCircle className="h-6 w-6 text-[#25D366]" />
              <span className="text-lg font-bold">DokladBot</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Moderní řešení účetnictví pro OSVČ přímo ve WhatsAppu. Jednoduše, rychle, spolehlivě.
            </p>
            <div className="flex space-x-4">
              <button 
                onClick={() => window.open('https://linkedin.com/company/dokladbot', '_blank')} 
                className="text-muted-foreground hover:text-[#25D366]"
              >
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                onClick={() => window.open('https://facebook.com/dokladbot', '_blank')} 
                className="text-muted-foreground hover:text-[#25D366]"
              >
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                onClick={() => window.open('https://youtube.com/@dokladbot', '_blank')} 
                className="text-muted-foreground hover:text-[#25D366]"
              >
                <span className="sr-only">YouTube</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Produkt</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button 
                  onClick={() => scrollToSection("cenik")} 
                  className="hover:text-foreground text-left"
                >
                  Ceník
                </button>
              </li>
              <li>
                <Link 
                  href="/jak-to-funguje"
                  className="hover:text-foreground text-left block"
                >
                  Jak to funguje
                </Link>
              </li>
              <li>
                <Link 
                  href="/#testimonials"
                  className="hover:text-foreground text-left block"
                >
                  Recenze
                </Link>
              </li>
              <li>
                <Link 
                  href="/funkce"
                  className="hover:text-foreground text-left block"
                >
                  Funkcionalita
                </Link>
              </li>
              <li>
                <Link 
                  href="/blog"
                  className="hover:text-foreground text-left block"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Podpora</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link 
                  href="/napoveda"
                  className="hover:text-foreground text-left block"
                >
                  Nápověda
                </Link>
              </li>
              <li>
                <Link 
                  href="/navody"
                  className="hover:text-foreground text-left block"
                >
                  Návody
                </Link>
              </li>
              <li>
                <Link 
                  href="/spravovat-predplatne"
                  className="hover:text-foreground text-left block"
                >
                  Spravovat předplatné
                </Link>
              </li>
              <li>
                <a href="mailto:api@dokladbot.cz" className="hover:text-foreground">
                  API (v přípravě)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Společnost</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link 
                  href="/o-nas"
                  className="hover:text-foreground text-left block"
                >
                  O nás
                </Link>
              </li>
              <li>
                <Link 
                  href="/kariera"
                  className="hover:text-foreground text-left block"
                >
                  Kariéra
                </Link>
              </li>
              <li>
                <Link 
                  href="/partneri"
                  className="hover:text-foreground text-left block"
                >
                  Partneři
                </Link>
              </li>
              <li>
                <Link 
                  href="/kontakt"
                  className="hover:text-foreground text-left block"
                >
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <Link href="/obchodni-podminky" className="hover:text-foreground">
                  Obchodní podmínky
                </Link>
                <Link href="/ochrana-osobnich-udaju" className="hover:text-foreground">
                  Ochrana osobních údajů
                </Link>
                <Link href="/gdpr" className="hover:text-foreground">
                  GDPR
                </Link>
                <Link href="/cookies" className="hover:text-foreground">
                  Cookies
                </Link>
                <Link href="/reklamace" className="hover:text-foreground">
                  Reklamace
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                &copy; 2025 DokladBot • IČO: 22161104 • Všechna práva vyhrazena.
              </p>
            </div>
            
            <div className="text-right">
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Kontakt</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>📧 info@dokladbot.cz</div>
                  <div>📞 +420 722 158 002</div>
                  <div>🕐 Po-Pá 9:00-17:00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}