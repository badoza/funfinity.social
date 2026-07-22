import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { MapPin, Calendar, Users, PlusCircle, Home, ShieldCheck, Search, ShieldAlert, Camera, Star, MessageCircle, Navigation, Coffee, Sparkles, Youtube, Image as ImageIcon, Video, LogOut, Settings, LayoutDashboard } from 'lucide-react';

// Your EXACT Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJQGM2mJpGkbJFTH9KiqAr3MQff9VJr_Y",
  authDomain: "funfinity-28521.firebaseapp.com",
  projectId: "funfinity-28521",
  storageBucket: "funfinity-28521.firebasestorage.app",
  messagingSenderId: "493685480978",
  appId: "1:493685480978:web:8b979f65956217e84fc2cb",
  measurementId: "G-9DEDTCBXL0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// HARDCODED SUPER ADMINS
const SUPER_ADMINS = ['tilakdongare064@gmail.com', 'dodge.kunal@gmail.com'];

export default function FunfinityApp() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('guest'); // 'guest', 'user', 'admin'
  const [events, setEvents] = useState([]);
  const [memories, setMemories] = useState([]);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'discover', 'venues', 'create', 'add-venue', 'admin'
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeVibeFilter, setActiveVibeFilter] = useState('All');
  const [activeCityFilter, setActiveCityFilter] = useState('All India');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const cities = ['All India', 'Belagavi', 'Bengaluru', 'Mumbai', 'Goa', 'Delhi', 'Pune'];
  const vibes = ['All', 'Chill', 'High Energy', 'Deep Conversations', 'Creative'];

  // Forms State
  const [newEvent, setNewEvent] = useState({
    title: '', date: '', time: '', venue: '', price: '', description: '', vibe: 'Chill', imageUrl: ''
  });
  
  const [newMemory, setNewMemory] = useState({
    title: '', url: '', type: 'image' // 'image' or 'youtube'
  });

  const panIndiaVenues = [
    { id: 1, name: "La Casa Cafe", city: "Belagavi", type: "Cozy Cafe", capacity: "60+", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rating: 4.8 },
    { id: 2, name: "The Bombay Canteen", city: "Mumbai", type: "Restaurant & Bar", capacity: "150+", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rating: 4.8 },
    { id: 3, name: "Thalassa", city: "Goa", type: "Beachfront Lounge", capacity: "200+", image: "https://images.unsplash.com/photo-1515515535567-c205391e4db9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rating: 4.9 },
  ];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        if (SUPER_ADMINS.includes(currentUser.email)) {
          setUserRole('admin');
        } else {
          setUserRole('user');
        }
      } else {
        setUserRole('guest');
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Safely fetch Events
    const eventsRef = collection(db, 'events');
    const unsubscribeEvents = onSnapshot(eventsRef, (snapshot) => {
      const eventsData = [];
      snapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setLoading(false);
    }, (error) => {
      console.error("Events fetch error:", error);
      setLoading(false);
    });

    // Safely fetch Memories
    const memoriesRef = collection(db, 'memories');
    const unsubscribeMemories = onSnapshot(memoriesRef, (snapshot) => {
      const memData = [];
      snapshot.forEach((doc) => {
        memData.push({ id: doc.id, ...doc.data() });
      });
      setMemories(memData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }, (error) => {
      console.error("Memories fetch error:", error);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeMemories();
    };
  }, []);

  // Animation Observer for smooth scrolling reveals
  useEffect(() => {
    if (currentView === 'home') {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-8');
          }
        });
      }, { threshold: 0.1 });

      const revealElements = document.querySelectorAll('.reveal');
      revealElements.forEach((el) => observer.observe(el));

      return () => revealElements.forEach((el) => observer.unobserve(el));
    }
  }, [currentView]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setAuthModalOpen(false);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed or was cancelled.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('home');
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') return; 
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'events'), {
        ...newEvent,
        imageUrl: newEvent.imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        hostId: user.uid,
        hostEmail: user.email,
        attendees: [],
        createdAt: Date.now()
      });
      setCurrentView('discover');
      setNewEvent({ title: '', date: '', time: '', venue: '', price: '', description: '', vibe: 'Chill', imageUrl: '' });
    } catch (error) {
      console.error("Error adding event: ", error);
    }
    setIsSubmitting(false);
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (userRole !== 'admin') return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'memories'), {
        ...newMemory,
        addedBy: user.email,
        createdAt: Date.now()
      });
      setNewMemory({ title: '', url: '', type: 'image' });
      alert("Memory successfully added to the Homepage!");
    } catch (error) {
      console.error("Error adding memory: ", error);
    }
    setIsSubmitting(false);
  };

  const handleRSVP = async (eventId) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, { attendees: arrayUnion(user.uid) });
    } catch (error) {
      console.error("Error RSVPing: ", error);
    }
  };

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const Logo = ({ size = 45 }) => (
    <svg width={size} height={size * 0.88} viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" className="transform hover:scale-105 transition-transform duration-300 shrink-0">
      <path d="M 28 45 C 10 45, 10 15, 28 15 C 45 15, 55 45, 72 45 C 90 45, 90 15, 72 15 C 55 15, 45 45, 28 45 Z" fill="none" stroke="#D48847" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="30" r="4.5" fill="#4A3B32" />
      <circle cx="72" cy="30" r="4.5" fill="#4A3B32" />
      <path d="M 32 60 Q 50 78 68 60" fill="none" stroke="#D48847" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );

  const renderAdminDashboard = () => {
    if (userRole !== 'admin') {
      return (
        <div className="py-24 text-center">
          <ShieldAlert className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-gray-500">You must be a Super Admin to view this page.</p>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto w-full px-4 mt-8 pb-24 animate-in fade-in">
        <div className="bg-[#4A3B32] rounded-3xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <LayoutDashboard size={120} />
          </div>
          <h1 className="text-3xl font-bold mb-2 relative z-10">Super Admin Command Center</h1>
          <p className="text-[#F3E8D8] relative z-10 flex items-center gap-2">
            <ShieldCheck size={18} className="text-green-400"/> Welcome, {user.email}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-[#F3E8D8] shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#D48847]/10 text-[#D48847] rounded-full flex items-center justify-center">
              <Camera size={20} />
            </div>
            <h2 className="text-2xl font-bold text-[#4A3B32]">Post to Memory Wall</h2>
          </div>
          <p className="text-gray-500 mb-6 text-sm">Add a YouTube video link or an Image URL. This will instantly appear on the public Homepage.</p>
          
          <form onSubmit={handleAddMemory} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#4A3B32] mb-1">Memory Title</label>
                <input required type="text" placeholder="e.g., Epic Weekend at La Casa" value={newMemory.title} onChange={e => setNewMemory({...newMemory, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#4A3B32] mb-1">Media Type</label>
                <select value={newMemory.type} onChange={e => setNewMemory({...newMemory, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white transition-all">
                  <option value="image">Image / Photo (Direct Link)</option>
                  <option value="youtube">YouTube Video</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[#4A3B32] mb-1">Media URL</label>
              <input required type="url" placeholder={newMemory.type === 'youtube' ? "https://youtube.com/watch?v=..." : "https://imgur.com/... / https://...jpg"} value={newMemory.url} onChange={e => setNewMemory({...newMemory, url: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-[#D48847] text-white py-4 rounded-xl font-bold hover:bg-[#4A3B32] transition-colors disabled:opacity-50 shadow-md flex items-center justify-center gap-2 mt-4">
              <Sparkles size={20} /> {isSubmitting ? 'Publishing...' : 'Publish to Homepage'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderCreateEvent = () => {
    // LOCKDOWN: Only Admins can see the creation form.
    if (userRole !== 'admin') {
      return (
        <div className="py-32 text-center max-w-lg mx-auto px-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-orange-100">
             <ShieldAlert size={48} className="text-orange-500" />
          </div>
          <h2 className="text-3xl font-bold text-[#4A3B32] mb-4">Verification Required</h2>
          <p className="text-gray-500 mb-8 font-medium">To maintain the highest quality and safety for the Funfinity community, all hosts must be manually verified. Please contact the Funfinity team to get your creator account approved!</p>
          <a href="mailto:tilakdongare064@gmail.com" className="bg-[#4A3B32] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-black transition-all inline-flex items-center justify-center gap-2 hover:-translate-y-1">
            <MessageCircle size={20} /> Contact Admin
          </a>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto w-full bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-[#F3E8D8] animate-in slide-in-from-bottom-8 duration-500 pb-24 md:pb-10 mt-8">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-bold text-[#4A3B32] mb-2">Host an Event</h2>
          <p className="text-gray-500 text-sm font-medium">You are verified as an Admin. Events created here will be instantly published.</p>
        </div>
        
        <form onSubmit={handleCreateEvent} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#4A3B32] mb-1">Event Title</label>
            <input required type="text" placeholder="e.g., Acoustic Campfire Jam" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none transition-shadow bg-gray-50 focus:bg-white" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#4A3B32] mb-1">Date</label>
              <input required type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#4A3B32] mb-1">Time</label>
              <input required type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#4A3B32] mb-1">Venue Name</label>
              <input required type="text" placeholder="e.g., La Casa Cafe" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#4A3B32] mb-1">Price (₹)</label>
              <input type="number" placeholder="Leave empty if Free" value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold text-[#4A3B32] mb-1">Vibe</label>
                <select value={newEvent.vibe} onChange={e => setNewEvent({...newEvent, vibe: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white">
                  {vibes.filter(v => v !== 'All').map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
             </div>
             <div>
                <label className="block text-sm font-bold text-[#4A3B32] mb-1">Cover Image URL</label>
                <input type="url" placeholder="https://..." value={newEvent.imageUrl} onChange={e => setNewEvent({...newEvent, imageUrl: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white" />
             </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#4A3B32] mb-1">Description</label>
            <textarea required rows="3" placeholder="What is this event about?" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none transition-shadow bg-gray-50 focus:bg-white"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-[#4A3B32] text-white py-4 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
            <PlusCircle size={20} /> {isSubmitting ? 'Publishing...' : 'Publish Event Live'}
          </button>
        </form>
      </div>
    );
  };

  const renderHome = () => (
    <div className="w-full bg-[#FDFBF7]">
      {/* Hero Section */}
      <section 
        className="min-h-[90vh] flex items-center pt-20 relative bg-cover bg-center bg-fixed border-b border-[#D48847]/20"
        style={{ backgroundImage: "linear-gradient(rgba(74, 59, 50, 0.75), rgba(212, 136, 71, 0.65)), url('https://images.unsplash.com/photo-1543807535-eceef0bc6599?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
      >
        <div className="px-4 max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center z-10">
          <div className="text-left">
            <div className="reveal opacity-0 translate-y-8 transition-all duration-700 inline-block bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1 mb-6 shadow-sm">
              <span className="text-white text-sm font-semibold flex items-center gap-2">
                <MapPin size={14} className="text-[#D48847]" /> Belagavi's Premium Social Platform
              </span>
            </div>
            <h1 className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-100 text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Find Your Vibe.<br/><span className="text-[#D48847] drop-shadow-md">Find Your People.</span>
            </h1>
            <p className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-200 text-xl text-white/90 mb-8 font-medium max-w-lg">
              Discover local events, check out venue menus, book tickets, or host your own verified experiences. All in one app.
            </p>
            
            <div className="reveal opacity-0 translate-y-8 transition-all duration-700 delay-200 flex flex-wrap gap-4">
              <button onClick={() => setCurrentView('discover')} className="bg-[#D48847] text-white px-8 py-4 rounded-full font-bold hover:bg-[#4A3B32] transition-colors shadow-lg flex items-center gap-2 text-lg hover:-translate-y-1">
                <Search size={20} /> Discover Events
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: The Memory Wall Section */}
      {memories.length > 0 && (
        <section className="py-24 bg-white px-4 border-b border-[#F3E8D8]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 reveal opacity-0 translate-y-8 transition-all duration-700">
              <div>
                <div className="flex items-center gap-2 text-[#D48847] font-bold mb-2">
                  <Camera size={24} /> MEMORY WALL
                </div>
                <h2 className="text-4xl font-bold text-[#4A3B32]">Moments to Remember</h2>
                <p className="text-[#4A3B32]/70 mt-2">Highlights from recent Funfinity experiences.</p>
              </div>
            </div>

            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {memories.map((memory) => (
                <div key={memory.id} className="break-inside-avoid bg-[#FDFBF7] rounded-[2rem] overflow-hidden shadow-md border border-[#F3E8D8] group hover:shadow-xl transition-all duration-500">
                  {memory.type === 'youtube' && getYouTubeId(memory.url) ? (
                    <div className="relative pt-[56.25%] w-full">
                      <iframe 
                        src={`https://www.youtube.com/embed/${getYouTubeId(memory.url)}`} 
                        title={memory.title}
                        className="absolute top-0 left-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden group">
                      <img src={memory.url} alt={memory.title} className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-[#4A3B32] text-lg leading-tight flex items-start gap-2">
                      {memory.type === 'youtube' ? <Youtube className="text-red-500 shrink-0 mt-0.5" size={18}/> : <ImageIcon className="text-[#D48847] shrink-0 mt-0.5" size={18}/>}
                      {memory.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Events Section */}
      <section className="py-24 bg-[#FDFBF7] px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12 reveal opacity-0 translate-y-8 transition-all duration-700">
            <div>
              <h2 className="text-4xl font-bold text-[#4A3B32] mb-2">Trending in Belagavi</h2>
              <p className="text-[#4A3B32]/70">Discover experiences hosted by verified creators.</p>
            </div>
            <button onClick={() => setCurrentView('discover')} className="hidden sm:flex text-[#D48847] font-bold hover:underline items-center gap-1">
              View All Events <Sparkles size={16} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {events.slice(0, 3).map((event, index) => (
              <div key={event.id} className={`reveal opacity-0 translate-y-8 transition-all duration-700 delay-${index * 100} bg-white rounded-2xl overflow-hidden shadow-lg border border-[#F3E8D8] cursor-pointer group flex flex-col h-full`} onClick={() => setCurrentView('discover')}>
                <div className="relative overflow-hidden h-56 shrink-0">
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold shadow-sm flex items-center text-[#4A3B32]">
                    <Sparkles size={14} className="text-[#D48847] mr-1" /> Trending
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#D48847] mb-2 uppercase tracking-wide">
                    <Calendar size={14} /> {event.date} • {event.time}
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-[#D48847] transition-colors text-[#4A3B32]">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-[#4A3B32]/70 mb-4 font-medium">
                    <MapPin size={14} /> {event.venue}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#4A3B32] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        <ShieldCheck size={14} />
                      </div>
                      <div className="text-xs">
                        <div className="text-gray-500">Hosted by</div>
                        <div className="font-bold text-[#4A3B32]">Verified Admin</div>
                      </div>
                    </div>
                    <button className="bg-[#F3E8D8] text-[#4A3B32] px-4 py-2 rounded-lg font-bold text-sm">
                      {event.price && event.price !== "0" ? `₹${event.price}` : 'Free'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {events.length === 0 && (
              <div className="col-span-3 text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-[#4A3B32]">No upcoming events</h3>
                <p className="text-gray-500 mt-2">Check back later for new experiences.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans selection:bg-[#D48847] selection:text-white flex flex-col items-center">
      
      {/* Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setAuthModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
              ✕
            </button>
            <div className="text-center mb-6">
              <Logo size={60} />
              <h3 className="text-2xl font-bold text-[#4A3B32] mt-4">Welcome to Funfinity</h3>
              <p className="text-gray-500 text-sm mt-2">Sign in to book tickets, save events, and access creator features.</p>
            </div>
            
            <button onClick={handleGoogleLogin} className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 shadow-sm mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.81 15.73 17.58V20.35H19.3C21.38 18.43 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.3 20.35L15.73 17.58C14.73 18.25 13.48 18.66 12 18.66C9.13 18.66 6.71 16.73 5.84 14.13H2.15V16.99C4.05 20.76 7.82 23 12 23Z" fill="#34A853"/>
                <path d="M5.84 14.13C5.62 13.47 5.49 12.75 5.49 12C5.49 11.25 5.62 10.53 5.84 9.87V7.01H2.15C1.37 8.56 0.92 10.23 0.92 12C0.92 13.77 1.37 15.44 2.15 16.99L5.84 14.13Z" fill="#FBBC05"/>
                <path d="M12 5.34C13.62 5.34 15.06 5.9 16.2 6.99L19.38 3.81C17.45 2.01 14.96 0.92 12 0.92C7.82 0.92 4.05 3.24 2.15 7.01L5.84 9.87C6.71 7.27 9.13 5.34 12 5.34Z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">By continuing, you agree to Funfinity's Terms of Service.</p>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="bg-[#FDFBF7]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#F3E8D8] transition-all w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('home')}>
              <Logo size={40} />
              <span className="font-bold text-2xl text-[#4A3B32] tracking-tight group-hover:text-[#D48847] transition-colors">Funfinity</span>
            </div>
            
            <div className="hidden md:flex items-center gap-6 bg-white px-6 py-2 rounded-full shadow-sm border border-gray-100">
              <button onClick={() => setCurrentView('home')} className={`font-bold text-sm transition-colors ${currentView === 'home' ? 'text-[#D48847]' : 'text-[#4A3B32] hover:text-[#D48847]'}`}>Home</button>
              <button onClick={() => setCurrentView('discover')} className={`font-bold text-sm transition-colors ${currentView === 'discover' ? 'text-[#D48847]' : 'text-[#4A3B32] hover:text-[#D48847]'}`}>Events</button>
              <button onClick={() => setCurrentView('create')} className={`font-bold text-sm transition-colors ${currentView === 'create' ? 'text-[#D48847]' : 'text-[#4A3B32] hover:text-[#D48847]'}`}>Host</button>
              
              {/* ADMIN ONLY TAB */}
              {userRole === 'admin' && (
                <button onClick={() => setCurrentView('admin')} className={`flex items-center gap-1 font-bold text-sm px-3 py-1 rounded-full transition-colors ${currentView === 'admin' ? 'bg-[#4A3B32] text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
                  <ShieldCheck size={14} /> Admin Zone
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-[#4A3B32]">{user.displayName || 'User'}</div>
                    <div className="text-[10px] text-gray-500">{userRole === 'admin' ? 'Super Admin' : 'Member'}</div>
                  </div>
                  <button onClick={handleLogout} className="bg-red-50 text-red-500 p-2 rounded-full hover:bg-red-100 transition-colors" title="Log Out">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setAuthModalOpen(true)} className="bg-[#4A3B32] text-white px-6 py-2 rounded-full font-bold text-sm shadow-md hover:bg-black transition-colors">
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow w-full flex flex-col items-center min-h-[70vh]">
        {currentView === 'home' && renderHome()}
        
        {/* Placeholder for Discover/Events View - keeping it minimal to focus on the fix */}
        {currentView === 'discover' && (
          <div className="py-24 text-center max-w-4xl mx-auto w-full px-4 animate-in fade-in">
             <h2 className="text-4xl font-bold text-[#4A3B32] mb-8">All Events</h2>
             <div className="grid md:grid-cols-2 gap-6">
               {events.map((event) => (
                 <div key={event.id} className="bg-white rounded-2xl p-6 text-left shadow-sm border border-[#F3E8D8]">
                   <h3 className="text-2xl font-bold text-[#4A3B32]">{event.title}</h3>
                   <p className="text-gray-500 mt-2"><Calendar className="inline mr-2" size={16}/>{event.date} at {event.time}</p>
                   <p className="text-gray-500 mt-1"><MapPin className="inline mr-2" size={16}/>{event.venue}</p>
                   <button onClick={() => handleRSVP(event.id)} className="mt-6 bg-[#D48847] text-white px-6 py-2 rounded-xl font-bold w-full hover:bg-[#b87439]">
                     {event.attendees?.includes(user?.uid) ? 'Ticket Booked ✓' : 'Book Ticket'}
                   </button>
                 </div>
               ))}
               {events.length === 0 && <p className="text-gray-500 col-span-2">No events available right now.</p>}
             </div>
          </div>
        )}

        {currentView === 'create' && renderCreateEvent()}
        {currentView === 'admin' && renderAdminDashboard()}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#F3E8D8] bg-[#FDFBF7] pt-16 pb-24 md:pb-12 text-center mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center mb-6"><Logo size={50} /></div>
          <p className="text-[#4A3B32]/70 font-medium mb-4">Funfinity Social Platform. Belagavi, India.</p>
          <div className="text-xs text-gray-400">© 2026 Funfinity. All rights reserved.</div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 flex justify-around p-2 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'home' ? 'text-[#D48847]' : 'text-gray-400'}`}>
          <Home size={22} strokeWidth={currentView === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </button>
        <button onClick={() => setCurrentView('discover')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'discover' ? 'text-[#D48847]' : 'text-gray-400'}`}>
          <Search size={22} strokeWidth={currentView === 'discover' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">Events</span>
        </button>
        <button onClick={() => setCurrentView('create')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'create' ? 'text-[#D48847]' : 'text-gray-400'}`}>
          <PlusCircle size={22} strokeWidth={currentView === 'create' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">Host</span>
        </button>
        {userRole === 'admin' && (
          <button onClick={() => setCurrentView('admin')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'admin' ? 'text-purple-600' : 'text-purple-300'}`}>
            <Settings size={22} strokeWidth={currentView === 'admin' ? 2.5 : 2} />
            <span className="text-[10px] font-bold mt-0.5">Admin</span>
          </button>
        )}
      </div>
    </div>
  );
}
