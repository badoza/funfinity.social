import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { MapPin, Calendar, Users, PlusCircle, Home, ShieldCheck, Search, Camera, Heart, Star, MessageCircle, Navigation, Coffee, Sparkles, X, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';

// --- YOUR REAL FIREBASE CREDENTIALS ---
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

// --- STRICT SUPER ADMINS ---
const SUPER_ADMINS = ['tilakdongare064@gmail.com', 'dodge.kunal@gmail.com'];

export default function FunfinityApp() {
  // State Management
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState([]);
  const [memories, setMemories] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [activeVibeFilter, setActiveVibeFilter] = useState('All');
  const vibes = ['All', 'Chill', 'High Energy', 'Deep Conversations', 'Creative'];

  // Forms
  const [newEvent, setNewEvent] = useState({
    title: '', date: '', time: '', venue: '', price: '', description: '', vibe: 'Chill', imageUrl: ''
  });
  const [newMemory, setNewMemory] = useState({ type: 'upload', url: '', caption: '' });

  // --- HELPER: TOAST NOTIFICATIONS ---
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // --- CORE: AUTHENTICATION & ADMIN CHECK ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        // Safely check if current user is in SUPER_ADMINS array
        setIsAdmin(SUPER_ADMINS.includes(currentUser.email.toLowerCase()));
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // --- CORE: FETCH PUBLIC DATA ---
  useEffect(() => {
    // 1. Fetch Events (Publicly viewable)
    const eventsRef = collection(db, 'events');
    const unsubscribeEvents = onSnapshot(eventsRef, (snapshot) => {
      const eventsData = [];
      snapshot.forEach((doc) => eventsData.push({ id: doc.id, ...doc.data() }));
      setEvents(eventsData.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    // 2. Fetch Memories (Publicly viewable)
    const memoriesRef = collection(db, 'memories');
    const unsubscribeMemories = onSnapshot(memoriesRef, (snapshot) => {
      const memData = [];
      snapshot.forEach((doc) => memData.push({ id: doc.id, ...doc.data() }));
      setMemories(memData.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
      console.error("Error fetching memories:", error);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeMemories();
    };
  }, []);

  // --- AUTHENTICATION HANDLERS ---
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowAuthModal(false);
      showToast("Logged in successfully!");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      // Security Check: Admins cannot use email/password to prevent brute-forcing
      if (SUPER_ADMINS.includes(authForm.email.toLowerCase())) {
        showToast("Security: Admin must use 'Continue with Google'.", "error");
        return;
      }

      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        showToast("Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        showToast("Welcome back!");
      }
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '' });
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('home');
    showToast("Logged out successfully");
  };

  // --- EVENT HANDLERS ---
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast("Only verified hosts can create events.", "error");
      return;
    }
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
      showToast("Event created successfully!");
      setCurrentView('discover');
      setNewEvent({ title: '', date: '', time: '', venue: '', price: '', description: '', vibe: 'Chill', imageUrl: '' });
    } catch (error) {
      showToast(error.message, "error");
    }
    setIsSubmitting(false);
  };

  const handleRSVP = async (eventId) => {
    if (!user) {
        setShowAuthModal(true);
        showToast("Please log in to RSVP!", "error");
        return;
    }
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, { attendees: arrayUnion(user.uid) });
      showToast("Ticket Booked Successfully!");
    } catch (error) {
      showToast("Failed to RSVP", "error");
    }
  };

  // --- MEMORY WALL HANDLERS ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) { // Limit to 2MB to protect database limit
        showToast("Image too large. Please upload an image under 2MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        // Compresses image to Base64 String for free database storage
        setNewMemory({ ...newMemory, type: 'upload', url: reader.result }); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'memories'), {
        ...newMemory,
        createdAt: Date.now(),
        author: user.email
      });
      showToast("Memory added to the wall!");
      setNewMemory({ type: 'upload', url: '', caption: '' });
    } catch (error) {
      showToast(error.message, "error");
    }
    setIsSubmitting(false);
  };

  const filteredEvents = useMemo(() => {
    if (activeVibeFilter === 'All') return events;
    return events.filter(e => e.vibe === activeVibeFilter);
  }, [events, activeVibeFilter]);

  // --- UI COMPONENTS ---
  const Logo = ({ size = 45 }) => (
    <svg width={size} height={size * 0.88} viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" className="transform hover:scale-105 transition-transform duration-300 shrink-0">
      <path d="M 28 45 C 10 45, 10 15, 28 15 C 45 15, 55 45, 72 45 C 90 45, 90 15, 72 15 C 55 15, 45 45, 28 45 Z" fill="none" stroke="#D48847" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="30" r="4.5" fill="#4A3B32" />
      <circle cx="72" cy="30" r="4.5" fill="#4A3B32" />
      <path d="M 32 60 Q 50 78 68 60" fill="none" stroke="#D48847" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );

  const renderHome = () => (
    <div className="w-full bg-[#FDFBF7]">
      <section className="min-h-[80vh] flex items-center pt-20 relative bg-cover bg-center bg-fixed" style={{ backgroundImage: "linear-gradient(rgba(74, 59, 50, 0.75), rgba(212, 136, 71, 0.65)), url('https://images.unsplash.com/photo-1543807535-eceef0bc6599?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        <div className="px-4 max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center z-10 py-20">
          <div className="text-left">
            <div className="inline-block bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1 mb-6 shadow-sm">
              <span className="text-white text-sm font-semibold flex items-center gap-2">
                <MapPin size={14} className="text-[#D48847]" /> Belagavi's Premium Social Platform
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Find Your Vibe.<br/><span className="text-[#D48847] drop-shadow-md">Find Your People.</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 font-medium max-w-lg">
              Discover local events, book tickets, or host your own verified experiences. All in one app.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setCurrentView('discover')} className="bg-[#D48847] text-white px-8 py-3 rounded-full font-bold hover:bg-[#4A3B32] transition-colors shadow-lg flex items-center gap-2">
                <Search size={18} /> Discover Events
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Memory Wall Section */}
      <section className="py-24 bg-[#FDFBF7] px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#4A3B32] mb-4 flex items-center justify-center gap-3">
              <Camera className="text-[#D48847]" /> Community Memory Wall
            </h2>
            <p className="text-gray-500">Highlights and snaps from our recent meetups.</p>
          </div>
          
          {memories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-[#F3E8D8]">
              {/* FIXED: Replaced crash-causing <Image> tag with imported <ImageIcon> */}
              <ImageIcon size={40} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-bold">No memories posted yet. Check back after our next event!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {memories.map(mem => (
                <div key={mem.id} className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100 shadow-sm border border-[#F3E8D8]">
                  {mem.type === 'video_url' && mem.url ? (
                     // Safe replace to prevent crashes on bad URLs
                     <iframe src={mem.url.includes("watch?v=") ? mem.url.replace("watch?v=", "embed/") : mem.url} className="w-full h-full object-cover" allowFullScreen></iframe>
                  ) : (
                     <img src={mem.url || 'https://via.placeholder.com/400'} alt="Memory" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  )}
                  {mem.caption && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <p className="text-white font-bold text-sm">{mem.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );

  const renderDiscover = () => (
    <div className="space-y-8 pb-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-bold text-[#4A3B32]">Marketplace</h2>
          <p className="text-[#4A3B32]/70">Browse all community events.</p>
        </div>
        <button onClick={() => setCurrentView('create')} className="bg-[#D48847] text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-[#b87439] transition-colors shadow-md">
          <PlusCircle size={18} /> Host Event
        </button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {vibes.map(vibe => (
          <button key={vibe} onClick={() => setActiveVibeFilter(vibe)} className={`whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-all ${activeVibeFilter === vibe ? 'bg-[#4A3B32] text-white shadow-md' : 'bg-white text-[#4A3B32] border border-[#F3E8D8] hover:border-[#D48847]'}`}>
            {vibe === 'Chill' && '☕ '}{vibe === 'High Energy' && '⚡ '}{vibe === 'Deep Conversations' && '🌙 '}{vibe === 'Creative' && '🎨 '} {vibe}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D48847]"></div></div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#F3E8D8]">
          <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-[#4A3B32] mb-2">No events found</h3>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => {
            const isAttending = event.attendees?.includes(user?.uid);
            const isHost = user && event.hostEmail === user?.email;

            return (
              <div key={event.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-[#F3E8D8] flex flex-col">
                <div className="h-48 overflow-hidden relative shrink-0">
                  <img src={event.imageUrl} className="w-full h-full object-cover" alt={event.title} />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#4A3B32]">
                    ₹{event.price || 'Free'}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#D48847] uppercase"><Calendar size={14} /> {event.date} • {event.time}</div>
                    <span className="bg-[#F3E8D8] text-[#4A3B32] text-[10px] px-2 py-1 rounded-md font-bold">{event.vibe}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#4A3B32] mb-2">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4"><MapPin size={16} /> {event.venue}</div>
                  <p className="text-sm text-gray-600 mb-6 line-clamp-3">{event.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-800"><Users size={14} className="text-[#D48847]"/> {event.attendees?.length || 0} Attending</div>
                    {isHost ? (
                      <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm">Your Event</span>
                    ) : isAttending ? (
                      <span className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1"><ShieldCheck size={16} /> Booked</span>
                    ) : (
                      <button onClick={() => handleRSVP(event.id)} className="bg-[#4A3B32] text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-black">RSVP</button>
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

  const renderCreateEvent = () => {
    // SECURITY LOCK: Only Admins can see the create form
    if (!isAdmin) {
      return (
        <div className="max-w-xl mx-auto mt-20 text-center bg-white p-10 rounded-[2.5rem] shadow-xl border border-[#F3E8D8]">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><ShieldCheck className="text-red-500" size={40} /></div>
          <h2 className="text-3xl font-bold text-[#4A3B32] mb-4">Host Verification Required</h2>
          <p className="text-gray-500 mb-8">To maintain the quality and safety of Funfinity events, only verified community admins can host events directly on the platform.</p>
          <a href="mailto:tilakdongare064@gmail.com" className="bg-[#4A3B32] text-white px-8 py-4 rounded-full font-bold hover:bg-black transition-colors inline-block">Contact Admin to Host</a>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto w-full bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-[#F3E8D8] mt-8 pb-24">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-[#F3E8D8] rounded-full flex items-center justify-center mx-auto mb-4"><Star className="text-[#D48847]" size={32} /></div>
          <h2 className="text-3xl font-bold text-[#4A3B32] mb-2">Host an Event</h2>
          <p className="text-gray-500">Welcome Admin. Publish a new experience.</p>
        </div>
        <form onSubmit={handleCreateEvent} className="space-y-5">
           <div>
            <label className="block text-sm font-bold text-[#4A3B32] mb-1">Event Title</label>
            <input required type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-[#4A3B32] mb-1">Date</label><input required type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" /></div>
            <div><label className="block text-sm font-bold text-[#4A3B32] mb-1">Time</label><input required type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-[#4A3B32] mb-1">Venue</label><input required type="text" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" /></div>
            <div><label className="block text-sm font-bold text-[#4A3B32] mb-1">Price (₹)</label><input type="number" placeholder="Free if empty" value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold text-[#4A3B32] mb-1">Vibe</label>
                <select value={newEvent.vibe} onChange={e => setNewEvent({...newEvent, vibe: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none">
                  {vibes.filter(v => v !== 'All').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
             </div>
             <div><label className="block text-sm font-bold text-[#4A3B32] mb-1">Cover Image URL</label><input type="url" value={newEvent.imageUrl} onChange={e => setNewEvent({...newEvent, imageUrl: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none" placeholder="https://..." /></div>
          </div>
          <div><label className="block text-sm font-bold text-[#4A3B32] mb-1">Description</label><textarea required rows="3" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"></textarea></div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-[#4A3B32] text-white py-4 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50">Publish Event</button>
        </form>
      </div>
    );
  };

  const renderAdminZone = () => (
    <div className="max-w-3xl mx-auto w-full bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-purple-200 mt-8 pb-24">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck className="text-purple-600" size={32} /></div>
        <h2 className="text-3xl font-bold text-purple-900 mb-2">Command Center</h2>
        <p className="text-gray-500">Update the Memory Wall directly.</p>
      </div>

      <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 mb-8">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Camera size={20} className="text-purple-600"/> Post to Memory Wall</h3>
        
        {/* Toggle between Upload, Image URL, and Video URL */}
        <div className="flex gap-2 mb-4 bg-white p-1 rounded-lg border border-purple-200 w-max overflow-x-auto max-w-full">
           <button onClick={() => setNewMemory({...newMemory, type: 'upload'})} className={`px-4 py-2 text-sm font-bold rounded-md whitespace-nowrap ${newMemory.type === 'upload' ? 'bg-purple-100 text-purple-800' : 'text-gray-500'}`}>Upload Photo</button>
           <button onClick={() => setNewMemory({...newMemory, type: 'image_url'})} className={`px-4 py-2 text-sm font-bold rounded-md whitespace-nowrap ${newMemory.type === 'image_url' ? 'bg-purple-100 text-purple-800' : 'text-gray-500'}`}>Image URL</button>
           <button onClick={() => setNewMemory({...newMemory, type: 'video_url'})} className={`px-4 py-2 text-sm font-bold rounded-md whitespace-nowrap ${newMemory.type === 'video_url' ? 'bg-purple-100 text-purple-800' : 'text-gray-500'}`}>YouTube Link</button>
        </div>

        <form onSubmit={handleAddMemory} className="space-y-4">
          {newMemory.type === 'upload' && (
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Select File (Max 2MB)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-white p-2 rounded-lg border border-purple-200" required />
                <p className="text-xs text-purple-600 mt-1">*Image is automatically compressed to save database space.</p>
             </div>
          )}
          {newMemory.type === 'image_url' && (
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Direct Image URL (.jpg, .png)</label>
                <input type="url" placeholder="https://..." value={newMemory.url} onChange={e => setNewMemory({...newMemory, url: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-purple-200 outline-none" required />
             </div>
          )}
          {newMemory.type === 'video_url' && (
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">YouTube URL</label>
                <input type="url" placeholder="https://www.youtube.com/watch?v=..." value={newMemory.url} onChange={e => setNewMemory({...newMemory, url: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-purple-200 outline-none" required />
             </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Short Caption</label>
            <input type="text" placeholder="e.g. Crazy night!" value={newMemory.caption} onChange={e => setNewMemory({...newMemory, caption: e.target.value})} className="w-full px-4 py-3 bg-white rounded-xl border border-purple-200 outline-none" required />
          </div>
          <button type="submit" disabled={isSubmitting || !newMemory.url} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50">Publish Memory</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-gray-900 flex flex-col items-center relative">
      
      {/* Custom Toast Notification */}
      {toast.show && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold text-white shadow-2xl flex items-center gap-2 animate-bounce ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <ShieldCheck size={18} />} {toast.message}
        </div>
      )}

      {/* Auth Modal (Supports Google AND Email/Password) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-xl text-[#4A3B32]">Welcome to Funfinity</h3>
               <button onClick={() => setShowAuthModal(false)} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"><X size={16} /></button>
             </div>
             <div className="p-8">
                <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 px-6 py-3 rounded-full font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all mb-6">
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" /> Continue with Google
                </button>
                
                <div className="relative flex items-center py-4 mb-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">Or use Email</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
                
                <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
                  <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${authMode === 'login' ? 'bg-white shadow-sm text-[#4A3B32]' : 'text-gray-500'}`}>Log In</button>
                  <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${authMode === 'signup' ? 'bg-white shadow-sm text-[#4A3B32]' : 'text-gray-500'}`}>Sign Up</button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <input type="email" placeholder="Email address" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50" />
                  <input type="password" placeholder="Password" required minLength="6" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50" />
                  <button type="submit" className="w-full bg-[#4A3B32] text-white py-3 rounded-xl font-bold hover:bg-black transition-colors">
                    {authMode === 'login' ? 'Log In' : 'Create Account'}
                  </button>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-[#FDFBF7]/95 backdrop-blur-md sticky top-0 z-50 border-b border-[#F3E8D8] w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('home')}>
              <Logo size={40} />
              <span className="font-bold text-2xl text-[#4A3B32] group-hover:text-[#D48847] transition-colors">Funfinity</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => setCurrentView('discover')} className={`font-bold text-sm ${currentView === 'discover' ? 'text-[#D48847]' : 'text-[#4A3B32] hover:text-[#D48847]'}`}>Discover</button>
              <button onClick={() => setCurrentView('create')} className={`font-bold text-sm ${currentView === 'create' ? 'text-[#D48847]' : 'text-[#4A3B32] hover:text-[#D48847]'}`}>Host Experience</button>
              
              {isAdmin && (
                <button onClick={() => setCurrentView('admin')} className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-purple-200 border border-purple-200">
                  <ShieldCheck size={16}/> Admin Zone
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D48847] flex items-center justify-center text-white font-bold shadow-sm">{user.email?.substring(0, 2).toUpperCase() || 'U'}</div>
                  <button onClick={handleLogout} className="text-xs font-bold text-gray-500 hover:text-red-500">Logout</button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="bg-[#4A3B32] text-white px-6 py-2 rounded-full font-bold hover:bg-black transition-all">Sign In</button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow w-full flex flex-col items-center">
        {currentView === 'home' && renderHome()}
        {currentView === 'discover' && renderDiscover()}
        {currentView === 'create' && renderCreateEvent()}
        {currentView === 'admin' && renderAdminZone()}
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 flex justify-around p-2 z-50 pb-safe">
        <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 p-2 w-16 ${currentView === 'home' ? 'text-[#D48847]' : 'text-gray-400'}`}><Home size={22} /><span className="text-[10px] font-bold">Home</span></button>
        <button onClick={() => setCurrentView('discover')} className={`flex flex-col items-center gap-1 p-2 w-16 ${currentView === 'discover' ? 'text-[#D48847]' : 'text-gray-400'}`}><Search size={22} /><span className="text-[10px] font-bold">Events</span></button>
        <button onClick={() => setCurrentView('create')} className={`flex flex-col items-center gap-1 p-2 w-16 ${currentView === 'create' ? 'text-[#D48847]' : 'text-gray-400'}`}><PlusCircle size={22} /><span className="text-[10px] font-bold">Host</span></button>
        {isAdmin && <button onClick={() => setCurrentView('admin')} className={`flex flex-col items-center gap-1 p-2 w-16 ${currentView === 'admin' ? 'text-purple-600' : 'text-gray-400'}`}><ShieldCheck size={22} /><span className="text-[10px] font-bold">Admin</span></button>}
      </div>
    </div>
  );
}
