import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = '', 
  className = '',
  overlay = false 
}) => {
  // Tailles disponibles
  const sizes = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  // Couleurs disponibles
  const colors = {
    primary: 'border-blue-500',
    secondary: 'border-purple-500',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    danger: 'border-red-500',
    white: 'border-white',
    gray: 'border-gray-500'
  };

  // Tailles de texte correspondantes
  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
    xlarge: 'text-lg'
  };

  const spinnerClasses = `
    ${sizes[size]} 
    border-2 
    ${colors[color]} 
    border-t-transparent 
    rounded-full 
    animate-spin
    ${className}
  `.trim();

  const containerClasses = `
    flex 
    flex-col 
    items-center 
    justify-center 
    gap-3
    ${overlay ? 'fixed inset-0 bg-black bg-opacity-50 z-50' : ''}
  `.trim();

  return (
    <div className={containerClasses}>
      {/* Spinner principal */}
      <div className={spinnerClasses}></div>
      
      {/* Texte de chargement */}
      {text && (
        <p className={`${textSizes[size]} text-gray-300 font-medium animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Composant de spinner avec overlay pour les chargements de page
export const OverlaySpinner = ({ text = 'Chargement...', ...props }) => {
  return (
    <LoadingSpinner 
      overlay={true} 
      size="large" 
      color="white" 
      text={text}
      {...props} 
    />
  );
};

// Composant de spinner pour les boutons
export const ButtonSpinner = ({ text = '', ...props }) => {
  return (
    <LoadingSpinner 
      size="small" 
      color="white" 
      text={text}
      className="mr-2"
      {...props} 
    />
  );
};

// Composant de spinner pour les cartes/sections
export const CardSpinner = ({ text = 'Chargement des données...', ...props }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner 
        size="medium" 
        color="primary" 
        text={text}
        {...props} 
      />
    </div>
  );
};

// Composant de spinner avec animation de points
export const DotSpinner = ({ size = 'medium', color = 'primary', className = '' }) => {
  const dotSizes = {
    small: 'w-1 h-1',
    medium: 'w-2 h-2',
    large: 'w-3 h-3'
  };

  const dotColors = {
    primary: 'bg-blue-500',
    secondary: 'bg-purple-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    white: 'bg-white',
    gray: 'bg-gray-500'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`
            ${dotSizes[size]} 
            ${dotColors[color]} 
            rounded-full 
            animate-bounce
          `}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: '0.6s'
          }}
        ></div>
      ))}
    </div>
  );
};

// Composant de spinner avec barre de progression
export const ProgressSpinner = ({ 
  progress = 0, 
  text = '', 
  size = 'medium',
  className = '' 
}) => {
  const circumference = 2 * Math.PI * 45; // rayon de 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const sizes = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className={`relative ${sizes[size]}`}>
        <svg className="transform -rotate-90 w-full h-full">
          {/* Cercle de fond */}
          <circle
            cx="50%"
            cy="50%"
            r="45"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-700"
          />
          {/* Cercle de progression */}
          <circle
            cx="50%"
            cy="50%"
            r="45"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-blue-500 transition-all duration-300 ease-in-out"
          />
        </svg>
        {/* Pourcentage au centre */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-white">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      
      {text && (
        <p className="text-sm text-gray-300 font-medium">
          {text}
        </p>
      )}
    </div>
  );
};

// Composant de skeleton loader
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '',
  animated = true 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`
            h-4 
            bg-gray-700 
            rounded 
            ${animated ? 'animate-pulse' : ''}
            ${index === lines - 1 ? 'w-3/4' : 'w-full'}
          `}
        ></div>
      ))}
    </div>
  );
};

export default LoadingSpinner;