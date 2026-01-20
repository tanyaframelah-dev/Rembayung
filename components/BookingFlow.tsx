import React, { useState, useMemo, useEffect } from 'react';
import { BookingStep, TimeSlot, PageDetails } from '../types';
import { db } from '../services/db';
import { sendConfirmationEmail } from '../services/emailService';

interface BookingFlowProps {
  onRestart: () => void;
}

const isFriday = (date: Date) => date.getDay() === 5;

// Helper to check if a date is in the past (before today at 00:00:00)
const isPastDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// Helper to check if two dates are same day
const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const generateTimeSlots = (dateStr: string): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = 11;
  const endHour = 21; // Last seating at 9 PM for 11 PM close
  for (let h = startHour; h <= endHour; h++) {
    const isFull = Math.random() > 0.7;
    const available = isFull ? 0 : Math.floor(Math.random() * 50) + 1;
    slots.push({ time: `${h}:00`, availableSeats: available, isClosed: false });
    if (h !== endHour) {
        slots.push({ time: `${h}:30`, availableSeats: isFull ? 0 : 5, isClosed: false });
    }
  }
  return slots;
};

export const BookingFlow: React.FC<BookingFlowProps> = ({ onRestart }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [guests, setGuests] = useState<number>(2);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [pageDetails, setPageDetails] = useState<PageDetails>(db.getPageDetails());
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'IDLE' | 'SENDING' | 'SENT' | 'ERROR'>('IDLE');

  useEffect(() => {
    setGalleryImages(db.getGallery());
    setPageDetails(db.getPageDetails());
  }, []);

  // Generate Calendar Grid
  const calendarDays = useMemo(() => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
      
      const days = [];
      // Padding slots
      for(let i=0; i<startDayOfWeek; i++) {
          days.push(null);
      }
      // Actual dates
      for(let i=1; i<=daysInMonth; i++) {
          days.push(new Date(year, month, i));
      }
      return days;
  }, [currentMonth]);
  
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    return generateTimeSlots(selectedDate.toISOString());
  }, [selectedDate]);

  const handleDateSelect = (date: Date) => {
    if (isFriday(date) || isPastDate(date)) return;
    setSelectedDate(date);
    setSelectedSlot(null); // Reset time when date changes
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatFullDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) return;
    setIsSubmitting(true);
    setEmailStatus('IDLE');
    
    // Simulate processing time
    setTimeout(async () => {
      try {
        // 1. Save to Mock Database
        const newBooking = db.createBooking({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            date: selectedDate.toISOString(),
            time: selectedSlot,
            guests: guests,
        });

        setBookingId(newBooking.id);
        setShowConfirmation(true);
        setIsSubmitting(false);
        
        // 2. Automate Email Sending (Client-side Mailto)
        setEmailStatus('SENDING');
        
        await sendConfirmationEmail({
            ...newBooking,
            formattedDate: formatFullDate(selectedDate)
        });
        
        setEmailStatus('SENT');

      } catch (error) {
        console.error("Booking error:", error);
        setEmailStatus('ERROR');
        alert("There was an issue processing your reservation.");
        setIsSubmitting(false);
      }
    }, 1500);
  };

  const handleResendEmail = async () => {
    if (!bookingId || !selectedDate || !selectedSlot) return;
    
    setEmailStatus('SENDING');
    await sendConfirmationEmail({
        id: bookingId,
        name: formData.name,
        email: formData.email,
        guests: guests,
        time: selectedSlot,
        date: selectedDate.toISOString(),
        formattedDate: formatFullDate(selectedDate)
    });
    setEmailStatus('SENT');
  };

  const handlePrint = () => {
    window.print();
  };

  // Fallback if images not loaded yet (Updated to Malay Cuisine Defaults)
  const img1 = galleryImages[0] || "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?q=80&w=1200";
  const img2 = galleryImages[1] || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600";
  const img3 = galleryImages[2] || "https://images.unsplash.com/photo-1626509689874-846a6eb27303?q=80&w=600";
  const img4 = galleryImages[3] || "https://images.unsplash.com/photo-1604423043492-41303788de80?q=80&w=600";
  const img5 = galleryImages[4] || "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=600";

  // Reusable Booking Widget Component
  const BookingWidget = () => (
    <div className="sticky top-28 bg-white rounded-2xl shadow-floating border border-gray-200 p-6 z-20">
        <div className="flex justify-between items-end mb-6">
            <div>
                <span className="text-2xl font-bold text-gray-800">RM {pageDetails.price}</span>
                <span className="text-gray-500 text-sm"> / person</span>
            </div>
            {/* Review section removed as requested */}
        </div>

        <form onSubmit={handleSubmit}>
            {/* Unified Input Box */}
            <div className="border border-gray-300 rounded-xl overflow-hidden mb-4 divide-y divide-gray-300">
                <div className="flex divide-x divide-gray-300">
                    <div className="flex-1 p-3">
                        <label className="block text-[10px] font-extrabold text-gray-800 uppercase">Date</label>
                        <div className="text-sm text-gray-600 truncate mt-1">
                            {selectedDate ? formatDate(selectedDate) : 'Select date'}
                        </div>
                    </div>
                    <div className="flex-1 p-3">
                        <label className="block text-[10px] font-extrabold text-gray-800 uppercase">Time</label>
                        <select 
                            className="w-full text-sm text-gray-600 bg-transparent focus:outline-none -ml-1 mt-1 cursor-pointer"
                            value={selectedSlot || ''}
                            onChange={(e) => setSelectedSlot(e.target.value)}
                            disabled={!selectedDate}
                        >
                            <option value="" disabled>Select time</option>
                            {availableSlots.map((slot, idx) => (
                                <option key={idx} value={slot.time} disabled={slot.availableSeats === 0}>
                                    {slot.time} {slot.availableSeats === 0 ? '(Full)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="p-3">
                    <label className="block text-[10px] font-extrabold text-gray-800 uppercase">Guests</label>
                    <select 
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="w-full text-sm text-gray-600 bg-transparent focus:outline-none -ml-1 mt-1 cursor-pointer"
                    >
                        {[2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} guests</option>)}
                    </select>
                </div>
            </div>

            {/* Guest Details Collapsible */}
             {selectedDate && selectedSlot && (
                <div className="space-y-3 mb-4 animate-fade-in">
                    <input 
                        required placeholder="Full Name" 
                        name="fullName"
                        autoComplete="name"
                        className="w-full p-4 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:border-gray-800 transition-all shadow-sm"
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                     <input 
                        required placeholder="Email" type="email"
                        name="email"
                        autoComplete="email"
                        className="w-full p-4 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:border-gray-800 transition-all shadow-sm"
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                     <input 
                        required placeholder="Phone Number" type="tel"
                        name="phone"
                        autoComplete="tel"
                        className="w-full p-4 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-800 focus:border-gray-800 transition-all shadow-sm"
                        value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
            )}

            <button 
                type="submit"
                disabled={!selectedDate || !selectedSlot || isSubmitting}
                className="w-full bg-airbnb-red text-black font-bold py-3.5 rounded-xl text-lg hover:bg-airbnb-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
                {isSubmitting ? 'Tempah Sekarang' : 'Reserve Table'}
            </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">You won't be charged yet</p>
    </div>
  );

  // Confirmation View
  if (showConfirmation) {
    return (
        <div className="max-w-2xl mx-auto py-16 px-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-4">Tempahan Berjaya!</h2>
            
            {/* Automatic Email Status Indicator */}
            <div className={`
                px-5 py-3 rounded-full inline-flex items-center gap-3 mb-8 text-sm font-semibold transition-all border
                ${emailStatus === 'SENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                ${emailStatus === 'SENT' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                ${emailStatus === 'ERROR' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                ${emailStatus === 'IDLE' ? 'opacity-0' : 'opacity-100'}
            `}>
                {emailStatus === 'SENDING' && (
                    <>
                        <svg className="animate-spin h-4 w-4 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Opening email client...
                    </>
                )}
                {emailStatus === 'SENT' && (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Email draft created
                    </>
                )}
                 {emailStatus === 'ERROR' && (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Failed to open email.
                    </>
                )}
            </div>

            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Booking Reference: <span className="font-mono font-bold text-gray-800">#{bookingId}</span>
                <br />
                Your table has been reserved. Please check your email draft to send the confirmation.
            </p>
            
            <div className="bg-white rounded-2xl p-6 text-left border border-gray-200 max-w-md mx-auto mb-8 shadow-card">
                <div className="flex gap-4 mb-4 border-b border-gray-100 pb-4">
                     <img src={img1} className="w-16 h-16 rounded-lg object-cover" />
                     <div>
                         <h4 className="font-bold text-gray-800">Rembayung</h4>
                         <p className="text-sm text-gray-500">Fine Malay Dining • 2 hours</p>
                     </div>
                </div>
                <div className="space-y-3">
                     <div className="flex justify-between text-sm"><span className="text-gray-500">Guest Name</span> <span className="font-semibold text-gray-800">{formData.name}</span></div>
                     <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span> <span className="font-semibold text-gray-800">{selectedDate && formatFullDate(selectedDate)}</span></div>
                     <div className="flex justify-between text-sm"><span className="text-gray-500">Time</span> <span className="font-semibold text-gray-800">{selectedSlot}</span></div>
                     <div className="flex justify-between text-sm"><span className="text-gray-500">Guests</span> <span className="font-semibold text-gray-800">{guests} guests</span></div>
                     <div className="flex justify-between text-sm"><span className="text-gray-500">Address</span> <span className="font-semibold text-gray-800 text-right">145, Jln Tun Razak<br/>Kuala Lumpur</span></div>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={handleResendEmail} className="px-6 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-full hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Resend Email
                </button>
                <button onClick={handlePrint} className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-full hover:bg-gray-200 transition-colors">
                    Print Receipt
                </button>
                <button onClick={onRestart} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-full hover:bg-black transition-colors shadow-lg">
                    Make another reservation
                </button>
            </div>
        </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 animate-fade-in">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{pageDetails.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-800 font-medium underline">
             <span>{pageDetails.location}</span>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 h-[250px] md:h-[400px] rounded-2xl overflow-hidden mb-12">
          {/* Main Large Image */}
          <div className="md:col-span-2 md:row-span-2 relative group cursor-pointer h-full">
              <img src={img1} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Main dining area" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>
          
          {/* Top Right 1 */}
          <div className="relative group cursor-pointer hidden md:block">
              <img src={img2} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Ambience" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>
          
          {/* Top Right 2 */}
          <div className="relative group cursor-pointer hidden md:block">
              <img src={img3} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Detail" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>
          
          {/* Bottom Right 1 */}
          <div className="relative group cursor-pointer hidden md:block">
              <img src={img4} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Food" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>
          
          {/* Bottom Right 2 */}
          <div className="relative group cursor-pointer hidden md:block">
              <img src={img5} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Food detail" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              <button className="absolute bottom-4 right-4 bg-white border border-black text-xs font-bold px-3 py-1 rounded-md shadow-sm hover:scale-105 transition-transform">Show all photos</button>
          </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative mt-8">
        
        {/* Left Info Column */}
        <div className="lg:col-span-2 space-y-8">

            {/* Calendar Section (Moved to Top) */}
             <div className="border-b border-gray-200 pb-8">
                 <h2 className="text-2xl font-bold text-gray-800 mb-6">Select a date</h2>
                 {/* Custom Interactive Calendar */}
                 <div className="bg-gray-50 p-6 rounded-2xl w-full">
                    {/* Calendar Header */}
                    <div className="flex justify-between items-center mb-6">
                        <button 
                            onClick={() => changeMonth(-1)}
                            disabled={currentMonth <= new Date(new Date().setDate(1))} // Disable if trying to go before current month
                            className="p-2 hover:bg-gray-200 rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h3 className="font-bold text-gray-800">{monthLabel}</h3>
                        <button 
                            onClick={() => changeMonth(1)}
                            className="p-2 hover:bg-gray-200 rounded-full"
                        >
                            <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-2">{d}</div>
                        ))}
                        {calendarDays.map((date, idx) => {
                            if (!date) return <div key={`empty-${idx}`} />;
                            
                            const closed = isFriday(date);
                            const past = isPastDate(date);
                            const isSelected = selectedDate && isSameDay(date, selectedDate);
                            const isDisabled = closed || past;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => !isDisabled && handleDateSelect(date)}
                                    disabled={isDisabled}
                                    className={`
                                        aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all relative
                                        ${isSelected 
                                            ? 'bg-black text-white shadow-md' 
                                            : isDisabled 
                                                ? 'text-gray-300 decoration-gray-300 cursor-not-allowed'
                                                : 'text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 hover:text-black bg-transparent'
                                        }
                                        ${closed && !past ? 'line-through decoration-1' : ''}
                                    `}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                 </div>
            </div>

            {/* Mobile-Only Sticky Booking Widget */}
            <div className="block lg:hidden">
               <BookingWidget />
            </div>

            <div className="flex justify-between items-center border-b border-gray-200 pb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Hosted by {pageDetails.hostName}</h2>
                    <p className="text-gray-500">{pageDetails.hostStats}</p>
                </div>
                <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center text-white font-serif text-xl">
                    {pageDetails.hostName.charAt(0) || 'R'}
                </div>
            </div>

            <div className="border-b border-gray-200 pb-8 space-y-6">
                <div className="flex gap-4">
                    <svg className="w-6 h-6 text-gray-800 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <div>
                        <h3 className="font-bold text-gray-800">{pageDetails.facility1Title}</h3>
                        <p className="text-gray-400 text-sm">{pageDetails.facility1Text}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <svg className="w-6 h-6 text-gray-800 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                        <h3 className="font-bold text-gray-800">{pageDetails.facility2Title}</h3>
                        <p className="text-gray-400 text-sm">{pageDetails.facility2Text}</p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{pageDetails.aboutTitle}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                    {pageDetails.aboutText1}
                </p>
                <p className="text-gray-600 leading-relaxed">
                    {pageDetails.aboutText2}
                </p>
            </div>
        </div>

        {/* Right Sticky Column - Desktop Only */}
        <div className="hidden lg:block relative">
             <BookingWidget />
        </div>

      </div>
    </div>
  );
};