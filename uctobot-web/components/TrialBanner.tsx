'use client';

export function TrialBanner() {
  const handleStartTrial = () => {
    // Scroll to pricing section or open registration
    document.getElementById('cenik')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#25D366] text-white py-2 text-center">
      <p className="text-sm font-medium">
        🎉 <strong>7 dní zdarma</strong> • Bez platební karty • 
        <span 
          className="underline cursor-pointer ml-1 hover:text-green-100 transition-colors"
          onClick={handleStartTrial}
        >
          Začít hned
        </span>
      </p>
    </div>
  );
}