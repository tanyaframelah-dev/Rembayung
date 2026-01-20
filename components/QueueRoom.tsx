import React, { useEffect, useState, useRef } from 'react';
import { QueueTicket } from '../types';
import { MenuSlider } from './MenuSlider';

interface QueueRoomProps {
  onAdmit: () => void;
  ticket: QueueTicket;
}

export const QueueRoom: React.FC<QueueRoomProps> = ({ onAdmit, ticket }) => {
  const [currentPosition, setCurrentPosition] = useState(ticket.startPosition);
  const [waitMinutes, setWaitMinutes] = useState(0);
  
  // Use a ref to track if we've already triggered admission to prevent double-calls
  const admittedRef = useRef(false);

  useEffect(() => {
    const calculateState = () => {
      const now = Date.now();
      const elapsedSeconds = (now - ticket.startTime) / 1000;
      const processedUsers = elapsedSeconds * ticket.processingRate;
      const newPosition = Math.max(0, Math.floor(ticket.startPosition - processedUsers));
      
      // Calculate remaining time
      const remainingUsers = newPosition;
      const secondsLeft = remainingUsers / ticket.processingRate;
      const minutesLeft = Math.ceil(secondsLeft / 60);

      setCurrentPosition(newPosition);
      setWaitMinutes(minutesLeft);

      if (newPosition <= 0 && !admittedRef.current) {
        admittedRef.current = true;
        // Small buffer to show "You are next" before redirecting
        setTimeout(() => {
            onAdmit();
        }, 1000);
      }
    };

    // Run immediately
    calculateState();

    // Update repeatedly (using AnimationFrame for smoothness or Interval for simplicity)
    const interval = setInterval(calculateState, 1000); // 1-second updates are fine for a queue

    return () => clearInterval(interval);
  }, [ticket, onAdmit]);

  const maxPos = Math.max(ticket.startPosition, 100); 
  const percentage = Math.max(0, 100 - (currentPosition / maxPos) * 100);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Airbnb Simple Header */}
      <header className="border-b border-gray-100 h-20 flex items-center px-8 justify-between">
          <div className="flex items-center gap-2 text-airbnb-red">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
            <span className="font-bold text-xl tracking-tight text-airbnb-red">Rembayung</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-xs text-gray-500 hidden sm:block">ID: {ticket.id}</div>
             <div className="text-sm font-semibold text-gray-800">Ruang Menunggu Maya</div>
          </div>
      </header>

      {/* Centered Queue Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
        
        {/* Left Side: Status */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-16">
            <div className="space-y-4 mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 tracking-tight leading-tight">
                Selamat Datang. <br/> We're saving your spot.
                </h1>
                <p className="text-gray-400 text-lg">
                We are preparing a table for your authentic Malay dining experience.
                Do not refresh; your position is secured.
                </p>
            </div>

            <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-card relative overflow-hidden max-w-lg">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">People ahead of you</span>
                        <div className="text-6xl font-extrabold text-gray-800 mt-2 tabular-nums">{currentPosition.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Est. Wait</span>
                        <div className="text-2xl font-bold text-airbnb-red mt-2 tabular-nums">{waitMinutes} min</div>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden w-full">
                    <div 
                    className="h-full bg-gray-800 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${percentage}%` }}
                    ></div>
                </div>
                
                <div className="flex justify-between items-center mt-6">
                    <div className="flex items-center gap-2">
                         <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                         <span className="text-xs text-gray-500 font-medium">Queue is moving</span>
                    </div>
                    <p className="text-xs text-gray-400">Total traffic: {ticket.totalTraffic.toLocaleString()}</p>
                </div>
            </div>
        </div>

        {/* Right Side: Menu Slider */}
        <div className="w-full md:w-[450px] bg-gray-50 border-l border-gray-100 p-8 flex flex-col justify-center">
             <div className="mb-6 flex justify-between items-end">
                <div>
                    <h3 className="font-serif font-bold text-gray-800 text-2xl">Santapan Warisan</h3>
                    <p className="text-sm text-gray-500 mt-1">A preview of our heritage menu.</p>
                </div>
             </div>
             <MenuSlider />
        </div>

      </div>
    </div>
  );
};