"use client";

import { useState } from 'react';

interface AIGeneratedImageProps {
  slug: string;
  alt: string;
  title: string;
  isHero?: boolean;
}

export default function AIGeneratedImage({ slug, alt, title, isHero = false }: AIGeneratedImageProps) {
  const [imageError, setImageError] = useState(false);
  
  // Generate AI-like placeholder based on article topic
  const getPlaceholderGradient = (slug: string) => {
    if (slug.includes('ucetnictvi')) {
      return 'from-green-400 via-green-500 to-emerald-600';
    } else if (slug.includes('whatsapp')) {
      return 'from-green-400 via-green-600 to-green-800';
    } else if (slug.includes('porovnani')) {
      return 'from-blue-400 via-green-500 to-emerald-600';
    } else if (slug.includes('danove')) {
      return 'from-emerald-400 via-green-500 to-teal-600';
    }
    return 'from-green-400 via-green-500 to-emerald-600';
  };

  const getIcon = (slug: string) => {
    if (slug.includes('ucetnictvi')) {
      return (
        <svg className="w-24 h-24 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (slug.includes('whatsapp')) {
      return (
        <svg className="w-24 h-24 text-white/80" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.69"/>
        </svg>
      );
    } else if (slug.includes('porovnani')) {
      return (
        <svg className="w-24 h-24 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    } else if (slug.includes('danove')) {
      return (
        <svg className="w-24 h-24 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-24 h-24 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const height = isHero ? 'h-64 md:h-80' : 'h-48';
  const borderRadius = isHero ? 'rounded-xl' : 'rounded-t-xl';

  return (
    <div className={`relative ${height} bg-gradient-to-br ${getPlaceholderGradient(slug)} ${borderRadius} overflow-hidden shadow-lg`}>
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-8 h-8 border-2 border-white/30 rounded-full"></div>
        <div className="absolute top-8 right-8 w-6 h-6 border-2 border-white/20 rounded-full"></div>
        <div className="absolute bottom-6 left-8 w-4 h-4 border-2 border-white/25 rounded-full"></div>
        <div className="absolute bottom-12 right-4 w-12 h-12 border-2 border-white/15 rounded-full"></div>
      </div>
      
      {/* Central icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {getIcon(slug)}
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-6 right-6 text-white/40">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      
      <div className="absolute bottom-4 left-4 text-white/40">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      
      {/* Overlay with subtle pattern */}
      <div className="absolute inset-0 bg-black/10"></div>
    </div>
  );
}