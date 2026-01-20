import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { MenuItem } from '../types';

export const MenuSlider: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Fetch items from DB
    const items = db.getMenuItems();
    setMenuItems(items);
  }, []);

  useEffect(() => {
    if (menuItems.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % menuItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [menuItems.length]);

  if (menuItems.length === 0) return null;

  return (
    <div className="flex flex-col h-[500px] w-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl relative group">
      {/* Slides */}
      {menuItems.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image with Zoom Effect */}
          <div className="absolute inset-0 overflow-hidden">
             <img 
                src={item.image} 
                alt={item.title}
                className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${
                    index === currentIndex ? 'scale-110' : 'scale-100'
                }`}
             />
          </div>

          {/* Elegant Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white transform transition-transform duration-700 delay-300">
            <div className="inline-block px-3 py-1 border border-yellow-600/50 text-yellow-500 text-[10px] tracking-[0.2em] uppercase mb-3 font-semibold backdrop-blur-sm">
                Chef's Recommendation
            </div>
            <h2 className="text-3xl font-serif font-bold text-white mb-2 tracking-wide leading-tight">
              {item.title}
            </h2>
            <p className="text-gray-300 font-light text-sm leading-relaxed max-w-sm">
              {item.description}
            </p>
          </div>
        </div>
      ))}

      {/* Progress Indicators */}
      <div className="absolute bottom-6 right-6 z-20 flex gap-2">
        {menuItems.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-8 bg-yellow-500' : 'w-2 bg-gray-600 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
      
      {/* Decorative Border */}
      <div className="absolute inset-4 border border-white/10 pointer-events-none rounded-lg z-20" />
    </div>
  );
};