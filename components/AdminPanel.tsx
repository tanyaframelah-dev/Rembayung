import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../services/db';
import { Booking, BookingStatus, MenuItem, PageDetails, SMTPConfig } from '../types';

// --- Configuration ---
const TABLES = [
    { id: 'T-01', capacity: 2, label: '01' },
    { id: 'T-02', capacity: 2, label: '02' },
    { id: 'T-03', capacity: 4, label: '03' },
    { id: 'T-04', capacity: 4, label: '04' },
    { id: 'T-05', capacity: 6, label: '05' },
    { id: 'T-06', capacity: 6, label: '06' },
    { id: 'T-07', capacity: 2, label: '07' },
    { id: 'T-08', capacity: 2, label: '08' },
    { id: 'T-09', capacity: 8, label: 'VIP' },
];

// --- Extracted GallerySlot Component ---
interface GallerySlotProps {
    image: string;
    label: string;
    className?: string;
    onUpdate: (val: string) => void;
}

const GallerySlot: React.FC<GallerySlotProps> = ({ image, label, className = "", onUpdate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Determine if the current image is a Base64 data URL
    const isDataUrl = image?.startsWith('data:');
    // Only show the text in the input if it's a regular URL, not a massive data string
    const inputValue = isDataUrl ? '' : image;

    const handleFileRead = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert("Please upload an image file.");
            return;
        }
        // Increased limit to 4MB to accommodate modern phone photos
        if (file.size > 4 * 1024 * 1024) {
             alert("File is too large! Please use an image under 4MB.");
             return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                onUpdate(e.target.result as string);
            }
        };
        reader.onerror = () => {
            alert("Failed to read file.");
        };
        reader.readAsDataURL(file);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileRead(e.dataTransfer.files[0]);
        }
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileRead(e.target.files[0]);
        }
        // Reset input value to allow re-selecting the same file if needed
        e.target.value = '';
    };

    return (
        <div 
            className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${className} ${
                isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : image 
                    ? 'border-transparent shadow-sm' 
                    : 'border-dashed border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            {image ? (
                <>
                    <img src={image} className="w-full h-full object-cover" alt={label} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                        <span className="text-white text-xs font-bold uppercase tracking-wider drop-shadow-md">Change Photo</span>
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
                </div>
            )}

            <div 
                className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent transition-transform duration-300 ${
                    image ? 'translate-y-full group-hover:translate-y-0' : 'translate-y-0'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-white rounded-md flex items-center overflow-hidden shadow-sm h-8 px-2">
                     <input 
                        type="text" 
                        className="flex-1 text-[10px] text-gray-800 h-full border-none focus:outline-none bg-transparent w-full min-w-0"
                        placeholder={isDataUrl ? "Image uploaded" : "Paste image link..."}
                        value={inputValue}
                        onChange={(e) => onUpdate(e.target.value)}
                    />
                     {isDataUrl && (
                        <span className="text-[9px] font-bold text-green-600 uppercase tracking-wider ml-2 whitespace-nowrap">
                            Uploaded
                        </span>
                     )}
                </div>
            </div>

            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={onFileSelect}
            />
        </div>
    );
};
// --------------------------------------------------------

