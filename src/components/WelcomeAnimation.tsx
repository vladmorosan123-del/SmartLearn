import { useEffect, useRef, useState } from 'react';
import { Shield, Star } from 'lucide-react';

interface WelcomeAnimationProps {
  onComplete: () => void;
}

const WelcomeAnimation = ({ onComplete }: WelcomeAnimationProps) => {
  const [phase, setPhase] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 2800),
    ];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      onComplete();
    };

    const focusTimer = window.setTimeout(() => {
      containerRef.current?.focus();
    }, 0);

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      timers.forEach(clearTimeout);
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-gradient-hero flex items-center justify-center z-50 overflow-hidden cursor-pointer"
      onClick={onComplete}
      onKeyDown={() => onComplete()}
      tabIndex={0}
      role="button"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      {/* Corner decorations */}
      <div className={`absolute top-8 left-8 transition-all duration-1000 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <Star className="w-6 h-6 text-gold animate-float" />
      </div>
      <div className={`absolute top-8 right-8 transition-all duration-1000 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <Star className="w-6 h-6 text-gold animate-float delay-200" />
      </div>
      <div className={`absolute bottom-8 left-8 transition-all duration-1000 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <Star className="w-6 h-6 text-gold animate-float delay-300" />
      </div>
      <div className={`absolute bottom-8 right-8 transition-all duration-1000 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <Star className="w-6 h-6 text-gold animate-float delay-400" />
      </div>

      <div className="text-center relative z-10">
        {/* Shield emblem */}
        <div className={`mb-8 transition-all duration-1000 ${phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="relative inline-block">
            <Shield className="w-24 h-24 text-gold animate-glow" strokeWidth={1.5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-gold font-display text-base font-bold">CNMSM</span>
            </div>
          </div>
        </div>

        {/* Welcome text */}
        <h1 className={`font-display text-5xl md:text-7xl text-primary-foreground mb-4 transition-all duration-1000 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          Bine ați venit!
        </h1>

        {/* School name */}
        <div className={`transition-all duration-1000 ${phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-gold text-xl md:text-2xl font-bold tracking-[0.2em] uppercase mb-2">
            Colegiul Național Militar
          </p>
          <h2 className="font-display text-3xl md:text-5xl text-gradient-gold">
            „Ștefan cel Mare"
          </h2>
        </div>

        {/* Motto */}
        <p className={`mt-6 text-primary-foreground/70 text-lg italic transition-all duration-1000 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          Excelență în educație și disciplină
        </p>

        {/* Gold separator line */}
        <div className={`flex justify-center mt-8 transition-all duration-1000 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        </div>

        {/* Project info */}
        <div className={`mt-6 transition-all duration-1000 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-gold text-base md:text-lg font-bold tracking-[0.15em]">SMART LEARNING</p>
          <p className="text-primary-foreground/60 text-sm md:text-base mt-1">Integrarea A.I. în învățare</p>
        </div>

        {/* Gold separator line */}
        <div className={`flex justify-center mt-6 transition-all duration-1000 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        </div>

        {/* Team & Coordinator */}
        <div className={`mt-6 transition-all duration-1000 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-primary-foreground/60 text-sm">
            Echipa de proiect: <span className="text-gold">Ștefan Moroșan • Ștefan Turculeț</span>
          </p>
          <p className="text-primary-foreground/60 text-sm mt-1">
            Coordonator: <span className="text-gold">prof. Anca Tudose</span>
          </p>
        </div>

        {/* Continue hint */}
        <div className={`mt-10 transition-all duration-500 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-primary-foreground/50 text-sm animate-pulse">
            Click sau apasă orice tastă pentru a continua
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeAnimation;
