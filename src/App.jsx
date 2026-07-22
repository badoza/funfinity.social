import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { MapPin, Calendar, Users, PlusCircle, Home, ShieldCheck, Search, Camera, Heart, Star, Navigation, Coffee, Sparkles, X, Image as ImageIcon, Video, AlertCircle, CheckCircle2, ChevronRight, LogOut, LayoutDashboard, Instagram, Youtube, Share2, TrendingUp, Check } from 'lucide-react';

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
  const [authMode, setAuthMode] = useState('login'); 
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [activeVibeFilter, setActiveVibeFilter] = useState('All');
  const vibes = ['All', 'Chill', 'High Energy', 'Deep Conversations', 'Creative'];

  // Forms
  const [newEvent, setNewEvent] = useState({
    title: '', date: '', time: '', venue: '', price: '', capacity: '', description: '', vibe: 'Chill', imageUrl: ''
  });
  const [newMemory, setNewMemory] = useState({ type: 'upload', url: '', caption: '' });

  // --- HELPER: TOAST NOTIFICATIONS ---
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // --- CORE: AUTHENTICATION & ADMIN CHECK ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        setIsAdmin(SUPER_ADMINS.includes(currentUser.email.toLowerCase()));
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // --- CORE: FETCH PUBLIC DATA ---
  useEffect(() => {
    // Fetch Events
    const unsubscribeEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const eventsData = [];
      snapshot.forEach((doc) => eventsData.push({ id: doc.id, ...doc.data() }));
      setEvents(eventsData.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (error) => {
      console.error("Events fetch error:", error);
      setLoading(false);
    });

    // Fetch Memories
    const unsubscribeMemories = onSnapshot(collection(db, 'memories'), (snapshot) => {
      const memData = [];
      snapshot.forEach((doc) => memData.push({ id: doc.id, ...doc.data() }));
      setMemories(memData.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
      console.error("Memories fetch error:", error);
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
      showToast("Logged in successfully!", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (SUPER_ADMINS.includes(authForm.email.toLowerCase())) {
        showToast("Security Guard: Admins must use 'Continue with Google'.", "error");
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
      showToast(error.message.replace('Firebase:', '').trim(), "error");
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
      showToast("Event published beautifully!");
      setCurrentView('discover');
      setNewEvent({ title: '', date: '', time: '', venue: '', price: '', capacity: '', description: '', vibe: 'Chill', imageUrl: '' });
    } catch (error) {
      showToast("Database locked: Ensure Firestore Rules are set.", "error");
    }
    setIsSubmitting(false);
  };

  const handleRSVP = async (eventId, isFull) => {
    if (!user) {
        setShowAuthModal(true);
        return;
    }
    if (isFull) {
        showToast("This event is currently sold out!", "error");
        return;
    }
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, { attendees: arrayUnion(user.uid) });
      showToast("Ticket Booked! See you there.");
    } catch (error) {
      showToast("Failed to book ticket. Try again.", "error");
    }
  };

  const handleShare = async (title) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join me at ${title} on Funfinity!`, url: window.location.href });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!");
    }
  };

  // --- MEMORY WALL HANDLERS ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000) { 
        showToast("File too large. Please keep images under 1MB, or use an Image URL.", "error");
        e.target.value = ''; 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
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
      showToast("Memory added successfully!");
      setNewMemory({ type: 'upload', url: '', caption: '' });
    } catch (error) {
      showToast("Database Error: Check your Firestore Security Rules.", "error");
    }
    setIsSubmitting(false);
  };

  // Data processing for Past vs Upcoming Events
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const filtered = activeVibeFilter === 'All' ? events : events.filter(e => e.vibe === activeVibeFilter);
    
    const upcoming = [];
    const past = [];

    filtered.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= today) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });

    // Sort upcoming ascending (closest first), past descending (most recent first)
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    past.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events, activeVibeFilter]);

  // Social URL Formatter
  const getEmbedUrl = (url) => {
    if (!url) return '';
    let embedUrl = url;
    if (embedUrl.includes("instagram.com")) {
      embedUrl = embedUrl.split("?")[0]; 
      if (!embedUrl.endsWith("/")) embedUrl += "/";
      embedUrl += "embed";
    } else if (embedUrl.includes("watch?v=")) {
      embedUrl = embedUrl.replace("watch?v=", "embed/");
      embedUrl = embedUrl.split("&")[0];
    } else if (embedUrl.includes("youtu.be/")) {
      embedUrl = embedUrl.replace("youtu.be/", "youtube.com/embed/");
      embedUrl = embedUrl.split("?")[0];
    }
    return embedUrl;
  };

  // --- UI COMPONENTS ---
  const Logo = ({ size = 32 }) => (
    <div className="flex items-center gap-2 group">
      <div className="w-8 h-8 bg-[#D48847] rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all duration-300 shadow-md">
        <Sparkles size={18} className="text-white" />
      </div>
      <span className="font-bold tracking-tight text-xl text-[#4A3B32]">Funfinity</span>
    </div>
  );

  const EventCard = ({ event, isPast }) => {
    const isAttending = event.attendees?.includes(user?.uid);
    const isHost = user && event.hostEmail === user?.email;
    const attendeeCount = event.attendees?.length || 0;
    const capacity = parseInt(event.capacity) || 0;
    const isFull = capacity > 0 && attendeeCount >= capacity;
    
    // Generates fake or real avatars for social proof
    const getAvatar = (index) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.id}${index}&backgroundColor=F3E8D8`;

    return (
      <div className={`bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-[#F3E8D8] flex flex-col group ${isPast ? 'opacity-80 hover:opacity-100 grayscale-[20%] hover:grayscale-0' : ''}`}>
        <div className="h-56 overflow-hidden relative shrink-0 m-2 rounded-[1.5rem]">
          <img src={event.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={event.title} />
          
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold text-[#4A3B32] shadow-sm flex items-center gap-1">
            {event.price && event.price !== "0" ? `₹${event.price}` : 'Free'}
          </div>
          
          {isPast && (
             <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
               Completed
             </div>
          )}

          {/* Share Button */}
          <button onClick={(e) => { e.stopPropagation(); handleShare(event.title); }} className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#4A3B32] hover:bg-[#D48847] hover:text-white transition-colors shadow-lg">
            <Share2 size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#D48847] bg-[#D48847]/10 px-3 py-1 rounded-md">
              <Calendar size={14} /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: isPast ? 'numeric' : undefined })} • {event.time}
            </div>
            <span className="bg-[#FDFBF7] text-[#4A3B32]/70 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-[#F3E8D8]">{event.vibe}</span>
          </div>
          
          <h3 className="text-2xl font-bold tracking-tight text-[#4A3B32] mb-2 line-clamp-2">{event.title}</h3>
          
          <div className="flex items-center gap-2 text-sm text-[#4A3B32]/60 font-medium mb-4">
            <MapPin size={16} className="text-[#D48847]/70" /> {event.venue}
          </div>
          
          <p className="text-sm text-gray-600 mb-6 line-clamp-2 flex-grow">{event.description}</p>
          
          {/* Luma-style Attendees & Capacity */}
          <div className="flex justify-between items-end mb-4">
            <div className="flex -space-x-2 overflow-hidden">
               {Array.from({ length: Math.min(attendeeCount === 0 ? 1 : attendeeCount, 3) }).map((_, i) => (
                 <img key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100" src={getAvatar(i)} alt="" />
               ))}
               {attendeeCount > 3 && (
                 <div className="h-8 w-8 rounded-full ring-2 ring-white bg-[#F3E8D8] flex items-center justify-center text-[10px] font-bold text-[#4A3B32]">
                   +{attendeeCount - 3}
                 </div>
               )}
               {attendeeCount === 0 && (
                  <div className="h-8 pl-4 flex items-center text-xs font-medium text-gray-400">Be the first!</div>
               )}
            </div>
            {capacity > 0 && !isPast && (
               <div className="text-xs font-bold text-right">
                  {isFull ? <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12}/> Sold Out</span> : <span className="text-[#D48847]">{capacity - attendeeCount} slots left</span>}
               </div>
            )}
          </div>

          {/* Host Analytics (Only visible to admins/hosts) */}
          {(isAdmin || isHost) && (
             <div className="bg-[#FDFBF7] rounded-xl p-3 mb-4 border border-[#F3E8D8] flex justify-between items-center text-xs">
                <div className="font-bold text-[#4A3B32] flex items-center gap-1"><TrendingUp size={14} className="text-green-500"/> Host Stats</div>
                <div className="text-gray-500">
                  <span className="font-bold text-[#4A3B32]">{attendeeCount}</span> Reg • <span className="font-bold text-green-600">₹{attendeeCount * (parseInt(event.price) || 0)}</span>
                </div>
             </div>
          )}
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-full bg-[#4A3B32] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {(event.hostEmail || "H")[0].toUpperCase()}
               </div>
               <div className="text-xs">
                 <div className="text-gray-400 font-medium">Hosted by</div>
                 <div className="font-bold text-[#4A3B32] flex items-center gap-1">Verified <ShieldCheck size={12} className="text-blue-500" /></div>
               </div>
            </div>
            
            {!isPast && (
               isHost ? (
                 <span className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-full font-bold text-sm">Your Event</span>
               ) : isAttending ? (
                 <span className="bg-green-50 text-green-700 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 border border-green-200">
                   <CheckCircle2 size={16} /> Booked
                 </span>
               ) : isFull ? (
                  <button className="bg-gray-200 text-gray-500 px-6 py-2.5 rounded-full font-bold text-sm cursor-not-allowed">
                    Sold Out
                  </button>
               ) : (
                 <button onClick={() => handleRSVP(event.id, isFull)} className="bg-[#D48847] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#b87439] transition-colors shadow-md transform active:scale-95">
                   RSVP
                 </button>
               )
            )}
            {isPast && (
               <button className="bg-[#F3E8D8] text-[#4A3B32] px-5 py-2.5 rounded-full font-bold text-sm cursor-default border border-[#e8dbc6]">
                 Event Concluded
               </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="w-full bg-[#FDFBF7] min-h-screen">
      {/* Premium Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#F3E8D8] text-sm font-medium text-[#4A3B32] shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('discover')}>
            <MapPin size={14} className="text-[#D48847]" /> Discover Belagavi's Best Events <ChevronRight size={14} />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-[#4A3B32] leading-[1.1]">
            Experience<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4A3B32] via-[#D48847] to-[#e09b5f]">the extraordinary.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[#4A3B32]/70 font-medium max-w-2xl mx-auto tracking-tight">
            Discover curated local events, connect with amazing people, or host your own unforgettable experiences.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button onClick={() => setCurrentView('discover')} className="w-full sm:w-auto px-8 py-4 bg-[#4A3B32] text-white rounded-full font-bold text-lg hover:bg-[#2c221c] transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-2">
              <Search size={20} /> Explore Events
            </button>
            <button onClick={() => setCurrentView('create')} className="w-full sm:w-auto px-8 py-4 bg-white text-[#4A3B32] border border-[#F3E8D8] rounded-full font-bold text-lg hover:bg-orange-50 transition-all shadow-sm flex items-center justify-center gap-2">
              <PlusCircle size={20} /> Host an Event
            </button>
          </div>
        </div>
      </section>

      {/* Modern Memory Wall */}
      <section className="py-24 px-4 bg-white border-t border-[#F3E8D8]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-[#4A3B32] mb-2">Community Memories</h2>
              <p className="text-[#4A3B32]/70 font-medium text-lg">Glimpses from our recent experiences.</p>
            </div>
          </div>
          
          {memories.length === 0 ? (
            <div className="text-center py-24 bg-[#FDFBF7] rounded-[2rem] border border-dashed border-[#F3E8D8]">
              <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-[#4A3B32]/60 font-medium text-lg">No memories posted yet.</p>
              <p className="text-gray-400 text-sm mt-1">Check back after our next big event!</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {memories.map(mem => (
                <div key={mem.id} className="break-inside-avoid relative group rounded-3xl overflow-hidden bg-[#FDFBF7] shadow-sm hover:shadow-xl transition-all duration-500 border border-[#F3E8D8]">
                  {mem.type === 'video_url' && mem.url ? (
                     <div className="aspect-square w-full bg-white relative">
                        <iframe 
                           src={getEmbedUrl(mem.url)} 
                           className="absolute top-0 left-0 w-full h-full border-0" 
                           allowFullScreen
                           scrolling="no"
                        ></iframe>
                     </div>
                  ) : (
                     <img src={mem.url} alt="Memory" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                  )}
                  {mem.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12 pointer-events-none">
                      <p className="text-white font-medium text-sm drop-shadow-md">{mem.caption}</p>
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
    <div className="w-full bg-[#FDFBF7] min-h-screen pt-8 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Filters */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-4 mb-8">
          {vibes.map(vibe => (
            <button key={vibe} onClick={() => setActiveVibeFilter(vibe)} className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${activeVibeFilter === vibe ? 'bg-[#4A3B32] text-white shadow-md' : 'bg-white text-[#4A3B32] border border-[#F3E8D8] hover:border-[#D48847] hover:bg-orange-50'}`}>
              {vibe}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D48847]"></div></div>
        ) : (
          <div className="space-y-16">
            
            {/* UPCOMING EVENTS SECTION */}
            <div>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                 <div>
                   <h2 className="text-4xl font-extrabold tracking-tight text-[#4A3B32] mb-2">Upcoming Experiences</h2>
                   <p className="text-[#4A3B32]/70 font-medium text-lg">Book your spot before they sell out.</p>
                 </div>
                 <button onClick={() => setCurrentView('create')} className="bg-[#4A3B32] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#2c221c] transition-all shadow-md hover:shadow-lg">
                   <PlusCircle size={18} /> Host Experience
                 </button>
               </div>

               {upcomingEvents.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-[2.5rem] border border-[#F3E8D8] shadow-sm">
                   <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                   <h3 className="text-xl font-bold text-[#4A3B32] mb-2">No upcoming {activeVibeFilter !== 'All' ? activeVibeFilter.toLowerCase() : ''} events found</h3>
                   <p className="text-gray-500">Be the first to host this kind of vibe!</p>
                 </div>
               ) : (
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {upcomingEvents.map(event => <EventCard key={event.id} event={event} isPast={false} />)}
                 </div>
               )}
            </div>

            {/* PAST EVENTS SECTION */}
            {pastEvents.length > 0 && (
               <div>
                  <div className="mb-8 border-t border-[#F3E8D8] pt-12">
                    <h2 className="text-3xl font-extrabold tracking-tight text-[#4A3B32] mb-2">Past Memories</h2>
                    <p className="text-[#4A3B32]/70 font-medium">See what you missed. Check out past experiences.</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pastEvents.map(event => <EventCard key={event.id} event={event} isPast={true} />)}
                  </div>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateEvent = () => {
    if (!isAdmin) {
      return (
        <div className="max-w-2xl mx-auto mt-20 text-center bg-white p-12 rounded-[2.5rem] shadow-xl border border-[#F3E8D8]">
          <div className="w-24 h-24 bg-[#FDFBF7] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#F3E8D8]"><ShieldCheck className="text-gray-400" size={48} /></div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#4A3B32] mb-4">Verification Required</h2>
          <p className="text-[#4A3B32]/70 text-lg mb-8 max-w-md mx-auto">To maintain the highest quality of events on Funfinity, only verified community hosts can publish directly to the platform.</p>
          <a href="mailto:tilakdongare064@gmail.com" className="bg-[#4A3B32] text-white px-8 py-4 rounded-full font-bold hover:bg-[#2c221c] transition-colors inline-block shadow-lg">Apply to Host</a>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-[#F3E8D8] mt-10 mb-24">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#4A3B32] mb-2">Host a new experience</h2>
          <p className="text-[#4A3B32]/70">Create something beautiful for the community.</p>
        </div>
        <form onSubmit={handleCreateEvent} className="space-y-6">
           <div>
            <label className="block text-sm font-bold text-[#4A3B32] mb-2">Event Title</label>
            <input required type="text" placeholder="e.g. Acoustic Sundowner" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4A3B32] focus:ring-1 focus:ring-[#4A3B32] outline-none transition-all text-gray-900 font-medium" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="block text-sm font-bold text-[#4A3B32] mb-2">Date</label>
               <input required type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4A3B32] outline-none transition-all text-gray-900 font-medium" />
            </div>
            <div>
               <label className="block text-sm font-bold text-[#4A3B32] mb-2">Time</label>
               <input required type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4A3B32] outline-none transition-all text-gray-900 font-medium" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
               <label className="block text-sm font-bold text-[#4A3B32] mb-2">Venue</label>
               <input required type="text" placeholder="Location Name" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4A3B32] outline-none transition-all text-gray-900 font-medium" />
            </div>
            <div>
               <label className="block text-sm font-bold text-[#4A3B32] mb-2">Price (₹)</label>
               <input type="number" placeholder="Free if empty" value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4A3B32] outline-none transition-all text-gray-900 font-medium" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
                <label className="block text-sm font-bold text-[#4A3B32] mb-2">Max Capacity</label>
                <input type="number" placeholder="Leave empty for unlimited" value={newEvent.capacity} onChange={e => setNewEvent({...newEvent, capacity: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4A3B32] outline-none transition-all text-gray-900 font-medium" />
             </div>
             <div>
                <label className="block text-sm font-bold text-[#4A3B32] mb-2">Vibe</label>
                <select value={newEvent.vibe} onChange={e => setNewEvent({...newEvent, vibe: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4A3B32] outline-none transition-all text-gray-900 font-medium cursor-pointer">
                  {vibes.filter(v => v !== 'All').map(v => <option key={v} value={v}>{v}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-bold text-[#4A3B32] mb-2">Cover Image URL</label>
                <input type="url" value={newEvent.imageUrl} onChange={e => setNewEvent({...newEvent, imageUrl: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4A3B32] outline-none transition-all text-gray-900 font-medium" placeholder="https://..." />
             </div>
          </div>
          <div>
             <label className="block text-sm font-bold text-[#4A3B32] mb-2">Description</label>
             <textarea required rows="4" placeholder="Tell people what to expect..." value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4A3B32] outline-none transition-all text-gray-900 font-medium resize-none"></textarea>
          </div>
          
          <div className="pt-4">
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#4A3B32] text-white py-5 rounded-2xl font-bold text-lg hover:bg-[#2c221c] transition-colors disabled:opacity-50 shadow-lg flex justify-center items-center gap-2">
              <Sparkles size={20} /> {isSubmitting ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderAdminZone = () => (
    <div className="max-w-3xl mx-auto w-full bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-[#F3E8D8] mt-10 mb-24">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-[#4A3B32] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-3">
           <LayoutDashboard className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-[#4A3B32] mb-2">Command Center</h2>
        <p className="text-[#4A3B32]/70 font-medium">Update the Memory Wall directly.</p>
      </div>

      <div className="bg-[#FDFBF7] p-8 rounded-[2rem] border border-[#F3E8D8]">
        <h3 className="font-bold text-xl mb-6 text-[#4A3B32] flex items-center gap-2"><Camera className="text-[#D48847]"/> Post to Memory Wall</h3>
        
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-1.5 rounded-xl border border-[#F3E8D8] w-max max-w-full shadow-sm">
           <button onClick={() => setNewMemory({...newMemory, type: 'upload'})} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${newMemory.type === 'upload' ? 'bg-[#4A3B32] text-white shadow-md' : 'text-gray-500 hover:bg-[#F3E8D8]'}`}>Upload Photo</button>
           <button onClick={() => setNewMemory({...newMemory, type: 'image_url'})} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${newMemory.type === 'image_url' ? 'bg-[#4A3B32] text-white shadow-md' : 'text-gray-500 hover:bg-[#F3E8D8]'}`}>Image URL</button>
           <button onClick={() => setNewMemory({...newMemory, type: 'video_url'})} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 ${newMemory.type === 'video_url' ? 'bg-[#4A3B32] text-white shadow-md' : 'text-gray-500 hover:bg-[#F3E8D8]'}`}>
              Social Embed <Instagram size={14}/> <Youtube size={14} />
           </button>
        </div>

        <form onSubmit={handleAddMemory} className="space-y-5">
          {newMemory.type === 'upload' && (
             <div>
                <label className="block text-sm font-bold text-[#4A3B32] mb-2">Select File (Max 1MB)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-white px-5 py-4 rounded-2xl border border-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#F3E8D8] file:text-[#4A3B32] hover:file:bg-[#e8dbc6] transition-all cursor-pointer text-sm font-medium" required />
             </div>
          )}
          {newMemory.type === 'image_url' && (
             <div>
                <label className="block text-sm font-bold text-[#4A3B32] mb-2">Direct Image URL (.jpg, .png)</label>
                <input type="url" placeholder="https://..." value={newMemory.url} onChange={e => setNewMemory({...newMemory, url: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-white focus:border-[#4A3B32] focus:ring-1 focus:ring-[#4A3B32] outline-none transition-all font-medium text-gray-900" required />
             </div>
          )}
          {newMemory.type === 'video_url' && (
             <div>
                <label className="block text-sm font-bold text-[#4A3B32] mb-2">Instagram Reel/Post or YouTube Link</label>
                <input type="url" placeholder="https://www.instagram.com/p/... or https://youtube.com/watch?v=..." value={newMemory.url} onChange={e => setNewMemory({...newMemory, url: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-white focus:border-[#4A3B32] focus:ring-1 focus:ring-[#4A3B32] outline-none transition-all font-medium text-gray-900" required />
                <p className="text-xs text-gray-400 mt-2">Paste a public Instagram link or YouTube video. The app will automatically frame it for the memory wall.</p>
             </div>
          )}
          <div>
            <label className="block text-sm font-bold text-[#4A3B32] mb-2">Short Caption</label>
            <input type="text" placeholder="e.g. Unforgettable night!" value={newMemory.caption} onChange={e => setNewMemory({...newMemory, caption: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-white focus:border-[#4A3B32] focus:ring-1 focus:ring-[#4A3B32] outline-none transition-all font-medium text-gray-900" required />
          </div>
          
          <div className="pt-2">
             <button type="submit" disabled={isSubmitting || !newMemory.url} className="w-full bg-[#D48847] text-white px-6 py-4 rounded-2xl font-bold text-lg hover:bg-[#b87439] disabled:opacity-50 transition-all shadow-md">Publish Memory</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#4A3B32] flex flex-col items-center relative selection:bg-[#4A3B32] selection:text-white">
      
      {/* Toast Notification */}
      <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-4 rounded-full font-bold text-white shadow-2xl flex items-center gap-3 transition-all duration-500 ease-out ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'} ${toast.type === 'error' ? 'bg-red-500' : 'bg-[#4A3B32]'}`}>
        {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />} {toast.message}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl transform transition-all border border-[#F3E8D8]">
             <div className="p-6 flex justify-end">
               <button onClick={() => setShowAuthModal(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors"><X size={20} /></button>
             </div>
             
             <div className="px-8 pb-10">
                <div className="text-center mb-8">
                   <div className="flex justify-center mb-4"><Logo size={40} /></div>
                   <h3 className="font-extrabold text-2xl tracking-tight text-[#4A3B32]">Join the Club</h3>
                   <p className="text-[#4A3B32]/70 font-medium mt-1">Sign in to book tickets and host events.</p>
                </div>

                <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 px-6 py-4 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all mb-6 shadow-sm">
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" /> Continue with Google
                </button>
                
                <div className="relative flex items-center py-4 mb-4">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">Or</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
                
                <div className="flex mb-6 bg-gray-100 p-1.5 rounded-xl">
                  <button onClick={() => setAuthMode('login')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Log In</button>
                  <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${authMode === 'signup' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Sign Up</button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <input type="email" placeholder="Email address" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4A3B32] focus:ring-1 focus:ring-[#4A3B32] outline-none transition-all font-medium text-gray-900" />
                  <input type="password" placeholder="Password" required minLength="6" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4A3B32] focus:ring-1 focus:ring-[#4A3B32] outline-none transition-all font-medium text-gray-900" />
                  <button type="submit" className="w-full bg-[#4A3B32] text-white py-4 rounded-2xl font-bold hover:bg-black transition-colors shadow-md mt-2">
                    {authMode === 'login' ? 'Log In' : 'Create Account'}
                  </button>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#F3E8D8] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="cursor-pointer" onClick={() => setCurrentView('home')}>
              <Logo />
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => setCurrentView('discover')} className={`font-semibold text-sm transition-colors ${currentView === 'discover' ? 'text-[#D48847]' : 'text-[#4A3B32]/70 hover:text-[#D48847]'}`}>Discover</button>
              <button onClick={() => setCurrentView('create')} className={`font-semibold text-sm transition-colors ${currentView === 'create' ? 'text-[#D48847]' : 'text-[#4A3B32]/70 hover:text-[#D48847]'}`}>Host</button>
              
              {isAdmin && (
                <button onClick={() => setCurrentView('admin')} className={`font-semibold text-sm transition-colors flex items-center gap-1.5 px-4 py-2 rounded-full ${currentView === 'admin' ? 'bg-[#D48847] text-white shadow-md' : 'text-[#D48847] bg-[#D48847]/10 hover:bg-[#D48847]/20'}`}>
                  <ShieldCheck size={16}/> Admin Zone
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#D48847] flex items-center justify-center text-white font-bold shadow-sm">{user.email?.substring(0, 1).toUpperCase() || 'U'}</div>
                  <button onClick={handleLogout} className="text-[#4A3B32]/50 hover:text-[#4A3B32] transition-colors" title="Logout"><LogOut size={20}/></button>
                </div>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="bg-[#D48847] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#b87439] transition-all shadow-md">Sign In</button>
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

      {/* Footer & Development Signature */}
      <footer className="w-full bg-[#FDFBF7] border-t border-[#F3E8D8] pt-16 pb-24 md:pb-12 text-center mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex justify-center mb-6 cursor-pointer" onClick={() => setCurrentView('home')}>
             <Logo size={48} />
          </div>
          <h3 className="text-2xl font-bold text-[#4A3B32] mb-2">Join the Funfinity Family</h3>
          <p className="text-[#4A3B32]/70 mb-8 max-w-lg mx-auto">Follow us for updates, event drops, and community highlights.</p>
          
          <a href="https://www.instagram.com/funfinity.social" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#4A3B32] to-[#2c221c] text-white px-8 py-4 rounded-full font-bold hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <Instagram size={20} /> Follow on Instagram
          </a>
          
          <div className="mt-16 flex flex-col md:flex-row justify-between items-center w-full border-t border-[#F3E8D8] pt-8 px-4 gap-4">
            <p className="text-sm font-bold text-[#4A3B32] tracking-wide">
              Founded by Tilak Dongare
            </p>
            <div className="flex gap-4">
               <a href="https://badoza.store" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#D48847] hover:text-[#4A3B32] transition-colors flex items-center gap-1.5">
                  Crafted with <Sparkles size={14}/> by Badoza
               </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile App-like Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-white/90 backdrop-blur-xl rounded-[2rem] flex justify-around p-2 z-50 shadow-2xl border border-[#F3E8D8]">
        <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all w-16 ${currentView === 'home' ? 'text-white bg-[#4A3B32] shadow-md' : 'text-[#4A3B32]/50 hover:text-[#4A3B32]'}`}><Home size={22} /><span className="text-[10px] font-bold">Home</span></button>
        <button onClick={() => setCurrentView('discover')} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all w-16 ${currentView === 'discover' ? 'text-white bg-[#4A3B32] shadow-md' : 'text-[#4A3B32]/50 hover:text-[#4A3B32]'}`}><Search size={22} /><span className="text-[10px] font-bold">Explore</span></button>
        <button onClick={() => setCurrentView('create')} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all w-16 ${currentView === 'create' ? 'text-white bg-[#4A3B32] shadow-md' : 'text-[#4A3B32]/50 hover:text-[#4A3B32]'}`}><PlusCircle size={22} /><span className="text-[10px] font-bold">Host</span></button>
        {isAdmin && <button onClick={() => setCurrentView('admin')} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all w-16 ${currentView === 'admin' ? 'text-white bg-[#D48847] shadow-md' : 'text-[#D48847] hover:text-[#b87439]'}`}><ShieldCheck size={22} /><span className="text-[10px] font-bold">Admin</span></button>}
      </div>
    </div>
  );
}