export const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'BOOKINGS' | 'GALLERY' | 'MENU' | 'DETAILS' | 'SETTINGS'>('BOOKINGS');

  // Booking UI State
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  
  // Edit Booking State
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Booking>>({});

  // Gallery Data
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isGallerySaved, setIsGallerySaved] = useState(false);

  // Menu Data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMenuSaved, setIsMenuSaved] = useState(false);

  // Page Details Data
  const [pageDetails, setPageDetails] = useState<PageDetails>(db.getPageDetails());
  const [isDetailsSaved, setIsDetailsSaved] = useState(false);

  // SMTP Settings Data
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>(db.getSMTPConfig());
  const [isSmtpSaved, setIsSmtpSaved] = useState(false);

  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_auth');
    if (isAuth) {
      setIsAuthenticated(true);
      setTimeout(loadData, 0);
    }
    
    // Auto-refresh when localStorage changes (from client side updates)
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    // Also use an interval to poll for changes just in case, since 'storage' event works across tabs but sometimes flaky locally
    const interval = setInterval(loadData, 5000);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
    };
  }, []);

  const loadData = () => {
    const data = db.getBookings();
    data.sort((a, b) => b.createdAt - a.createdAt);
    setBookings(data);
    
    setGalleryImages(db.getGallery() || ["","","","",""]);
    setMenuItems(db.getMenuItems());
    setPageDetails(db.getPageDetails());
    setSmtpConfig(db.getSMTPConfig());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (db.login(username.trim(), password.trim())) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      loadData();
    } else {
      alert('Invalid Credentials. Try admin / rembayung123');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    window.location.hash = ''; 
  };

  const handleStatusChange = (id: string, status: BookingStatus) => {
    db.updateBooking(id, { status });
    loadData();
  };

  const handleTableAssign = (tableId: string) => {
      if (assigningBookingId) {
          db.updateBooking(assigningBookingId, { tableId, status: 'CONFIRMED' });
          setAssigningBookingId(null);
          loadData();
      }
  };

  // Edit Handlers
  const handleStartEdit = (booking: Booking, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingBookingId(booking.id);
      setEditForm({ ...booking });
      setAssigningBookingId(null); // Cancel assignment mode if active
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingBookingId(null);
      setEditForm({});
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editingBookingId && editForm) {
          db.updateBooking(editingBookingId, editForm);
          setEditingBookingId(null);
          setEditForm({});
          loadData();
      }
  };

  const handleEditFormChange = (field: keyof Booking, value: string | number) => {
      setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Gallery Logic
  const handleGalleryChange = (index: number, val: string) => {
    setGalleryImages(prev => {
        const newImages = [...prev];
        // Ensure array size
        while (newImages.length <= index) {
            newImages.push("");
        }
        newImages[index] = val;
        return newImages;
    });
    setIsGallerySaved(false);
  };

  const saveGallery = () => {
    db.saveGallery(galleryImages);
    setIsGallerySaved(true);
    setTimeout(() => setIsGallerySaved(false), 3000);
  };

  // Menu Logic
  const handleMenuChange = (index: number, field: keyof MenuItem, val: string) => {
    const newItems = [...menuItems];
    newItems[index] = { ...newItems[index], [field]: val };
    setMenuItems(newItems);
    setIsMenuSaved(false);
  };

  const saveMenu = () => {
      db.saveMenuItems(menuItems);
      setIsMenuSaved(true);
      setTimeout(() => setIsMenuSaved(false), 3000);
  }

  // Page Details Logic
  const handleDetailChange = (field: keyof PageDetails, val: string | number) => {
      setPageDetails(prev => ({ ...prev, [field]: val }));
      setIsDetailsSaved(false);
  };

  const savePageDetails = () => {
      db.savePageDetails(pageDetails);
      setIsDetailsSaved(true);
      setTimeout(() => setIsDetailsSaved(false), 3000);
  }

  // SMTP Logic
  const handleSmtpChange = (field: keyof SMTPConfig, val: string | boolean) => {
      setSmtpConfig(prev => ({ ...prev, [field]: val }));
      setIsSmtpSaved(false);
  };

  const saveSmtp = () => {
      db.saveSMTPConfig(smtpConfig);
      setIsSmtpSaved(true);
      setTimeout(() => setIsSmtpSaved(false), 3000);
  };

  // Helper to safely format date for input (YYYY-MM-DD) handling local time
  const formatDateForInput = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to parse input date back to ISO start of day
  const parseInputDate = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      // Reset to start of day in local time, then to ISO
      return date.toISOString();
  }

  const filteredBookings = useMemo(() => {
    let result = bookings;
    
    // 1. Filter by Status
    if (filter !== 'ALL') {
        result = result.filter(b => b.status === filter);
    }

    // 2. Filter by Search Term
    if (searchTerm.trim()) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(b => 
            b.name.toLowerCase().includes(lowerTerm) || 
            b.email.toLowerCase().includes(lowerTerm) ||
            b.id.toLowerCase().includes(lowerTerm)
        );
    }
    
    return result;
  }, [bookings, filter, searchTerm]);

  const activeTableMap = useMemo(() => {
      const map: Record<string, Booking> = {};
      bookings.forEach(b => {
          // Only show 'Active' bookings on the table map to prevent clutter from history
          if (b.tableId && ['CONFIRMED', 'SEATED'].includes(b.status)) {
              map[b.tableId] = b;
          }
      });
      return map;
  }, [bookings]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-floating w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Rembayung Admin</h1>
            <p className="text-sm text-gray-500">Authorized personnel only</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Username</label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Password</label>
              <input 
                type="password" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-colors">
              Login
            </button>
            <div className="text-center mt-4">
               <a href="#" className="text-xs text-blue-600 hover:underline">Return to Customer View</a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gray-900 text-white w-8 h-8 flex items-center justify-center rounded font-serif font-bold">R</div>
              <h1 className="text-lg font-bold text-gray-800">Rembayung <span className="text-gray-400 font-normal">Manager</span></h1>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={loadData} className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors" title="Refresh Data">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                <button onClick={handleLogout} className="text-sm text-red-600 font-semibold hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Secondary Tab Bar */}
      <div className="bg-white border-b border-gray-200 z-20">
         <div className="max-w-7xl mx-auto px-4 sm:px-6">
             <div className="flex gap-8 overflow-x-auto no-scrollbar">
                 <button 
                    onClick={() => setActiveTab('BOOKINGS')}
                    className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'BOOKINGS' 
                        ? 'border-gray-900 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                 >
                    Bookings & Floor Plan
                 </button>
                 <button 
                    onClick={() => setActiveTab('DETAILS')}
                    className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'DETAILS' 
                        ? 'border-gray-900 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                 >
                    Page Details
                 </button>
                 <button 
                    onClick={() => setActiveTab('GALLERY')}
                    className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'GALLERY' 
                        ? 'border-gray-900 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                 >
                    Gallery Settings
                 </button>
                 <button 
                    onClick={() => setActiveTab('MENU')}
                    className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'MENU' 
                        ? 'border-gray-900 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                 >
                    Culinary Preview
                 </button>
                 <button 
                    onClick={() => setActiveTab('SETTINGS')}
                    className={`py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                        activeTab === 'SETTINGS' 
                        ? 'border-gray-900 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                 >
                    SMTP Settings
                 </button>
             </div>
         </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 w-full overflow-hidden flex flex-col">
        
        {/* VIEW: BOOKINGS & FLOOR PLAN */}
        {activeTab === 'BOOKINGS' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
                {/* Left Column: Booking List */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4 h-full min-h-0">
                    
                    {/* Search & Filter Container */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 space-y-3 flex-shrink-0">
                        {/* Search Bar */}
                        <div className="relative">
                            <input 
                                type="text"
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-800 transition-shadow"
                                placeholder="Search customer, email or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>

                        {/* Filter Chips */}
                        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                            {['ALL', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED'].map((f) => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-3 py-2 rounded-md text-xs font-bold uppercase transition-all whitespace-nowrap flex-1 border ${
                                filter === f 
                                    ? 'bg-gray-900 text-white border-gray-900' 
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                {f === 'ALL' ? 'All' : f}
                            </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-20 lg:pb-0 custom-scrollbar">
                        {filteredBookings.length === 0 ? (
                            <div className="text-center py-12 px-6 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300 flex flex-col items-center">
                                <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <span>No bookings found matching "{searchTerm}"</span>
                            </div>
                        ) : (
                            filteredBookings.map((booking) => {
                                const isEditing = editingBookingId === booking.id;

                                return (
                                <div 
                                    key={booking.id} 
                                    className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md relative overflow-hidden ${
                                        isEditing
                                        ? 'ring-2 ring-gray-800 border-gray-800 z-10 shadow-lg'
                                        : assigningBookingId === booking.id 
                                            ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg scale-[1.02]' 
                                            : 'border-gray-200 cursor-pointer'
                                    }`}
                                    onClick={(e) => {
                                        if (isEditing) return; // Don't trigger assignment if editing
                                        if(booking.status === 'PENDING' || booking.status === 'CONFIRMED') {
                                            setAssigningBookingId(assigningBookingId === booking.id ? null : booking.id);
                                        }
                                    }}
                                >
                                    {isEditing ? (
                                        // --- EDIT MODE ---
                                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase">Editing #{booking.id}</span>
                                                <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Name</label>
                                                    <input 
                                                        className="w-full text-sm border-b border-gray-300 py-1 focus:outline-none focus:border-gray-800"
                                                        value={editForm.name || ''}
                                                        onChange={(e) => handleEditFormChange('name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Email</label>
                                                    <input 
                                                        className="w-full text-sm border-b border-gray-300 py-1 focus:outline-none focus:border-gray-800"
                                                        value={editForm.email || ''}
                                                        onChange={(e) => handleEditFormChange('email', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Guests</label>
                                                    <input 
                                                        type="number"
                                                        className="w-full text-sm border-b border-gray-300 py-1 focus:outline-none focus:border-gray-800"
                                                        value={editForm.guests || 0}
                                                        onChange={(e) => handleEditFormChange('guests', parseInt(e.target.value))}
                                                    />
                                                </div>
                                                <div>
                                                     <label className="block text-[10px] font-bold text-gray-500 uppercase">Phone</label>
                                                     <input 
                                                         className="w-full text-sm border-b border-gray-300 py-1 focus:outline-none focus:border-gray-800"
                                                         value={editForm.phone || ''}
                                                         onChange={(e) => handleEditFormChange('phone', e.target.value)}
                                                     />
                                                </div>
                                                <div>
                                                     <label className="block text-[10px] font-bold text-gray-500 uppercase">Date</label>
                                                     <input 
                                                         type="date"
                                                         className="w-full text-sm border-b border-gray-300 py-1 focus:outline-none focus:border-gray-800 bg-transparent"
                                                         value={formatDateForInput(editForm.date)}
                                                         onChange={(e) => handleEditFormChange('date', parseInputDate(e.target.value))}
                                                     />
                                                </div>
                                                <div>
                                                     <label className="block text-[10px] font-bold text-gray-500 uppercase">Time</label>
                                                     <input 
                                                         className="w-full text-sm border-b border-gray-300 py-1 focus:outline-none focus:border-gray-800"
                                                         value={editForm.time || ''}
                                                         onChange={(e) => handleEditFormChange('time', e.target.value)}
                                                     />
                                                </div>
                                            </div>
                                            
                                            <div className="pt-2">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Remarks (Internal Note)</label>
                                                <textarea 
                                                    className="w-full text-sm border border-gray-200 rounded p-2 focus:outline-none focus:border-gray-800 bg-gray-50"
                                                    rows={2}
                                                    placeholder="Add allergies, special requests..."
                                                    value={editForm.remarks || ''}
                                                    onChange={(e) => handleEditFormChange('remarks', e.target.value)}
                                                />
                                            </div>

                                            <button 
                                                onClick={handleSaveEdit}
                                                className="w-full bg-gray-900 text-white font-bold py-2 rounded-lg text-sm hover:bg-black transition-colors"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    ) : (
                                        // --- VIEW MODE ---
                                        <>
                                            {assigningBookingId === booking.id && (
                                                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                                    Assigning...
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start mb-2 pr-6">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-base">{booking.name}</h3>
                                                    <p className="text-sm text-gray-600">{booking.email}</p>
                                                </div>
                                                <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                                                    booking.status === 'SEATED' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {booking.status}
                                                </div>
                                            </div>

                                            {/* Edit Icon */}
                                            <button 
                                                onClick={(e) => handleStartEdit(booking, e)}
                                                className="absolute top-2 right-2 p-1 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                                title="Edit Details"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            
                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-3">
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    {new Date(booking.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {booking.time}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                    {booking.guests} Guests
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                    {booking.tableId || 'Unassigned'}
                                                </div>
                                            </div>

                                            {/* Remarks Display */}
                                            {booking.remarks && (
                                                <div className="mb-3 bg-yellow-50 border border-yellow-100 rounded p-2 flex gap-2">
                                                    <svg className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    <p className="text-xs text-yellow-800 italic leading-snug break-words">{booking.remarks}</p>
                                                </div>
                                            )}

                                            <div className="flex gap-2 border-t border-gray-100 pt-3">
                                                {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setAssigningBookingId(booking.id); }}
                                                        className={`flex-1 text-xs font-bold py-2 rounded transition-colors ${
                                                            assigningBookingId === booking.id
                                                            ? 'bg-blue-600 text-white shadow-md'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {assigningBookingId === booking.id ? 'Select Table >>' : 'Assign Table'}
                                                    </button>
                                                )}
                                                {booking.status === 'CONFIRMED' && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(booking.id, 'SEATED'); }}
                                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded transition-colors"
                                                    >
                                                        Check In
                                                    </button>
                                                )}
                                                {booking.status === 'SEATED' && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(booking.id, 'COMPLETED'); }}
                                                        className="flex-1 bg-gray-800 hover:bg-black text-white text-xs font-bold py-2 rounded transition-colors"
                                                    >
                                                        Finish
                                                    </button>
                                                )}
                                                {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(booking.id, 'CANCELLED'); }}
                                                        className="px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2 rounded transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Column: Visual Floor Plan */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col relative overflow-hidden flex-shrink-0 min-h-[500px]">
                     <div className="flex justify-between items-center mb-6">
                         <h2 className="font-bold text-gray-800 text-lg">Floor Plan</h2>
                         <div className="flex gap-4 text-xs">
                             <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-white border-2 border-gray-400"></div> Available</div>
                             <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-200 border-2 border-blue-600"></div> Reserved</div>
                             <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-200 border-2 border-red-600"></div> Occupied</div>
                         </div>
                     </div>

                     {/* The Floor Grid */}
                     <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-200 relative min-h-[400px]">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                             <div className="text-9xl font-serif text-gray-900">R</div>
                        </div>

                        {/* Tables */}
                        <div className="absolute inset-0 grid grid-cols-3 gap-8 p-12 place-items-center">
                            {TABLES.map(table => {
                                const booking = activeTableMap[table.id];
                                const isAssigned = !!booking;
                                const isSeated = booking?.status === 'SEATED';
                                const isSelectable = assigningBookingId && !isAssigned;

                                return (
                                    <button
                                        key={table.id}
                                        onClick={() => isSelectable ? handleTableAssign(table.id) : null}
                                        disabled={!isSelectable && !isAssigned}
                                        className={`
                                            relative rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-md border-4
                                            ${table.capacity > 4 ? 'w-36 h-36' : 'w-28 h-28'}
                                            ${isSeated 
                                                ? 'bg-red-200 border-red-600 text-red-900' 
                                                : isAssigned 
                                                    ? 'bg-blue-200 border-blue-600 text-blue-900'
                                                    : isSelectable
                                                        ? 'bg-green-100 border-green-500 text-green-900 hover:scale-105 cursor-pointer animate-pulse'
                                                        : 'bg-white border-gray-400 text-gray-800 cursor-default hover:border-gray-500'
                                            }
                                        `}
                                    >
                                        <div className="flex flex-col items-center justify-center leading-tight">
                                            <span className={`text-xs font-bold uppercase mb-1 ${isAssigned ? 'text-current opacity-80' : 'text-gray-500'}`}>ID: {table.label}</span>
                                            <span className="text-3xl font-black">{table.capacity} <span className="text-xs font-bold uppercase align-top">Pax</span></span>
                                        </div>
                                        
                                        {/* Status Badge for Assigned Tables */}
                                        {isAssigned && (
                                            <div className={`
                                                absolute -bottom-3 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm border
                                                ${isSeated 
                                                    ? 'bg-red-600 text-white border-red-800' 
                                                    : 'bg-blue-600 text-white border-blue-800'
                                                }
                                            `}>
                                                {isSeated ? 'Occupied' : 'Reserved'}
                                            </div>
                                        )}
                                        
                                        {/* Chairs Visuals */}
                                        {[...Array(table.capacity)].map((_, i) => (
                                            <div 
                                                key={i}
                                                className={`absolute w-3 h-3 rounded-full border shadow-sm
                                                    ${isSeated 
                                                        ? 'bg-red-400 border-red-600' 
                                                        : isAssigned 
                                                            ? 'bg-blue-400 border-blue-600' 
                                                            : 'bg-gray-200 border-gray-300'
                                                    }
                                                `}
                                                style={{
                                                    transform: `rotate(${i * (360 / table.capacity)}deg) translate(${table.capacity > 4 ? '5.5rem' : '4.5rem'})`
                                                }}
                                            />
                                        ))}
                                    </button>
                                );
                            })}
                        </div>
                     </div>

                     {assigningBookingId && (
                         <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-floating animate-bounce z-20 text-sm font-bold flex items-center gap-2">
                             <span>Select a table to assign</span>
                             <button onClick={() => setAssigningBookingId(null)} className="ml-2 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600">✕</button>
                         </div>
                     )}
                </div>
            </div>
        )}

        {/* VIEW: PAGE DETAILS */}
        {activeTab === 'DETAILS' && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-fade-in max-w-4xl mx-auto flex-shrink-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-100 pb-6">
                    <div>
                         <h2 className="text-lg font-bold text-gray-800">Booking Page Content</h2>
                         <p className="text-sm text-gray-500">Edit titles, descriptions, pricing, and amenities.</p>
                    </div>
                    <button 
                        onClick={savePageDetails}
                        className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                            isDetailsSaved 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                    >
                        {isDetailsSaved ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Saved!
                            </>
                        ) : 'Save Changes'}
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Section 1: Header Info */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Header Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Page Title</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                    value={pageDetails.title}
                                    onChange={(e) => handleDetailChange('title', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Location Subtitle</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                    value={pageDetails.location}
                                    onChange={(e) => handleDetailChange('location', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Price Per Person (RM)</label>
                                <input 
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                    value={pageDetails.price}
                                    onChange={(e) => handleDetailChange('price', Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Host Info */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Host Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Host Name</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                    value={pageDetails.hostName}
                                    onChange={(e) => handleDetailChange('hostName', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Host Subtext (Guests, Duration, etc.)</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                    value={pageDetails.hostStats}
                                    onChange={(e) => handleDetailChange('hostStats', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Facilities */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Facilities</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Facility 1 Title</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded mb-3 focus:border-gray-800 focus:outline-none"
                                    value={pageDetails.facility1Title}
                                    onChange={(e) => handleDetailChange('facility1Title', e.target.value)}
                                />
                                <label className="block text-xs font-bold text-gray-600 mb-1">Facility 1 Description</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                    value={pageDetails.facility1Text}
                                    onChange={(e) => handleDetailChange('facility1Text', e.target.value)}
                                />
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Facility 2 Title</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded mb-3 focus:border-gray-800 focus:outline-none"
                                    value={pageDetails.facility2Title}
                                    onChange={(e) => handleDetailChange('facility2Title', e.target.value)}
                                />
                                <label className="block text-xs font-bold text-gray-600 mb-1">Facility 2 Description</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                    value={pageDetails.facility2Text}
                                    onChange={(e) => handleDetailChange('facility2Text', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: About Content */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">About Content</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">About Section Title</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                    value={pageDetails.aboutTitle}
                                    onChange={(e) => handleDetailChange('aboutTitle', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Paragraph 1</label>
                                <textarea 
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none resize-none"
                                    value={pageDetails.aboutText1}
                                    onChange={(e) => handleDetailChange('aboutText1', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Paragraph 2</label>
                                <textarea 
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none resize-none"
                                    value={pageDetails.aboutText2}
                                    onChange={(e) => handleDetailChange('aboutText2', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {/* VIEW: GALLERY */}
        {activeTab === 'GALLERY' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-fade-in flex-shrink-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                         <h2 className="text-lg font-bold text-gray-800">Gallery Management</h2>
                         <p className="text-sm text-gray-500">Update the 5 photos displayed on the main booking page.</p>
                    </div>
                    <button 
                        onClick={saveGallery}
                        className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                            isGallerySaved 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                    >
                        {isGallerySaved ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Saved!
                            </>
                        ) : 'Save Changes'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[500px] mb-8">
                     <GallerySlot 
                        image={galleryImages[0]} 
                        label="Main Left Image" 
                        onUpdate={(val) => handleGalleryChange(0, val)}
                        className="h-[250px] md:h-auto md:col-span-2 md:row-span-2" 
                     />
                     <GallerySlot 
                        image={galleryImages[1]} 
                        label="Top Middle" 
                        onUpdate={(val) => handleGalleryChange(1, val)}
                        className="h-[200px] md:h-auto" 
                     />
                     <GallerySlot 
                        image={galleryImages[3]} 
                        label="Bottom Middle" 
                        onUpdate={(val) => handleGalleryChange(3, val)}
                        className="h-[200px] md:h-auto" 
                     />
                     <GallerySlot 
                        image={galleryImages[2]} 
                        label="Top Right" 
                        onUpdate={(val) => handleGalleryChange(2, val)}
                        className="h-[200px] md:h-auto" 
                     />
                     <GallerySlot 
                        image={galleryImages[4]} 
                        label="Bottom Right" 
                        onUpdate={(val) => handleGalleryChange(4, val)}
                        className="h-[200px] md:h-auto" 
                     />
                </div>
                
                <div className="bg-gray-50 text-gray-600 p-4 rounded-lg text-sm border border-gray-100 flex items-start gap-3">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                        <strong>Instructions:</strong> Drag and drop images directly into the boxes above, or click to upload. 
                        You can also paste an image URL if you prefer. Click "Save Changes" to publish.
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: MENU / CULINARY PREVIEW */}
        {activeTab === 'MENU' && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-fade-in flex-shrink-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                         <h2 className="text-lg font-bold text-gray-800">Culinary Preview</h2>
                         <p className="text-sm text-gray-500">Edit the 4 slides shown in the waiting room.</p>
                    </div>
                    <button 
                        onClick={saveMenu}
                        className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                            isMenuSaved 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                    >
                        {isMenuSaved ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Saved!
                            </>
                        ) : 'Save Changes'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {menuItems.map((item, idx) => (
                        <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slide #{idx + 1}</span>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="w-1/3 aspect-[4/5]">
                                     <GallerySlot 
                                        image={item.image} 
                                        label="Dish Photo" 
                                        className="h-full w-full"
                                        onUpdate={(val) => handleMenuChange(idx, 'image', val)}
                                     />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Title</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-800"
                                            value={item.title}
                                            onChange={(e) => handleMenuChange(idx, 'title', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Description</label>
                                        <textarea 
                                            rows={3}
                                            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-800 resize-none"
                                            value={item.description}
                                            onChange={(e) => handleMenuChange(idx, 'description', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        )}
        
        {/* VIEW: SMTP SETTINGS */}
        {activeTab === 'SETTINGS' && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-fade-in max-w-2xl mx-auto flex-shrink-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-100 pb-6">
                    <div>
                         <h2 className="text-lg font-bold text-gray-800">SMTP Configuration</h2>
                         <p className="text-sm text-gray-500">Configure email sender details for automated confirmations.</p>
                    </div>
                    <button 
                        onClick={saveSmtp}
                        className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                            isSmtpSaved 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                    >
                        {isSmtpSaved ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Saved!
                            </>
                        ) : 'Save Configuration'}
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 mb-6">
                         <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         <p className="text-xs text-blue-800 leading-relaxed">
                            These settings configure the sender identity. Due to browser security restrictions, the system uses a simulated handshake sequence and prepares a drafted email (mailto) for final delivery.
                         </p>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={smtpConfig.isEnabled}
                                onChange={(e) => handleSmtpChange('isEnabled', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                        <span className="text-sm font-bold text-gray-700">Enable Automated Email Service</span>
                    </div>

                    <div className={`space-y-6 transition-opacity ${smtpConfig.isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">SMTP Host</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                    value={smtpConfig.host}
                                    placeholder="e.g. smtp.gmail.com"
                                    onChange={(e) => handleSmtpChange('host', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Port</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                    value={smtpConfig.port}
                                    placeholder="e.g. 587"
                                    onChange={(e) => handleSmtpChange('port', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Sender Name (From)</label>
                            <input 
                                className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                value={smtpConfig.fromName}
                                placeholder="e.g. Rembayung Reservations"
                                onChange={(e) => handleSmtpChange('fromName', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Username / Email Address</label>
                                <input 
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                    value={smtpConfig.user}
                                    placeholder="e.g. reservations@rembayung.com"
                                    onChange={(e) => handleSmtpChange('user', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Password / App Password</label>
                                <input 
                                    type="password"
                                    className="w-full p-2 border border-gray-300 rounded focus:border-gray-800 focus:outline-none"
                                    value={smtpConfig.pass}
                                    placeholder="••••••••••••"
                                    onChange={(e) => handleSmtpChange('pass', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        )}
      </main>
    </div>
  );
};