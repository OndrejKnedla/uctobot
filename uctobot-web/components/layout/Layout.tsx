import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  showMainPageSections?: boolean;
}

export default function Layout({ children, showMainPageSections = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header showMainPageSections={showMainPageSections} />
      <main>
        {children}
      </main>
      <Footer showMainPageSections={showMainPageSections} />
    </div>
  );
}