import React from 'react';
import { Gem, Shield, Sparkles, Database, FileImage } from 'lucide-react';

interface NFTPlaceholderProps {
  variant?: 'gallery' | 'detail';
}

const NFTPlaceholder: React.FC<NFTPlaceholderProps> = ({ variant = 'gallery' }) => {
  const isDetail = variant === 'detail';
  
  return (
    <div className={`w-full ${isDetail ? 'aspect-square md:aspect-video max-h-96' : 'h-40'} 
      bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg relative overflow-hidden group`}>
      {/* Animated background effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 transform rotate-45 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute border border-purple-500/20"
              style={{
                height: isDetail ? '100%' : '40px',
                width: isDetail ? '100%' : '40px',
                top: `${i * 15}%`,
                left: `${i * 15}%`,
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Decorative corner elements */}
      <div className="absolute top-3 left-3">
        <Sparkles className={`${isDetail ? 'w-6 h-6' : 'w-4 h-4'} text-purple-400/60`} />
      </div>
      <div className="absolute bottom-3 right-3">
        <Sparkles className={`${isDetail ? 'w-6 h-6' : 'w-4 h-4'} text-blue-400/60`} />
      </div>
      
      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 transition-transform duration-300 group-hover:scale-105">
        {/* Central icon with glow effect */}
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
          <div className={`relative ${isDetail ? 'p-6' : 'p-3'} bg-gray-800/80 rounded-full border border-purple-500/30`}>
            {isDetail ? (
              <FileImage className="w-12 h-12 text-purple-400" />
            ) : (
              <Gem className="w-8 h-8 text-purple-400" />
            )}
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 rounded-full border border-purple-500/30">
            <Shield className={`${isDetail ? 'w-4 h-4' : 'w-3 h-3'} text-blue-400`} />
            <span className={`${isDetail ? 'text-base' : 'text-sm'} text-gray-300`}>Digital Collectible</span>
          </div>
          
          {isDetail && (
            <div className="flex items-center gap-4 text-gray-400/80">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="text-sm">Blockchain Verified</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-500" />
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Asset Protected</span>
              </div>
            </div>
          )}
          
          {!isDetail && (
            <span className="text-xs text-gray-400/80">Secured on Blockchain</span>
          )}
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

export default NFTPlaceholder;