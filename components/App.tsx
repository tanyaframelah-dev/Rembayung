import React, { useState, useEffect, useRef } from 'react';
import { QueueRoom } from './components/QueueRoom';
import { BookingFlow } from './components/BookingFlow';
import { AdminPanel } from './components/AdminPanel';
import { QueueTicket } from './types';

// Constants for simulation
const SESSION_KEY = 'rembayung_session_v1';
const QUEUE_KEY = 'rembayung_queue_v1';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours in ms

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [admitted, setAdmitted] = useState(false);
  const [ticket, setTicket] = useState<QueueTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref for the booking section to scroll to
  const bookingRef = useRef<HTMLDivElement>(null);

  // 1. Handle Routing (Admin Check) - Runs once on mount
  useEffect(() => {
    const checkRoute = () => {
      const isHashAdmin = window.location.hash === '#admin';
      setIsAdmin(isHashAdmin);
    };

    // Initial check
    checkRoute();

    // Listen for hash changes
    window.addEventListener('hashchange', checkRoute);
    return () => window.removeEventListener('hashchange', checkRoute);
  }, []);

  // 2. Handle Session Initialization - Runs when admin status changes or on mount
  useEffect(() => {
    if (isAdmin) {
        setIsLoading(false);
        return;
    }
    initializeAccess();
  }, [isAdmin]);

  const initializeAccess = () => {
    const now = Date.now();

    // 1. Check for valid active session
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession && parsedSession.expiry) {
            if (now < parsedSession.expiry) {
                setAdmitted(true);
                setIsLoading(false);
                return;
            } else {
                localStorage.removeItem(SESSION_KEY); // Expired
            }
        }
      } catch (e) {
        localStorage.removeItem(SESSION_KEY); // Invalid data
      }
    }

    // 2. Check for existing queue ticket
    const storedTicket = localStorage.getItem(QUEUE_KEY);
    if (storedTicket) {
      try {
          const parsedTicket = JSON.parse(storedTicket);
          if (parsedTicket && parsedTicket.id) {
              setTicket(parsedTicket);
              setAdmitted(false);
              setIsLoading(false);
              return;
          }
      } catch (e) {
          localStorage.removeItem(QUEUE_KEY);
      }
    }

    // 3. New User: Calculate Traffic based on Time of Day
    const hour = new Date().getHours();
    let trafficBase = 0;
    
    if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21)) {
        trafficBase = Math.floor(Math.random() * 15000) + 35000; 
    } else {
        trafficBase = Math.floor(Math.random() * 5000) + 2000;
    }

    const calculatedRate = Math.floor(Math.random() * 50) + 100;

    const newTicket: QueueTicket = {
      id: Math.random().toString(36).substring(7),
      startTime: now,
      startPosition: trafficBase,
      totalTraffic: trafficBase,
      processingRate: calculatedRate
    };

    localStorage.setItem(QUEUE_KEY, JSON.stringify(newTicket));
    setTicket(newTicket);
    setAdmitted(false);
    setIsLoading(false);
  };

  const handleAdmit = () => {
    const session = {
      expiry: Date.now() + SESSION_DURATION
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.removeItem(QUEUE_KEY);
    setAdmitted(true);
  };

  const handleRestart = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(QUEUE_KEY);
    setAdmitted(false);
    setTicket(null);
    setIsLoading(true);
    // Reset URL hash if needed, though usually staying on same page
    if (window.location.hash === '#admin') {
        window.location.hash = '';
    }
    initializeAccess();
  };

  const handleScrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAdminClick = (e: React.MouseEvent) => {
      // Force admin state if hash change listener is slow
      window.location.hash = '#admin';
      setIsAdmin(true);
  };

  if (isAdmin) {
      return <AdminPanel />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6">
         <div className="text-airbnb-red animate-pulse">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
         </div>
         <p className="text-gray-400 font-sans text-sm tracking-wider uppercase">Checking Availability...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-airbnb-light selection:text-airbnb-dark">
      {!admitted && ticket ? (
        <QueueRoom 
            ticket={ticket}
            onAdmit={handleAdmit} 
        />
      ) : (
        <div className="min-h-screen flex flex-col animate-fade-in">
          {/* Airbnb Header */}
          <header className="border-b border-gray-100 bg-white sticky top-0 z-50 h-20 shadow-sm transition-shadow">
            <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
              {/* Logo */}
              <div className="flex items-center gap-1 text-airbnb-red flex-1 cursor-pointer" onClick={handleRestart}>
                 <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                 <span className="font-bold text-xl tracking-tight hidden md:block text-airbnb-red">Rembayung</span>
              </div>

              {/* Right Side Actions */}
              <div className="flex-1 flex justify-end items-center gap-4">
                 <button 
                    onClick={handleScrollToBooking}
                    className="bg-airbnb-red hover:bg-airbnb-dark text-black px-5 py-2.5 rounded-full font-bold text-sm transition-all transform active:scale-95 shadow-md hidden sm:block"
                 >
                    Reserve
                 </button>
                 <button onClick={handleRestart} className="text-xs text-gray-400 hover:text-gray-600 underline">Reset Session</button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
             <div ref={bookingRef}>
                <BookingFlow onRestart={handleRestart} />
             </div>
          </main>

          {/* Footer */}
          <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-800">
               <div>
                  <h5 className="font-bold mb-4">Support</h5>
                  <ul className="space-y-3 font-light">
                      <li>Help Center</li>
                      <li>Cancellation options</li>
                      <li>Dietary Requirements</li>
                      <li>Accessibility</li>
                  </ul>
               </div>
               <div>
                  <h5 className="font-bold mb-4">Location</h5>
                  <ul className="space-y-3 font-light">
                      <li>145, Jalan Tun Razak</li>
                      <li>50400 Kuala Lumpur</li>
                      <li>Institut Jantung Negara</li>
                  </ul>
               </div>
                <div>
                  <h5 className="font-bold mb-4">Rembayung</h5>
                  <ul className="space-y-3 font-light">
                      <li>About the Chef</li>
                      <li>Careers</li>
                      <li>Press</li>
                      <li>Gift Cards</li>
                  </ul>
               </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                <div className="flex gap-2">
                    <span>&copy; {new Date().getFullYear()} Rembayung Inc.</span>
                    <span>·</span>
                    <span className="hover:underline cursor-pointer">Privacy</span>
                    <span>·</span>
                    <span className="hover:underline cursor-pointer">Terms</span>
                </div>
                <div className="flex gap-6 mt-4 md:mt-0 font-bold text-gray-800 items-center">
                    <div className="flex items-center gap-4">
                        <span className="cursor-pointer hover:underline">English (US)</span>
                        <span className="cursor-pointer hover:underline">$ USD</span>
                    </div>
                    
                    {/* Admin Login Link */}
                    <a href="#admin" onClick={handleAdminClick} className="flex items-center gap-2 pl-6 border-l border-gray-300 text-xs text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-wider font-extrabold group cursor-pointer">
                        <svg className="w-3 h-3 group-hover:text-airbnb-red transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Staff Login
                    </a>
                </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;