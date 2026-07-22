import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { MapPin, Calendar, Users, PlusCircle, Home, ShieldCheck, Search, Camera, MessageCircle, Info, Map as MapIcon, Navigation, Coffee, Sparkles, User, LogOut, Settings, CheckCircle, XCircle, QrCode, Image as ImageIcon, Megaphone, Edit3, Lock, Ticket, MapPinned } from 'lucide-react';

/* ============================================================================
   🔥 PASTE YOUR FIREBASE CONFIG HERE FOR GITHUB PAGES TO MAKE IT LIVE
   ============================================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyBJQGM2mJpGkbJFTH9KiqAr3MQff9VJr_Y",
  authDomain: "funfinity-28521.firebaseapp.com",
  projectId: "funfinity-28521",
  storageBucket: "funfinity-28521.firebasestorage.app",
  messagingSenderId: "493685480978",
  appId: "1:493685480978:web:8b979f65956217e84fc2cb"
};

// We check if it's running in the sandbox context first, otherwise fallback to your live config
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : myFirebaseConfig;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'funfinity-production';
const ADMIN_EMAIL = 'tilakdongare064@gmail.com';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export default function FunfinityApp() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('guest'); 
  const [events, setEvents] = useState([]);
  const [currentView, setCurrentView] = useState('home'); 
  const [loading, setLoading] = useState(true);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  
  const [showPaymentModal, setShowPaymentModal] = useState(null); 
  const [showGuestModal, setShowGuestModal] = useState(null);
  const [guestForm, setGuestForm] = useState({ name: '', phone: '' });

  const [activeVibeFilter, setActiveVibeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [announcement, setAnnouncement] = useState("✨ Welcome to Funfinity! The ultimate social club in Belagavi. Join our WhatsApp group!");
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);

  const vibes = ['All', 'Chill', 'High Energy', 'Deep Conversations', 'Creative', 'Food & Drink'];

  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '', date: '', time: '', venue: '', mapLink: '', price: '', upiId: '', description: '', vibe: 'Chill', imageUrl: ''
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email === ADMIN_EMAIL) {
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
    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const unsubscribeEvents = onSnapshot(eventsRef, (snapshot) => {
      const fetchedEvents = [];
      snapshot.forEach(doc => fetchedEvents.push({ id: doc.id, ...doc.data() }));
      // Sort by creation time newest first
      setEvents(fetchedEvents.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });
    return () => unsubscribeEvents();
  }, [user]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      } else {
        await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
      }
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '' });
    } catch (err) {
      setAuthError(err.message.replace('Firebase:', '').trim());
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(err.message.replace('Firebase:', '').trim());
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    // Fall back to anonymous for browsing
    await signInAnonymously(auth); 
    setCurrentView('home');
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
    }
    setIsSearchingLocation(false);
  };

  const initiateRSVP = (event) => {
    const isAttending = event.attendees?.some(a => a.uid === user?.uid);
    if (isAttending) {
      // Logic to cancel RSVP would go here
      alert("You are already booked for this event!");
      return;
    } 
    
    // Check if user is anonymous (needs to login or use guest checkout)
    if (!user || user.isAnonymous) {
      setShowGuestModal(event);
      return;
    }

    // Authenticated user
    if (event.price && parseInt(event.price) > 0 && event.upiId) {
      setShowPaymentModal({ event, attendeeData: { uid: user.uid, name: user.displayName || user.email || 'Verified User', type: 'user' } });
    } else {
      completeRSVP(event.id, { uid: user.uid, name: user.displayName || user.email || 'Verified User', type: 'user' });
    }
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    const event = showGuestModal;
    const attendeeData = {
      uid: 'guest-' + Date.now(),
      name: guestForm.name,
      phone: guestForm.phone,
      type: 'guest'
    };
    
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
      await updateDoc(eventRef, {
        attendees: arrayUnion(attendeeData)
      });
      setShowPaymentModal(null);
      setGuestForm({ name: '', phone: '' });
      alert("Successfully booked! Check your WhatsApp/Email for details.");
    } catch (err) {
      console.error("RSVP failed", err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId));
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const Logo = ({ size = 45 }) => (
    <svg width={size} height={size * 0.88} viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" className="transform hover:scale-105 transition-transform duration-300 shrink-0">
      <path d="M 28 45 C 10 45, 10 15, 28 15 C 45 15, 55 45, 72 45 C 90 45, 90 15, 72 15 C 55 15, 45 45, 28 45 Z" fill="none" stroke="#D48847" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="30" r="4.5" fill="#4A3B32" />
      <circle cx="72" cy="30" r="4.5" fill="#4A3B32" />
      <path d="M 32 60 Q 50 78 68 60" fill="none" stroke="#D48847" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );

  const renderHome = () => (
    <div className="w-full bg-[#FDFBF7] animate-in fade-in duration-500">
      
      {/* Admin Announcement Bar */}
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

        <div className="z-10 max-w-5xl mx-auto flex flex-col items-center">
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
            <button onClick={() => { userRole !== 'guest' ? setCurrentView('profile') : setShowAuthModal(true) }} className="bg-white text-[#4A3B32] border-2 border-[#F3E8D8] px-8 py-4 rounded-full font-bold text-lg hover:border-[#D48847] hover:bg-orange-50 transition-all shadow-sm flex items-center justify-center gap-2">
              <User size={20} /> {userRole !== 'guest' ? 'My Dashboard' : 'Join the Club'}
            </button>
          </div>

          {/* Social Proof & Vibe Wall */}
          <div className="w-full max-w-4xl mx-auto border-t border-gray-200 pt-10">
             <div className="flex items-center justify-center gap-2 mb-8">
                <i className="fab fa-instagram text-xl text-[#D48847]"></i>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Our Vibe Wall @funfinity.social</p>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <img src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" className="rounded-2xl h-48 w-full object-cover shadow-sm hover:scale-105 transition-transform duration-300" alt="Vibe 1"/>
                <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" className="rounded-2xl h-48 w-full object-cover shadow-sm hover:scale-105 transition-transform duration-300 md:-translate-y-4" alt="Vibe 2"/>
                <img src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" className="rounded-2xl h-48 w-full object-cover shadow-sm hover:scale-105 transition-transform duration-300 md:translate-y-4" alt="Vibe 3"/>
                <img src="https://images.unsplash.com/photo-1543807535-eceef0bc6599?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" className="rounded-2xl h-48 w-full object-cover shadow-sm hover:scale-105 transition-transform duration-300" alt="Vibe 4"/>
             </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderDiscover = () => {
    const filteredEvents = events.filter(e => {
      const matchesVibe = activeVibeFilter === 'All' || e.vibe === activeVibeFilter;
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.venue.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesVibe && matchesSearch;
    });

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Marketplace Header & Search */}
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
              const isAttending = event.attendees?.some(a => a.uid === user?.uid);
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
                    
                    <h3 className="text-2xl font-bold text-[#4A3B32] mb-2 leading-tight">{event.title}</h3>
                    
                    <div className="flex items-start gap-2 text-sm text-gray-500 mb-4 font-medium line-clamp-2">
                      <MapPin size={16} className="shrink-0 mt-0.5 text-[#D48847]" /> 
                      <a href={event.mapLink || '#'} target="_blank" rel="noreferrer" className="hover:underline hover:text-[#D48847]">{event.venue}</a>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-6 line-clamp-2 flex-grow">{event.description}</p>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-[#D48847]">
                          {(event.host || 'H')[0].toUpperCase()}
                        </div>
                        <div className="text-xs">
                          <div className="font-bold text-[#4A3B32] flex items-center gap-1">{event.host} <ShieldCheck size={10} className="text-blue-500"/></div>
                          <div className="text-gray-400 font-medium">{event.attendees?.length || 0} attending</div>
                        </div>
                      </div>
                      
                      {userRole === 'admin' ? (
                        <button onClick={() => handleDeleteEvent(event.id)} className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 px-3 py-1 rounded-md">Delete Event</button>
                      ) : isHost ? (
                        <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm">Managing</span>
                      ) : isAttending ? (
                        <button className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1 border border-green-200">
                           <Ticket size={16} /> Booked
                        </button>
                      ) : (
                        <button onClick={() => initiateRSVP(event)} className="bg-[#4A3B32] hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2">
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
    // Only Admin or Verified Users can create events automatically. 
    // For this app, we will let logged-in users access the form, but prompt guests to login.
    if (!user || user.isAnonymous) {
      return (
        <div className="py-24 text-center max-w-lg mx-auto px-4">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <ShieldCheck size={48} className="text-blue-500" />
          </div>
          <h2 className="text-3xl font-bold text-[#4A3B32] mb-4">Host Verification Required</h2>
          <p className="text-gray-500 mb-8 font-medium">To maintain the highest quality and safety for the Funfinity community, all hosts must log in to create events.</p>
          <button onClick={() => setShowAuthModal(true)} className="bg-[#4A3B32] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-black transition-all transform hover:-translate-y-1 w-full">
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
        host: user.displayName || user.email?.split('@')[0] || 'Verified Host',
        attendees: [],
        createdAt: Date.now()
      };

      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), eventData);
        setCurrentView('discover');
        setNewEvent({ title: '', date: '', time: '', venue: '', mapLink: '', price: '', upiId: '', description: '', vibe: 'Chill', imageUrl: '' });
      } catch (err) {
        console.error("Failed to create event", err);
        alert("Failed to create event. Please ensure Firebase is configured.");
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
                  {isSearchingLocation ? 'Searching...' : 'Search Maps'}
                </button>
             </div>
             
             {locationResults.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden z-10">
                   {locationResults.map((loc, idx) => (
                      <div key={idx} onClick={() => {
                         // Generate standard Google Maps Link
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
             <p className="text-xs text-gray-500 font-medium">Set a price and provide your UPI ID. We automatically generate a QR code for buyers to pay you directly. 0% Commission.</p>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Ticket Price (₹)</label>
                   <input type="number" placeholder="Leave 0 for Free Event" value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-400 outline-none bg-white font-medium" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Your UPI ID</label>
                   <input type="text" placeholder="e.g., phone@paytm or name@okicici" value={newEvent.upiId} onChange={e => setNewEvent({...newEvent, upiId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-400 outline-none bg-white font-medium" />
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
                   <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
                   <input type="url" placeholder="Paste Unsplash or Image link..." value={newEvent.imageUrl} onChange={e => setNewEvent({...newEvent, imageUrl: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-white text-sm" />
                   <p className="text-[10px] text-gray-400 mt-1">*To fetch auto-photos from Maps requires Paid Google API. Paste free links here.</p>
                </div>
             </div>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea required rows="4" placeholder="What should guests expect?" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-white font-medium resize-none"></textarea>
             </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#4A3B32] text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0">
            {isSubmitting ? 'Publishing Event...' : '🚀 Publish Event Live'}
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans selection:bg-[#D48847] selection:text-white flex flex-col">
      <nav className={`fixed w-full z-40 transition-all duration-300 ${currentView === 'home' ? 'bg-[#FDFBF7]/80 backdrop-blur-md border-b border-transparent' : 'bg-white border-b border-gray-100 shadow-sm'}`}>
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
            </div>

            <div className="flex items-center gap-3">
              <a href="mailto:tilakdongare064@gmail.com" className="hidden lg:flex items-center gap-2 bg-[#F3E8D8] text-[#4A3B32] px-4 py-2 rounded-full font-bold text-sm hover:bg-[#D48847] hover:text-white transition-colors shadow-sm">
                <MessageCircle size={16} /> Contact Us
              </a>
              {user && !user.isAnonymous ? (
                <div className="flex items-center gap-3">
                  {userRole === 'admin' && (
                    <span className="hidden sm:flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-bold text-xs border border-purple-200">
                      <Settings size={14} /> Admin
                    </span>
                  )}
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2"><LogOut size={20}/></button>
                  <div className="w-10 h-10 rounded-full bg-[#D48847] flex items-center justify-center text-white font-bold border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="bg-[#4A3B32] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-black transition-all shadow-md hover:-translate-y-0.5">
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
      </main>

      {/* Mobile Bottom Navigation */}
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
        <button onClick={() => (!user || user.isAnonymous) && setShowAuthModal(true)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${user && !user.isAnonymous ? 'text-[#D48847]' : 'text-gray-400 hover:text-gray-600'}`}>
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

      {}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <Logo size={40} />
                <button onClick={() => setShowAuthModal(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors"><XCircle size={24} /></button>
              </div>
              <h2 className="text-3xl font-bold text-[#4A3B32] mb-2">Join the Club</h2>
              <p className="text-gray-500 font-medium mb-8">Sign in to book tickets, save your favorite venues, and host events.</p>
              
              <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-bold py-4 px-4 rounded-xl hover:bg-gray-50 transition-all mb-4 shadow-sm text-lg">
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
              <button type="button" onClick={() => { setShowGuestModal(null); setShowAuthModal(true); }} className="w-full text-[#D48847] font-bold py-2 text-sm">
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
    </div>
  );
}
