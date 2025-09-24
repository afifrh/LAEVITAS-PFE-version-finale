import React from 'react';

const Logo = ({ 
  size = 'medium', 
  variant = 'full', 
  className = '',
  animated = false 
}) => {
  // Tailles disponibles
  const sizes = {
    small: { width: 120, height: 40, iconSize: 32, textSize: 'text-lg' },
    medium: { width: 160, height: 50, iconSize: 40, textSize: 'text-xl' },
    large: { width: 200, height: 60, iconSize: 48, textSize: 'text-2xl' },
    xlarge: { width: 240, height: 80, iconSize: 64, textSize: 'text-3xl' }
  };

  const currentSize = sizes[size];

  // Logo icon uniquement
  const LogoIcon = ({ size: iconSize, animated: isAnimated }) => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={isAnimated ? 'animate-pulse' : ''}
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
        <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4facfe" />
          <stop offset="100%" stopColor="#00f2fe" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f093fb" />
          <stop offset="100%" stopColor="#f5576c" />
        </linearGradient>
      </defs>

      {/* Cercle de fond */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="url(#primaryGradient)"
        opacity="0.1"
        stroke="url(#primaryGradient)"
        strokeWidth="2"
      />

      {/* Forme principale - L stylisé */}
      <path
        d="M18 16 L18 48 L42 48 L42 42 L26 42 L26 16 Z"
        fill="url(#primaryGradient)"
        className={isAnimated ? 'animate-pulse' : ''}
      />

      {/* Accent décoratif - représente les données de trading */}
      <path
        d="M30 20 L46 20 L46 26 L36 26 L36 32 L44 32 L44 38 L30 38 Z"
        fill="url(#secondaryGradient)"
        opacity="0.8"
      />

      {/* Points décoratifs - représentent les données */}
      <circle cx="38" cy="23" r="2" fill="url(#accentGradient)" />
      <circle cx="41" cy="29" r="1.5" fill="url(#accentGradient)" />
      <circle cx="35" cy="35" r="1.5" fill="url(#accentGradient)" />

      {/* Ligne de tendance */}
      <path
        d="M20 44 Q28 40 36 42 T52 38"
        stroke="url(#secondaryGradient)"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
        className={isAnimated ? 'animate-pulse' : ''}
      />
    </svg>
  );

  // Logo complet avec texte
  const FullLogo = () => (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={currentSize.iconSize} animated={animated} />
      <div className="flex flex-col">
        <span className={`font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent ${currentSize.textSize}`}>
          Laevitas
        </span>
        <span className="text-xs text-gray-400 font-medium tracking-wider">
          TRADING PLATFORM
        </span>
      </div>
    </div>
  );

  // Logo compact (texte sur une ligne)
  const CompactLogo = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={currentSize.iconSize} animated={animated} />
      <span className={`font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent ${currentSize.textSize}`}>
        Laevitas
      </span>
    </div>
  );

  // Logo texte uniquement
  const TextLogo = () => (
    <div className={`flex flex-col ${className}`}>
      <span className={`font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent ${currentSize.textSize}`}>
        Laevitas
      </span>
      <span className="text-xs text-gray-400 font-medium tracking-wider">
        TRADING PLATFORM
      </span>
    </div>
  );

  // Rendu selon la variante
  switch (variant) {
    case 'icon':
      return <LogoIcon size={currentSize.iconSize} animated={animated} />;
    case 'compact':
      return <CompactLogo />;
    case 'text':
      return <TextLogo />;
    case 'full':
    default:
      return <FullLogo />;
  }
};

// Composant Logo pour la navigation
export const NavLogo = ({ className = '' }) => (
  <Logo 
    size="medium" 
    variant="compact" 
    className={className}
    animated={false}
  />
);

// Composant Logo pour l'authentification
export const AuthLogo = ({ className = '' }) => (
  <Logo 
    size="large" 
    variant="full" 
    className={`text-center ${className}`}
    animated={true}
  />
);

// Composant Logo pour le footer
export const FooterLogo = ({ className = '' }) => (
  <Logo 
    size="small" 
    variant="compact" 
    className={className}
    animated={false}
  />
);

// Composant Logo favicon
export const FaviconLogo = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="faviconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#667eea" />
        <stop offset="100%" stopColor="#764ba2" />
      </linearGradient>
    </defs>
    
    <circle cx="32" cy="32" r="32" fill="url(#faviconGradient)" />
    <path
      d="M18 16 L18 48 L42 48 L42 42 L26 42 L26 16 Z"
      fill="white"
    />
    <path
      d="M30 20 L46 20 L46 26 L36 26 L36 32 L44 32 L44 38 L30 38 Z"
      fill="rgba(255,255,255,0.7)"
    />
  </svg>
);

export default Logo;