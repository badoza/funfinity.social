import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { MapPin, Calendar, Users, PlusCircle, Home, ShieldCheck, Search, Camera, MessageCircle, Info, Navigation, Coffee, Sparkles, User, LogOut, CheckCircle, XCircle, QrCode, Image as ImageIcon, Megaphone, Edit3, Ticket, MapPinned, PlayCircle, Trash2, ShieldAlert, UploadCloud } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyBJQGM2mJpGkbJFTH9KiqAr3MQff9VJr_Y",
  authDomain: "funfinity-28521.firebaseapp.com",
  projectId: "funfinity-28521",
  storageBucket: "funfinity-28521.firebasestorage.app",
  messagingSenderId: "493685480978",
  appId: "1:493685480978:web:8b979f65956217e84fc2cb",
  measurementId: "G-9DEDTCBXL0"
};

// Safe initialization to prevent Hot-Reload crashes
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// The Super Admins Array
const ADMIN_EMAILS = ['tilakdongare064@gmail.com', 'dodge.kunal@gmail.com'];
const appId = 'funfinity-production';

export default function FunfinityApp() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('guest'); 
  const [events, setEvents] = useState([]);
  const [memories, setMemories] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({ logoUrl: null });
  const [currentView, setCurrentView] = useState('home'); 
  const [loading, setLoading] = useState(true);
  
  // Auth State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Modals & Forms
  const [showPaymentModal, setShowPaymentModal] = useState(null); 
  const [showGuestModal, setShowGuestModal] = useState(null);
  const [guestForm, setGuestForm] = useState({ name: '', phone: '' });
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  // Discover State
  const [activeVibeFilter, setActiveVibeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const vibes = ['All', 'Chill', 'High Energy', 'Deep Conversations', 'Creative', 'Food & Drink'];

  // Host/Create State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '', date: '', time: '', venue: '', mapLink: '', price: '', upiId: '', description: '', vibe: 'Chill', imageUrl: ''
  });

  // Admin State
  const [announcement, setAnnouncement] = useState("✨ Welcome to Funfinity! The ultimate social club in Belagavi. Join our WhatsApp group!");
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [newMemory, setNewMemory] = useState({ title: '', url: '', type: 'image' });
  
  const [adForm, setAdForm] = useState({ imageUrl: '', linkUrl: '', isActive: false });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const openAuthModal = () => {
    setAuthError('');
    setShowAuthModal(true);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase())) {
        setUserRole('admin');
      } else if (currentUser && !currentUser.isAnonymous) {
        setUserRole('user');
      } else {
        setUserRole('guest');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Fetch Events safely
    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const unsubscribeEvents = onSnapshot(eventsRef, (snapshot) => {
      const fetchedEvents = [];
      snapshot.forEach(doc => fetchedEvents.push({ id: doc.id, ...doc.data() }));
      setEvents(fetchedEvents.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    // Fetch Memories safely
    const memoriesRef = collection(db, 'artifacts', appId, 'public', 'data', 'memories');
    const unsubscribeMemories = onSnapshot(memoriesRef, (snapshot) => {
      const fetchedMemories = [];
      snapshot.forEach(doc => fetchedMemories.push({ id: doc.id, ...doc.data() }));
      setMemories(fetchedMemories.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
      console.error("Error fetching memories:", error);
    });

    // Fetch Settings
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlatformSettings(data);
        if (data.adBanner) {
          setAdForm(data.adBanner);
        }
      }
    });

    return () => {
      unsubscribeEvents();
      unsubscribeMemories();
      unsubscribeSettings();
    };
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
      showToast("Successfully logged in! Welcome to Funfinity.");
    } catch (err) {
      setAuthError(err.message.replace('Firebase:', '').trim());
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    await signInAnonymously(auth); 
    setCurrentView('home');
    showToast("You have been logged out.");
  };

  const searchOSMLocation = async (query) => {
    if (!query) return;
    setIsSearchingLocation(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`);
      const data = await res.json();
      setLocationResults(data);
    } catch (err) {
      console.error("Location search failed", err);
      showToast("Failed to search map. Try again.", "error");
    }
    setIsSearchingLocation(false);
  };

  const initiateRSVP = (event) => {
    // Safe check for attendees
    const isAttending = event.attendees?.some(a => (typeof a === 'string' ? a : a?.uid) === user?.uid);
    if (isAttending) {
      showToast("You are already booked for this event!", "error");
      return;
    } 
    
    if (!user || user.isAnonymous) {
      setShowGuestModal(event);
      return;
    }

    if (event.price && parseInt(event.price) > 0 && event.upiId) {
      setShowPaymentModal({ event, attendeeData: { uid: user.uid, name: user.displayName || user.email || 'Verified User', type: 'user' } });
    } else {
      completeRSVP(event.id, { uid: user.uid, name: user.displayName || user.email || 'Verified User', type: 'user' });
    }
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    const event = showGuestModal;
    const attendeeData = { uid: 'guest-' + Date.now(), name: guestForm.name, phone: guestForm.phone, type: 'guest' };
    setShowGuestModal(null);

    if (event.price && parseInt(event.price) > 0 && event.upiId) {
      setShowPaymentModal({ event, attendeeData });
    } else {
      completeRSVP(event.id, attendeeData);
    }
  };

  const completeRSVP = async (eventId, attendeeData) => {
    try {
      const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
      await updateDoc(eventRef, { attendees: arrayUnion(attendeeData) });
      setShowPaymentModal(null);
      setGuestForm({ name: '', phone: '' });
      showToast("Successfully booked! Check your WhatsApp/Email for details.");
    } catch (err) {
      console.error("RSVP failed", err);
      showToast("Booking failed. Please try again.", "error");
    }
  };

  const safeDeleteEvent = (eventId) => {
    setConfirmModal({
      title: "Delete Event",
      message: "Are you sure you want to permanently delete this event?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId));
          showToast("Event deleted successfully.");
        } catch (err) {
          showToast("Failed to delete.", "error");
        }
        setConfirmModal(null);
      }
    });
  };

  const safeDeleteMemory = (memoryId) => {
    setConfirmModal({
      title: "Delete Memory",
      message: "Are you sure you want to remove this media from the Memory Wall?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'memories', memoryId));
          showToast("Memory deleted successfully.");
        } catch (err) {
          showToast("Failed to delete.", "error");
        }
        setConfirmModal(null);
      }
    });
  };

  const handleMemorySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    let finalUrl = newMemory.url;

    try {
      if (newMemory.type === 'video') {
        if (finalUrl.includes('youtube.com/watch?v=')) {
          const videoId = new URL(finalUrl).searchParams.get("v");
          finalUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (finalUrl.includes('youtu.be/')) {
          const videoId = finalUrl.split('youtu.be/')[1].split('?')[0];
          finalUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'memories'), {
        title: newMemory.title,
        url: finalUrl,
        type: newMemory.type,
        createdAt: Date.now()
      });
      showToast("Memory added to the Wall!");
      setNewMemory({ title: '', url: '', type: 'image' });
    } catch (err) {
      console.error(err);
      showToast("Failed to post memory.", "error");
    }
    setIsSubmitting(false);
  };

  const handleLogoUpdate = async () => {
    if (!newLogoUrl) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings'), { logoUrl: newLogoUrl }, { merge: true });
      showToast("App Icon successfully updated globally!");
      setNewLogoUrl('');
    } catch (err) {
      console.error(err);
      showToast("Failed to update logo.", "error");
    }
    setIsSubmitting(false);
  };

  const handleAdUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings'), { adBanner: adForm }, { merge: true });
      showToast("Ad Banner updated successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to update Ad Banner.", "error");
    }
    setIsSubmitting(false);
  };

  const Logo = ({ size = 45 }) => {
    if (platformSettings?.logoUrl) {
      return <img src={platformSettings.logoUrl} alt="Funfinity Logo" style={{ width: size, height: size, objectFit: 'contain' }} className="transform hover:scale-105 transition-transform duration-300 shrink-0 rounded-full" />;
    }
    return (
      <svg width={size} height={size * 0.88} viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" className="transform hover:scale-105 transition-transform duration-300 shrink-0">
        <path d="M 28 45 C 10 45, 10 15, 28 15 C 45 15, 55 45, 72 45 C 90 45, 90 15, 72 15 C 55 15, 45 45, 28 45 Z" fill="none" stroke="#D48847" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="28" cy="30" r="4.5" fill="#4A3B32" />
        <circle cx="72" cy="30" r="4.5" fill="#4A3B32" />
        <path d="M 32 60 Q 50 78 68 60" fill="none" stroke="#D48847" strokeWidth="8" strokeLinecap="round" />
      </svg>
    );
  };

  const renderHome = () => (
    <div className="w-full bg-[#FDFBF7] animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-[#D48847] to-[#e09b5f] text-white py-3 px-4 relative flex items-center justify-center text-sm font-bold shadow-sm">
        <Megaphone size={16} className="mr-2 shrink-0" />
        {isEditingAnnouncement ? (
          <div className="flex gap-2 w-full max-w-lg">
            <input type="text" value={announcement} onChange={e => setAnnouncement(e.target.value)} className="text-black px-2 py-1 rounded text-xs w-full" />
            <button onClick={() => setIsEditingAnnouncement(false)} className="bg-black/20 px-3 rounded hover:bg-black/40">Save</button>
          </div>
        ) : (
          <span className="text-center truncate max-w-2xl">{announcement}</span>
        )}
        {userRole === 'admin' && !isEditingAnnouncement && (
          <button onClick={() => setIsEditingAnnouncement(true)} className="absolute right-4 p-1 bg-black/10 rounded-md hover:bg-black/20"><Edit3 size={14}/></button>
        )}
      </div>

      <section className="min-h-[85vh] flex flex-col justify-center items-center text-center px-4 relative overflow-hidden pt-12 pb-20" style={{ backgroundImage: "radial-gradient(circle at center, rgba(212,136,71,0.05) 0%, transparent 70%)" }}>
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob animation-delay-2000"></div>

        <div className="z-10 max-w-5xl mx-auto flex flex-col items-center mt-10">
          <div className="inline-block bg-white/60 backdrop-blur-md border border-[#D48847]/20 rounded-full px-5 py-2 mb-8 shadow-sm flex items-center gap-2 hover:scale-105 transition-transform cursor-default">
            <MapPin size={16} className="text-[#D48847] animate-bounce" />
            <span className="text-[#4A3B32] font-bold text-sm tracking-wide">Belagavi's Premium Social Club</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-[#4A3B32] tracking-tight mb-6 leading-[1.1]">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D48847] to-[#e09b5f]">Vibe.</span><br />
            Find Your <span className="text-[#4A3B32]">People.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#4A3B32]/70 mb-10 max-w-2xl font-medium leading-relaxed">
            Stop swiping. Start meeting. Discover highly curated local events, dinners, and creative workshops with amazing people.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
            <button onClick={() => setCurrentView('discover')} className="bg-[#4A3B32] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-black transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 group">
              <Search size={20} className="group-hover:rotate-12 transition-transform" /> Explore Events
            </button>
            <button onClick={() => { userRole !== 'guest' ? setCurrentView('create') : openAuthModal() }} className="bg-white text-[#4A3B32] border-2 border-[#F3E8D8] px-8 py-4 rounded-full font-bold text-lg hover:border-[#D48847] hover:bg-orange-50 transition-all shadow-sm flex items-center justify-center gap-2">
              <User size={20} /> {userRole !== 'guest' ? 'Host an Event' : 'Join the Club'}
            </button>
          </div>

          {}
          {platformSettings?.adBanner?.isActive && platformSettings?.adBanner?.imageUrl && (
             <a href={platformSettings.adBanner.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="w-full max-w-4xl mt-4 rounded-3xl overflow-hidden shadow-2xl border-4 border-white block hover:scale-[1.02] transition-transform duration-300 relative group cursor-pointer">
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-bold tracking-widest uppercase z-10">Sponsored</div>
                <img src={platformSettings.adBanner.imageUrl} alt="Advertisement" className="w-full h-auto max-h-96 object-cover" />
             </a>
          )}
        </div>
      </section>

      {memories.length > 0 && (
        <section className="py-24 bg-white border-y border-[#F3E8D8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#4A3B32] mb-4">The Memory Wall</h2>
              <p className="text-xl text-gray-500 font-medium">Unforgettable moments from our recent gatherings.</p>
            </div>
            
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {memories.map((memory) => (
                <div key={memory.id} className="break-inside-avoid relative rounded-3xl overflow-hidden shadow-lg border border-gray-100 group">
                  {memory.type === 'video' ? (
                    <div className="aspect-w-16 aspect-h-9 relative">
                      <iframe src={memory.url} title={memory.title} className="w-full h-64 object-cover" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-black shadow-sm flex items-center gap-1">
                        <PlayCircle size={14} className="text-red-500"/> Video Highlight
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={memory.url} alt={memory.title} className="w-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-black shadow-sm flex items-center gap-1">
                        <Camera size={14} className="text-[#D48847]"/> Memory
                      </div>
                    </div>
                  )}
                  <div className="p-4 bg-white">
                    <p className="font-bold text-[#4A3B32] text-sm">{memory.title || 'Special Moment'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 bg-[#FDFBF7] px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
             <h2 className="text-4xl font-bold text-[#4A3B32] mb-6">More than a community. A place that feels like home.</h2>
             <p className="text-lg text-gray-600 mb-8 font-medium">We created Funfinity to bring real connections back to the real world. No swiping, just showing up and sharing a laugh.</p>
             <ul className="space-y-4">
               <li className="flex gap-4 items-start"><CheckCircle className="text-green-500 shrink-0 mt-1"/> <span className="font-bold text-[#4A3B32]">Real People, Good Vibes.</span></li>
               <li className="flex gap-4 items-start"><CheckCircle className="text-green-500 shrink-0 mt-1"/> <span className="font-bold text-[#4A3B32]">Safe, Verified Hosts.</span></li>
               <li className="flex gap-4 items-start"><CheckCircle className="text-green-500 shrink-0 mt-1"/> <span className="font-bold text-[#4A3B32]">Memories that matter.</span></li>
             </ul>
          </div>
          <div className="flex-1 flex justify-center">
             <div className="w-64 h-64 bg-[#F3E8D8] rounded-full flex items-center justify-center shadow-xl border-8 border-white relative animate-pulse" style={{animationDuration: '4s'}}>
                <Logo size={120} />
                <div className="absolute -top-4 -right-4 bg-white px-4 py-2 rounded-full shadow-md font-bold text-sm text-[#D48847] rotate-12">Connect.</div>
                <div className="absolute -bottom-4 -left-4 bg-white px-4 py-2 rounded-full shadow-md font-bold text-sm text-[#4A3B32] -rotate-12">Belong.</div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderDiscover = () => {
    const filteredEvents = events.filter(e => {
      const matchesVibe = activeVibeFilter === 'All' || e.vibe === activeVibeFilter;
      const matchesSearch = (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (e.venue || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesVibe && matchesSearch;
    });

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-[#FFF9F2] rounded-[2.5rem] border-2 border-[#D48847]/20 p-6 md:p-10 shadow-lg relative overflow-hidden flex flex-col md:flex-row gap-8 items-center mb-10">
          <div className="flex-1 z-10 w-full">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-[#D48847] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Featured Event</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-[#4A3B32] mb-2 tracking-tight">STRANGERS</h1>
            <h1 className="text-5xl md:text-6xl font-bold text-[#D48847] mb-4 tracking-tight flex items-center gap-4">
              MEETUP <Sparkles className="text-[#D48847]" size={40} />
            </h1>
            <p className="text-xl text-[#4A3B32]/80 italic mb-6 font-medium">"New people, real conversations, endless fun!"</p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="bg-[#F3E8D8] text-[#4A3B32] px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-sm">
                <MapPin size={18} className="text-[#D48847]" /> La Casa Cafe, Belagavi
              </div>
              <div className="bg-[#4A3B32] text-white px-5 py-2 rounded-full font-bold flex items-center gap-2 shadow-md">
                 Entry Fee: ₹150
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4 items-start bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
                <div className="w-12 h-12 bg-[#4A3B32] text-[#F3E8D8] rounded-full flex items-center justify-center shrink-0 shadow-md">
                  <Coffee size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-[#4A3B32]">COFFEE ON US!</h4>
                  <p className="text-sm text-[#4A3B32]/70">A warm cup of coffee to get you started.</p>
                </div>
              </div>
            </div>
            
            <a href="https://chat.whatsapp.com/KNHPGQzwqtr4nWBIQcZyXH" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-gradient-to-r from-[#D48847] to-[#e09b5f] hover:from-[#4A3B32] hover:to-[#2c221c] text-white px-8 py-4 rounded-full font-bold shadow-xl transition-all flex items-center justify-center gap-3 text-lg">
              <Navigation size={20} /> Join WhatsApp for Details
            </a>
          </div>
          <div className="flex-1 relative z-10 w-full h-[400px] md:h-auto rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
            <img src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Strangers Meetup" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#F3E8D8] shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div>
              <h1 className="text-3xl font-bold text-[#4A3B32]">Explore Marketplace</h1>
              <p className="text-gray-500 font-medium text-sm">Find your next favorite memory.</p>
           </div>
           <div className="w-full md:w-96 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input 
                type="text" 
                placeholder="Search events, cafes, hosts..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#D48847] outline-none font-medium"
              />
           </div>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full pb-2">
          {vibes.map(vibe => (
            <button 
              key={vibe} 
              onClick={() => setActiveVibeFilter(vibe)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${activeVibeFilter === vibe ? 'bg-[#4A3B32] text-white shadow-md' : 'bg-white text-[#4A3B32] border border-[#F3E8D8] hover:border-[#D48847]'}`}
            >
              {vibe}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D48847]"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
             <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
             <h3 className="text-xl font-bold text-gray-400 mb-2">No events found</h3>
             <p className="text-gray-500 mb-4">Be the first to host this kind of vibe in Belagavi!</p>
             <button onClick={() => setCurrentView('create')} className="bg-[#4A3B32] text-white px-6 py-2 rounded-full font-bold hover:bg-black transition-colors">Create Event</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => {
              const isAttending = event.attendees?.some(a => (typeof a === 'string' ? a : a?.uid) === user?.uid);
              const isHost = event.hostId === user?.uid;
              const isPaid = event.price && parseInt(event.price) > 0;

              return (
                <div key={event.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#F3E8D8] flex flex-col h-full group">
                  <div className="h-56 overflow-hidden relative shrink-0">
                    <img src={event.imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4'} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-[#4A3B32] shadow-md flex items-center gap-1 border border-white/20">
                      {isPaid ? `₹${event.price}` : 'FREE ENTRY'}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow relative bg-white">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#D48847] uppercase tracking-wide mb-2">
                      <Calendar size={14} /> {event.date} • {event.time}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-[#4A3B32] mb-2 leading-tight">{event.title || 'Untitled Event'}</h3>
                    
                    <div className="flex items-start gap-2 text-sm text-gray-500 mb-4 font-medium line-clamp-2">
                      <MapPin size={16} className="shrink-0 mt-0.5 text-[#D48847]" /> 
                      <a href={event.mapLink || '#'} target="_blank" rel="noreferrer" className="hover:underline hover:text-[#D48847]">{event.venue}</a>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-6 line-clamp-2 flex-grow">{event.description}</p>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-[#D48847]">
                          {(event.host || 'H').charAt(0).toUpperCase()}
                        </div>
                        <div className="text-xs">
                          <div className="font-bold text-[#4A3B32] flex items-center gap-1">{event.host || 'Verified Host'} <ShieldCheck size={10} className="text-blue-500"/></div>
                          <div className="text-gray-400 font-medium">{event.attendees?.length || 0} attending</div>
                        </div>
                      </div>
                      
                      {isHost ? (
                        <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm">Managing</span>
                      ) : isAttending ? (
                        <button className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1 border border-green-200">
                           <Ticket size={16} /> Booked
                        </button>
                      ) : (
                        <button onClick={() => initiateRSVP(event)} className="bg-[#4A3B32] hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2">
                          Get Ticket
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderCreateEvent = () => {
    if (!user || user.isAnonymous) {
      return (
        <div className="py-24 text-center max-w-lg mx-auto px-4">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <ShieldCheck size={48} className="text-blue-500" />
          </div>
          <h2 className="text-3xl font-bold text-[#4A3B32] mb-4">Host Verification Required</h2>
          <p className="text-gray-500 mb-8 font-medium">To maintain the highest quality and safety for the Funfinity community, all hosts must log in to create events.</p>
          <button onClick={() => openAuthModal()} className="bg-[#4A3B32] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-black transition-all transform hover:-translate-y-1 w-full">
            Log in to Host
          </button>
        </div>
      );
    }

    const handleCreateSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      const eventData = {
        ...newEvent,
        imageUrl: newEvent.imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3',
        hostId: user.uid,
        host: user.displayName || (user.email ? user.email.split('@')[0] : 'Verified Host'),
        attendees: [],
        createdAt: Date.now()
      };

      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), eventData);
        setCurrentView('discover');
        setNewEvent({ title: '', date: '', time: '', venue: '', mapLink: '', price: '', upiId: '', description: '', vibe: 'Chill', imageUrl: '' });
        showToast("Event published successfully!");
      } catch (err) {
        showToast("Failed to create event.", "error");
      }
      setIsSubmitting(false);
    };

    return (
      <div className="max-w-3xl mx-auto w-full bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-[#F3E8D8] animate-in fade-in mt-8 mb-20">
        <div className="mb-8 text-center">
          <div className="inline-block bg-[#F3E8D8] text-[#D48847] px-4 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-widest">Creator Studio</div>
          <h2 className="text-3xl font-bold text-[#4A3B32] mb-2">Publish an Experience</h2>
          <p className="text-gray-500 font-medium">Fill out the details below. We'll handle the ticketing, payments (via your UPI), and guest lists.</p>
        </div>
        
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
             <h3 className="font-bold text-[#4A3B32] flex items-center gap-2"><Info size={18}/> 1. The Basics</h3>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Event Title</label>
                <input required type="text" placeholder="e.g., Acoustic Campfire Jam" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-white font-medium" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                  <input required type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-white font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Time</label>
                  <input required type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-white font-medium" />
                </div>
             </div>
          </div>

          <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100 space-y-4">
             <h3 className="font-bold text-[#4A3B32] flex items-center gap-2"><MapPinned size={18} className="text-blue-500"/> 2. Location (Free Map Search)</h3>
             <div className="flex gap-2 relative">
                <input type="text" placeholder="Search cafes, landmarks..." value={locationSearchQuery} onChange={e => setLocationSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchOSMLocation(locationSearchQuery))} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 outline-none bg-white text-sm font-medium" />
                <button type="button" onClick={() => searchOSMLocation(locationSearchQuery)} className="bg-blue-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-sm whitespace-nowrap">
                  {isSearchingLocation ? 'Searching...' : 'Search'}
                </button>
             </div>
             
             {locationResults.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden z-10">
                   {locationResults.map((loc, idx) => (
                      <div key={idx} onClick={() => {
                         const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lon}`;
                         setNewEvent({...newEvent, venue: loc.display_name.split(',')[0] + ', ' + (loc.display_name.split(',')[1]||''), mapLink: googleMapsUrl});
                         setLocationResults([]); setLocationSearchQuery('');
                      }} className="p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer text-sm font-medium text-gray-700">
                         {loc.display_name}
                      </div>
                   ))}
                </div>
             )}

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Selected Venue Name</label>
                   <input required type="text" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-white font-bold text-[#4A3B32]" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Google Maps Link</label>
                   <input type="text" value={newEvent.mapLink} onChange={e => setNewEvent({...newEvent, mapLink: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-gray-100 text-gray-500 text-xs truncate" readOnly />
                </div>
             </div>
          </div>

          <div className="bg-green-50/30 p-6 rounded-2xl border border-green-100 space-y-4">
             <h3 className="font-bold text-[#4A3B32] flex items-center gap-2"><QrCode size={18} className="text-green-600"/> 3. Ticketing & Direct UPI</h3>
             <p className="text-xs text-gray-500 font-medium">Set a price and provide your UPI ID. We generate a QR code for buyers to pay you directly. 0% Commission.</p>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Ticket Price (₹)</label>
                   <input type="number" placeholder="Leave 0 for Free Event" value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-400 outline-none bg-white font-medium" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Your UPI ID</label>
                   <input type="text" placeholder="e.g., phone@paytm" value={newEvent.upiId} onChange={e => setNewEvent({...newEvent, upiId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-400 outline-none bg-white font-medium" />
                </div>
             </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
             <h3 className="font-bold text-[#4A3B32] flex items-center gap-2"><ImageIcon size={18}/> 4. Vibe & Aesthetics</h3>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Category / Vibe</label>
                   <select value={newEvent.vibe} onChange={e => setNewEvent({...newEvent, vibe: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-white font-medium">
                     {vibes.filter(v => v !== 'All').map(v => (<option key={v} value={v}>{v}</option>))}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Cover Image URL</label>
                   <input type="url" placeholder="Paste Unsplash or Image link..." value={newEvent.imageUrl} onChange={e => setNewEvent({...newEvent, imageUrl: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-white text-sm" />
                </div>
             </div>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea required rows="4" placeholder="What should guests expect?" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-white font-medium resize-none"></textarea>
             </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#4A3B32] text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl disabled:opacity-50">
            {isSubmitting ? 'Publishing Event...' : '🚀 Publish Event Live'}
          </button>
        </form>
      </div>
    );
  };

  const renderAdmin = () => {
    if (userRole !== 'admin') return <div className="p-20 text-center font-bold text-xl text-red-500">Access Denied. Admins Only.</div>;

    return (
      <div className="max-w-6xl mx-auto w-full px-4 space-y-8 pb-20 animate-in fade-in duration-500 mt-8">
        <div className="bg-[#4A3B32] rounded-3xl p-8 text-white shadow-xl flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><ShieldAlert size={28} className="text-[#D48847]"/> Admin Command Center</h1>
            <p className="text-[#F3E8D8]">Manage events, photos, and platform settings globally.</p>
          </div>
        </div>

        {}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
           <h2 className="text-xl font-bold text-[#4A3B32] mb-4 flex items-center gap-2"><Megaphone size={20}/> Global Advertisement Banner</h2>
           <p className="text-sm text-gray-500 mb-6">Display a clickable promo banner directly below the main header on the homepage.</p>
           
           <form onSubmit={handleAdUpdate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ad Image URL</label>
                    <input type="url" placeholder="https://imgur.com/your-ad-image.jpg" value={adForm.imageUrl} onChange={e => setAdForm({...adForm, imageUrl: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-gray-50 focus:ring-2 focus:ring-[#D48847]" />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Click Link (Target URL)</label>
                    <input type="url" placeholder="https://link-to-sponsor-or-event.com" value={adForm.linkUrl} onChange={e => setAdForm({...adForm, linkUrl: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none bg-gray-50 focus:ring-2 focus:ring-[#D48847]" />
                 </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                 <input type="checkbox" id="adToggle" checked={adForm.isActive} onChange={e => setAdForm({...adForm, isActive: e.target.checked})} className="w-5 h-5 text-[#D48847] focus:ring-[#D48847] rounded cursor-pointer" />
                 <label htmlFor="adToggle" className="font-bold text-gray-700 cursor-pointer">Activate Ad on Homepage</label>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#D48847] text-white py-3 rounded-xl font-bold hover:bg-[#b5733b] transition-colors shadow-md">
                 {isSubmitting ? 'Saving...' : 'Save Ad Settings'}
              </button>
           </form>
        </div>

        {/* URL Based Platform Branding (No Storage Needed) */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
           <div>
              <h2 className="text-xl font-bold text-[#4A3B32] mb-1 flex items-center gap-2"><UploadCloud size={20}/> Platform Branding</h2>
              <p className="text-sm text-gray-500">Paste an image URL (e.g., from Imgur) to instantly update the logo globally.</p>
           </div>
           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                <Logo size={40} />
              </div>
              <div className="flex w-full gap-2">
                 <input type="url" placeholder="https://..." value={newLogoUrl} onChange={e => setNewLogoUrl(e.target.value)} className="w-full md:w-64 px-4 py-2 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50" />
                 <button onClick={handleLogoUpdate} disabled={!newLogoUrl || isSubmitting} className="bg-[#D48847] hover:bg-[#b5733b] text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">Save</button>
              </div>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* URL Based Memory Wall Panel */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-[#4A3B32] mb-4 flex items-center gap-2"><Camera size={20}/> Post to Memory Wall</h2>
            <form onSubmit={handleMemorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Title / Description</label>
                <input required type="text" placeholder="e.g., Epic Saturday Jam!" value={newMemory.title} onChange={e => setNewMemory({...newMemory, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none bg-gray-50" />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Link Type</label>
                    <select value={newMemory.type} onChange={e => setNewMemory({...newMemory, type: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none bg-white">
                      <option value="image">Image / Photo</option>
                      <option value="video">YouTube Video</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Direct URL Link</label>
                    <input required type="url" placeholder="https://..." value={newMemory.url} onChange={e => setNewMemory({...newMemory, url: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none bg-white" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic font-medium">For photos, upload to a free site like Imgur.com and paste the link. For videos, paste any YouTube link.</p>
              </div>
              
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#4A3B32] text-white py-3 rounded-xl font-bold hover:bg-black transition-colors shadow-md">
                {isSubmitting ? 'Publishing...' : 'Publish to Home Page'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-auto md:h-[530px]">
            <h2 className="text-xl font-bold text-[#4A3B32] mb-4">Manage Memory Wall</h2>
            <div className="overflow-y-auto flex-1 pr-2 space-y-3">
              {memories.map(mem => (
                <div key={mem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {mem.type === 'video' ? <PlayCircle size={24} className="text-red-500 shrink-0"/> : <ImageIcon size={24} className="text-blue-500 shrink-0"/>}
                    <span className="font-bold text-sm truncate">{mem.title || 'Untitled'}</span>
                  </div>
                  <button onClick={() => safeDeleteMemory(mem.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
              {memories.length === 0 && <p className="text-gray-400 text-sm italic">No memories posted yet.</p>}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <h2 className="text-xl font-bold text-[#4A3B32] mb-4 flex items-center gap-2"><Ticket size={20}/> Global Event Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-bold">
                <tr>
                  <th className="p-4 rounded-tl-xl">Event Title</th>
                  <th className="p-4">Host</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Attendees</th>
                  <th className="p-4 rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-[#4A3B32]">{event.title || 'Untitled'}</td>
                    <td className="p-4 text-gray-600">{event.host || 'Unknown'}</td>
                    <td className="p-4 text-gray-600">{event.date}</td>
                    <td className="p-4 font-bold text-[#D48847]">{event.attendees?.length || 0}</td>
                    <td className="p-4">
                      <button onClick={() => safeDeleteEvent(event.id)} className="text-red-500 hover:text-red-700 font-bold bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Trash2 size={14}/> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && <p className="text-gray-400 text-sm italic p-4">No active events.</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans selection:bg-[#D48847] selection:text-white flex flex-col relative">
      <nav className={`fixed w-full z-40 transition-all duration-300 ${currentView === 'home' ? 'bg-[#FDFBF7]/90 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-white border-b border-gray-100 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('home')}>
              <Logo size={40} />
              <span className="font-bold text-2xl text-[#4A3B32] tracking-tight group-hover:text-[#D48847] transition-colors hidden sm:block">Funfinity</span>
            </div>
            
            <div className="hidden md:flex items-center gap-2 bg-gray-50/80 p-1 rounded-full border border-gray-100 shadow-inner">
              <button onClick={() => setCurrentView('home')} className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${currentView === 'home' ? 'bg-white shadow-sm text-[#4A3B32]' : 'text-gray-500 hover:text-[#4A3B32]'}`}>Story</button>
              <button onClick={() => setCurrentView('discover')} className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${currentView === 'discover' ? 'bg-white shadow-sm text-[#4A3B32]' : 'text-gray-500 hover:text-[#4A3B32]'}`}>Marketplace</button>
              <button onClick={() => setCurrentView('create')} className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${currentView === 'create' ? 'bg-white shadow-sm text-[#4A3B32]' : 'text-gray-500 hover:text-[#4A3B32]'}`}>Host Experience</button>
              {userRole === 'admin' && (
                <button onClick={() => setCurrentView('admin')} className={`px-5 py-2 rounded-full font-bold text-sm transition-all bg-purple-100 text-purple-700 shadow-sm flex items-center gap-1`}>
                  <ShieldAlert size={14}/> Admin
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <a href="mailto:tilakdongare064@gmail.com" className="hidden lg:flex items-center gap-2 bg-[#F3E8D8] text-[#4A3B32] px-4 py-2 rounded-full font-bold text-sm hover:bg-[#D48847] hover:text-white transition-colors shadow-sm">
                <MessageCircle size={16} /> Contact Us
              </a>
              {user && !user.isAnonymous ? (
                <div className="flex items-center gap-3">
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2" title="Log Out"><LogOut size={20}/></button>
                  <div className="w-10 h-10 rounded-full bg-[#D48847] flex items-center justify-center text-white font-bold border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform" title={user.email}>
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
              ) : (
                <button onClick={() => openAuthModal()} className="bg-[#4A3B32] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-black transition-all shadow-md hover:-translate-y-0.5">
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow w-full flex flex-col items-center pt-20 pb-safe">
        {currentView === 'home' && renderHome()}
        {currentView === 'discover' && renderDiscover()}
        {currentView === 'create' && renderCreateEvent()}
        {currentView === 'admin' && renderAdmin()}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 flex justify-around p-2 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'home' ? 'text-[#D48847]' : 'text-gray-400 hover:text-gray-600'}`}>
          <Home size={22} strokeWidth={currentView === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">Story</span>
        </button>
        <button onClick={() => setCurrentView('discover')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'discover' ? 'text-[#D48847]' : 'text-gray-400 hover:text-gray-600'}`}>
          <Search size={22} strokeWidth={currentView === 'discover' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">Explore</span>
        </button>
        <button onClick={() => setCurrentView('create')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'create' ? 'text-[#D48847]' : 'text-gray-400 hover:text-gray-600'}`}>
          <PlusCircle size={22} strokeWidth={currentView === 'create' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">Host</span>
        </button>
        <button onClick={() => (!user || user.isAnonymous) && openAuthModal()} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${user && !user.isAnonymous ? 'text-[#D48847]' : 'text-gray-400 hover:text-gray-600'}`}>
          <User size={22} strokeWidth={user && !user.isAnonymous ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">{user && !user.isAnonymous ? 'Profile' : 'Sign In'}</span>
        </button>
      </div>

      <footer className="w-full border-t border-[#F3E8D8] bg-white pt-16 pb-24 md:pb-12 text-center mt-auto z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex justify-center mb-6 cursor-pointer hover:scale-110 transition-transform" onClick={() => setCurrentView('home')}>
             <Logo size={60} />
          </div>
          <h3 className="text-2xl font-bold text-[#4A3B32] mb-2">Have questions or want to partner?</h3>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto font-medium">We are always looking for amazing venues, hosts, and community members to join the Funfinity family.</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
             <a href="https://chat.whatsapp.com/KNHPGQzwqtr4nWBIQcZyXH" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:-translate-y-1 transition-all">
               <i className="fab fa-whatsapp text-xl"></i> Join WhatsApp Community
             </a>
             <a href="mailto:tilakdongare064@gmail.com" className="inline-flex items-center justify-center gap-3 bg-[#4A3B32] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:-translate-y-1 transition-all">
               <MessageCircle size={20} /> Email the Founder
             </a>
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <Logo size={40} />
                <button onClick={() => setShowAuthModal(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors"><XCircle size={24} /></button>
              </div>
              <h2 className="text-3xl font-bold text-[#4A3B32] mb-2">Join the Club</h2>
              <p className="text-gray-500 font-medium mb-6">Sign in with Google to book tickets, save your favorite venues, and host events instantly.</p>

              <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-4 px-4 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-lg">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                Continue with Google
              </button>
              
              {authError && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg text-center mt-4">{authError}</p>}
            </div>
          </div>
        </div>
      )}

      {showGuestModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-xl text-[#4A3B32]">Guest Checkout</h3>
              <button onClick={() => setShowGuestModal(null)} className="text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Enter your details below to receive your ticket via WhatsApp.</p>
            
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <input type="text" required placeholder="Full Name" value={guestForm.name} onChange={e => setGuestForm({...guestForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50" />
              <input type="tel" required placeholder="WhatsApp Number" value={guestForm.phone} onChange={e => setGuestForm({...guestForm, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50" />
              
              <button type="submit" className="w-full bg-[#4A3B32] text-white font-bold py-3 rounded-xl hover:bg-black transition-all shadow-md mt-4">
                Proceed to Booking
              </button>
              <button type="button" onClick={() => { setShowGuestModal(null); openAuthModal(); }} className="w-full text-[#D48847] font-bold py-2 text-sm hover:underline">
                Wait, I want to Login instead
              </button>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-[#4A3B32] p-6 text-center text-white relative">
              <button onClick={() => setShowPaymentModal(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><XCircle size={24}/></button>
              <h3 className="font-bold text-xl mb-1">Complete Booking</h3>
              <p className="text-[#D48847] text-sm">{showPaymentModal.event.title}</p>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="text-3xl font-bold text-[#4A3B32] mb-4">₹{showPaymentModal.event.price}</div>
              
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-4 w-full flex flex-col items-center">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Scan to Pay via any UPI App</p>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${showPaymentModal.event.upiId}&pn=${encodeURIComponent(showPaymentModal.event.host)}&tn=${encodeURIComponent('Ticket')}&am=${showPaymentModal.event.price}&cu=INR`)}`} alt="UPI QR Code" className="w-40 h-40 rounded-xl shadow-sm bg-white p-2 border border-gray-100" />
                <p className="text-sm font-medium text-[#4A3B32] mt-3">UPI ID: <span className="font-bold">{showPaymentModal.event.upiId}</span></p>
              </div>

              <div className="w-full space-y-3">
                <button onClick={() => completeRSVP(showPaymentModal.event.id, showPaymentModal.attendeeData)} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 transition-all flex justify-center items-center gap-2 shadow-md">
                  <CheckCircle size={20} /> I have made the payment
                </button>
                <p className="text-xs text-center text-gray-400">Your payment will be verified by the host.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-xl text-[#4A3B32] mb-2">{confirmModal.title}</h3>
            <p className="text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmModal(null)} className="flex-1 bg-gray-100 text-[#4A3B32] py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={confirmModal.onConfirm} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-20 md:bottom-10 right-4 z-[200] px-6 py-3 rounded-full shadow-xl font-bold text-white text-sm flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.type === 'error' ? <ShieldAlert size={18}/> : <CheckCircle size={18}/>}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
