import { Booking, BookingStatus, MenuItem, PageDetails, SMTPConfig } from '../types';

const DB_KEY = 'rembayung_db_bookings_v1';
const GALLERY_KEY = 'rembayung_gallery_v1';
const MENU_KEY = 'rembayung_menu_v1';
const PAGE_DETAILS_KEY = 'rembayung_page_details_v1';
const SMTP_KEY = 'rembayung_smtp_v1';

const DEFAULT_GALLERY = [
  "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?q=80&w=1200", // Main Left: Elegant Dining/Event Space
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600",  // Top Mid: Warm Wooden Interior
  "https://images.unsplash.com/photo-1626509689874-846a6eb27303?q=80&w=600",  // Top Right: Satay
  "https://images.unsplash.com/photo-1604423043492-41303788de80?q=80&w=600",  // Bot Mid: Rice Dish/Nasi Lemak
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=600"   // Bot Right: Dessert
];

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 1,
    title: "Daging Rusuk Salai Lemak",
    description: "Smoked beef ribs slow-cooked in rich turmeric and coconut gravy (Masak Lemak Cili Api).",
    image: "https://images.unsplash.com/photo-1544025162-d76690b68f11?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Nasi Kerabu DiRaja",
    description: "Blue pea flower rice served with Percik chicken, salted egg, fish crackers and solok lada.",
    image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Satay Wagyu Batang Pinang",
    description: "Premium Wagyu beef skewers marinated in lemongrass and spices, charcoal-grilled to perfection.",
    image: "https://images.unsplash.com/photo-1626509689874-846a6eb27303?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "Sago Gula Melaka",
    description: "Chilled pearl sago pudding drenched in fresh santan and premium palm sugar syrup.",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop"
  }
];

const DEFAULT_PAGE_DETAILS: PageDetails = {
  title: "Exclusive Malay Dining at Rembayung",
  location: "Jalan Tun Razak, Kuala Lumpur",
  hostName: "Rembayung Hospitality",
  hostStats: "2 - 8 guests • 2 hour duration • Traditional Malay Fine Dining",
  aboutTitle: "About the Experience",
  aboutText1: "Rembayung invites you to rediscover the heritage of Malay cuisine in the heart of Kuala Lumpur. Located at the National Heart Institute (IJN), we offer a sophisticated interpretation of traditional flavors passed down through generations.",
  aboutText2: "From the smoky aroma of our Masak Lemak Salai to the vibrant colors of our Nasi Kerabu, every dish is a tribute to Malaysia's rich culinary history, served in an elegant setting perfect for family gatherings and corporate dining.",
  price: 150,
  facility1Title: "Facilities",
  facility1Text: "Musolla (Prayer Room) available on-site for comfort and convenience.",
  facility2Title: "Halal Certified",
  facility2Text: "All ingredients are sourced from Halal-certified suppliers."
};

const DEFAULT_SMTP_CONFIG: SMTPConfig = {
    host: "smtp.rembayung.com",
    port: "587",
    user: "reservations@rembayung.com",
    pass: "",
    fromName: "Rembayung Reservations",
    isEnabled: true
};

// Initialize DB if empty or invalid
const initDB = () => {
  try {
    const content = localStorage.getItem(DB_KEY);
    if (!content) {
      localStorage.setItem(DB_KEY, JSON.stringify([]));
      return;
    }
    // Verify it's a valid JSON array
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
       localStorage.setItem(DB_KEY, JSON.stringify([]));
    }
  } catch (e) {
    // If corrupt, reset
    localStorage.setItem(DB_KEY, JSON.stringify([]));
  }
};

export const db = {
  // Create a new booking
  createBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'>): Booking => {
    initDB();
    let bookings: Booking[] = [];
    try {
        bookings = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
        if (!Array.isArray(bookings)) bookings = [];
    } catch (e) {
        bookings = [];
    }
    
    const newBooking: Booking = {
      ...booking,
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      status: 'PENDING',
      createdAt: Date.now(),
    };

    bookings.push(newBooking);
    
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(bookings));
    } catch (e) {
        console.error("Storage limit exceeded, booking processed in-memory only", e);
        // We catch the error so the UI flow doesn't break, but we warn the user via console
    }
    
    return newBooking;
  },

  // Get all bookings
  getBookings: (): Booking[] => {
    initDB();
    try {
        const data = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("Failed to load bookings", e);
        return [];
    }
  },

  // Update booking status or table
  updateBooking: (id: string, updates: Partial<Booking>) => {
    initDB();
    let bookings: Booking[] = [];
    try {
        bookings = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
        if (!Array.isArray(bookings)) bookings = [];
    } catch(e) { 
        return null; 
    }

    const index = bookings.findIndex(b => b.id === id);
    
    if (index !== -1) {
      bookings[index] = { ...bookings[index], ...updates };
      try {
          localStorage.setItem(DB_KEY, JSON.stringify(bookings));
      } catch (e) {
          console.error("Storage limit exceeded during update", e);
      }
      return bookings[index];
    }
    return null;
  },

  // Admin Login Simulation
  login: (username: string, pass: string): boolean => {
    // Hardcoded for demo
    return username === 'admin' && pass === 'rembayung123';
  },

  // Gallery Management
  getGallery: (): string[] => {
    try {
      const stored = localStorage.getItem(GALLERY_KEY);
      if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length >= 5) return parsed;
      }
      return DEFAULT_GALLERY;
    } catch {
      return DEFAULT_GALLERY;
    }
  },
  
  saveGallery: (images: string[]) => {
    try {
        localStorage.setItem(GALLERY_KEY, JSON.stringify(images));
    } catch (e) {
        console.error("Storage limit exceeded while saving gallery", e);
        throw new Error("Storage full");
    }
  },

  // Menu / Culinary Preview Management
  getMenuItems: (): MenuItem[] => {
    try {
      const stored = localStorage.getItem(MENU_KEY);
      if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_MENU_ITEMS;
    } catch {
      return DEFAULT_MENU_ITEMS;
    }
  },

  saveMenuItems: (items: MenuItem[]) => {
      try {
        localStorage.setItem(MENU_KEY, JSON.stringify(items));
      } catch (e) {
        console.error("Storage full while saving menu items", e);
        throw new Error("Storage full");
      }
  },

  // Page Details Management
  getPageDetails: (): PageDetails => {
      try {
          const stored = localStorage.getItem(PAGE_DETAILS_KEY);
          if (stored) {
              const parsed = JSON.parse(stored);
              // Simple validation to check if it has keys
              if (parsed && typeof parsed === 'object') {
                  return { ...DEFAULT_PAGE_DETAILS, ...parsed }; // Merge to ensure all keys exist
              }
          }
          return DEFAULT_PAGE_DETAILS;
      } catch {
          return DEFAULT_PAGE_DETAILS;
      }
  },

  savePageDetails: (details: PageDetails) => {
      try {
          localStorage.setItem(PAGE_DETAILS_KEY, JSON.stringify(details));
      } catch (e) {
          console.error("Storage full while saving page details", e);
          throw new Error("Storage full");
      }
  },

  // SMTP Management
  getSMTPConfig: (): SMTPConfig => {
      try {
          const stored = localStorage.getItem(SMTP_KEY);
          if (stored) {
              return { ...DEFAULT_SMTP_CONFIG, ...JSON.parse(stored) };
          }
          return DEFAULT_SMTP_CONFIG;
      } catch {
          return DEFAULT_SMTP_CONFIG;
      }
  },

  saveSMTPConfig: (config: SMTPConfig) => {
      try {
          localStorage.setItem(SMTP_KEY, JSON.stringify(config));
      } catch (e) {
          console.error("Storage full while saving SMTP config", e);
          throw new Error("Storage full");
      }
  }
};