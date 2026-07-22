import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, arrayUnion, setDoc, deleteDoc } from 'firebase/firestore';
import { MapPin, Calendar, Users, PlusCircle, Home, ShieldCheck, Search, Flame, Music, Camera, Sun, Heart, Star, MessageCircle, Rocket, Smile, Info, Map, Navigation, Coffee, Sparkles, LogOut, Upload, Video, Image as ImageIcon, Trash2, Link as LinkIcon } from 'lucide-react';

// Your exact Firebase config
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

// Critical environment variables for strict paths
const appId = typeof __app_id !== 'undefined' ? __app_id : 'funfinity-app-id';

// Super Admin Configuration
const SUPER_ADMINS = ['tilakdongare064@gmail.com', 'dodge.kunal@gmail.com'];

export default function FunfinityApp() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [events, setEvents] = useState([]);
  const [memories, setMemories] = useState([]);
  const [globalSettings, setGlobalSettings] = useState(null);
  
  const [currentView, setCurrentView] = useState('home'); // 'home', 'discover', 'venues', 'create', 'admin'
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Filters
  const [activeVibeFilter, setActiveVibeFilter] = useState('All');
  const [activeCityFilter, setActiveCityFilter] = useState('All India');

  const cities = ['All India', 'Belagavi', 'Bengaluru', 'Mumbai', 'Goa', 'Delhi', 'Pune'];
  const vibes = ['All', 'Chill', 'High Energy', 'Deep Conversations', 'Creative'];

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

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

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast("Successfully logged in!");
    } catch (error) {
      console.error("Login error:", error);
      showToast(error.message, 'error');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('home');
    showToast("Logged out successfully");
    // Re-authenticate anonymously so the app doesn't break
    signInAnonymously(auth);
  };

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Events
    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const unsubscribeEvents = onSnapshot(eventsRef, (snapshot) => {
      const eventsData = [];
      snapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsData.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (error) => console.error("Error fetching events:", error));

    // 2. Fetch Memories
    const memoriesRef = collection(db, 'artifacts', appId, 'public', 'data', 'memories');
    const unsubscribeMemories = onSnapshot(memoriesRef, (snapshot) => {
      const memData = [];
      snapshot.forEach((doc) => memData.push({ id: doc.id, ...doc.data() }));
      setMemories(memData.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => console.error("Error fetching memories:", error));

    // 3. Fetch Global Settings (Ads)
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setGlobalSettings(docSnap.data());
      }
    }, (error) => console.error("Error fetching settings:", error));

    return () => {
      unsubscribeEvents();
      unsubscribeMemories();
      unsubscribeSettings();
    };
  }, [user]);

  // This genius function allows us to upload photos directly to the free database without Firebase Storage!
  const compressImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Compress width
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // 0.7 quality output reduces size drastically so it fits in Firestore
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const [newEvent, setNewEvent] = useState({
    title: '', date: '', time: '', venue: '', price: '', description: '', vibe: 'Chill', imageUrl: ''
  });

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    setIsSubmitting(true);
    try {
      const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
      await addDoc(eventsRef, {
        ...newEvent,
        imageUrl: newEvent.imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        hostId: user.uid,
        hostEmail: user.email,
        attendees: [],
        createdAt: Date.now()
      });
      showToast("Event published successfully!");
      setCurrentView('discover');
      setNewEvent({ title: '', date: '', time: '', venue: '', price: '', description: '', vibe: 'Chill', imageUrl: '' });
    } catch (error) {
      console.error("Error adding event: ", error);
      showToast("Failed to create event.", 'error');
    }
    setIsSubmitting(false);
  };

  const handleRSVP = async (eventId) => {
    if (!user || user.isAnonymous) {
        showToast("Please log in with Google to RSVP!", "error");
        return;
    }
    try {
      const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
      await updateDoc(eventRef, { attendees: arrayUnion(user.uid) });
      showToast("You are on the list! See you there.");
    } catch (error) {
      console.error("Error RSVPing: ", error);
    }
  };

  const [memoryType, setMemoryType] = useState('photo'); // 'photo' or 'video'
  const [videoUrl, setVideoUrl] = useState('');
  
  const handleMemoryUpload = async (e) => {
    if (!isAdmin) return;
    const file = e.target.files[0];
    if (!file) return;
    
    setIsSubmitting(true);
    try {
      showToast("Compressing and uploading image...", "success");
      const base64Image = await compressImageToBase64(file);
      
      const memoriesRef = collection(db, 'artifacts', appId, 'public', 'data', 'memories');
      await addDoc(memoriesRef, {
        type: 'photo',
        url: base64Image,
        createdAt: Date.now()
      });
      showToast("Photo added to Memory Wall!");
    } catch (error) {
      console.error(error);
      showToast("Upload failed.", "error");
    }
    setIsSubmitting(false);
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !videoUrl) return;
    setIsSubmitting(true);
    try {
      const memoriesRef = collection(db, 'artifacts', appId, 'public', 'data', 'memories');
      await addDoc(memoriesRef, {
        type: 'video',
        url: videoUrl,
        createdAt: Date.now()
      });
      showToast("Video link added to Memory Wall!");
      setVideoUrl('');
    } catch (error) {
      console.error(error);
      showToast("Failed to add video.", "error");
    }
    setIsSubmitting(false);
  };

  const deleteMemory = async (id) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'memories', id));
      showToast("Memory deleted.");
    } catch (error) {
        console.error(error);
    }
  };

  const [adData, setAdData] = useState({ link: '' });
  const handleAdUpload = async (e) => {
    if (!isAdmin) return;
    const file = e.target.files[0];
    if (!file) return;
    
    setIsSubmitting(true);
    try {
      showToast("Uploading Ad Banner...", "success");
      const base64Image = await compressImageToBase64(file);
      
      const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global');
      await setDoc(settingsRef, {
        adBanner: {
            imageUrl: base64Image,
            link: adData.link
        }
      }, { merge: true });
      showToast("Ad Banner updated successfully!");
    } catch (error) {
      console.error(error);
      showToast("Upload failed.", "error");
    }
    setIsSubmitting(false);
  };

  const clearAdBanner = async () => {
      if(!isAdmin) return;
      const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'global');
      await setDoc(settingsRef, { adBanner: null }, { merge: true });
      showToast("Ad Banner removed.");
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
    <div className="w-full bg-[#FDFBF7]">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-20 relative bg-cover bg-center bg-fixed" style={{ backgroundImage: "linear-gradient(rgba(74, 59, 50, 0.75), rgba(212, 136, 71, 0.65)), url('https://images.unsplash.com/photo-1543807535-eceef0bc6599?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
        <div className="px-4 max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center z-10">
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
            
            <div className="flex flex-wrap gap-4">
              <button onClick={() => setCurrentView('discover')} className="bg-[#D48847] text-white px-8 py-3 rounded-full font-bold hover:bg-[#4A3B32] transition-colors shadow-lg flex items-center gap-2">
                <Search size={18} /> Discover Events
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Banner Section (Controlled by Admin) */}
      {globalSettings?.adBanner?.imageUrl && (
        <section className="py-12 bg-[#FDFBF7] px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-widest text-center">Featured Advertisement</div>
            <a href={globalSettings.adBanner.link || '#'} target="_blank" rel="noopener noreferrer" className="block relative w-full h-48 md:h-72 rounded-[2rem] overflow-hidden shadow-2xl group border-4 border-white cursor-pointer">
              <img src={globalSettings.adBanner.imageUrl} alt="Advertisement" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#4A3B32] shadow-lg flex items-center gap-1">
                Sponsored <Star size={12} className="text-[#D48847]" />
              </div>
            </a>
          </div>
        </section>
      )}

      {/* Memory Wall Section */}
      {memories.length > 0 && (
          <section className="py-16 bg-white border-y border-[#F3E8D8] px-4">
              <div className="max-w-7xl mx-auto">
                  <div className="flex flex-col items-center text-center mb-10">
                      <div className="w-16 h-16 bg-[#F3E8D8] rounded-full flex items-center justify-center mb-4">
                          <Camera className="text-[#D48847]" size={32} />
                      </div>
                      <h2 className="text-4xl font-bold text-[#4A3B32]">Funfinity Memory Wall</h2>
                      <p className="text-[#4A3B32]/70 mt-2">Moments captured from our recent experiences.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {memories.map((mem) => (
                          <div key={mem.id} className="relative rounded-2xl overflow-hidden aspect-square shadow-sm hover:shadow-xl transition-all group">
                              {mem.type === 'photo' ? (
                                  <img src={mem.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Memory" />
                              ) : (
                                  <div className="w-full h-full bg-black flex items-center justify-center relative">
                                      <img src={`https://img.youtube.com/vi/${mem.url.split('v=')[1]?.split('&')[0] || mem.url.split('/').pop()}/0.jpg`} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" alt="Video thumbnail" />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center">
                                            <Video className="text-white" size={24} />
                                          </div>
                                      </div>
                                  </div>
                              )}
                              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Heart className="text-white fill-white shadow-lg" size={20} />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </section>
      )}

    </div>
  );

  const renderCreateEvent = () => {
    // SECURITY LOCK: Only Super Admins can see this page
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 w-full">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-lg border border-[#F3E8D8]">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="text-red-500" size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-[#4A3B32] mb-4">Verification Required</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        To maintain a safe and premium community, only Verified Hosts can create events on Funfinity. 
                        Interested in hosting an amazing experience?
                    </p>
                    <a href="mailto:tilakdongare064@gmail.com" className="inline-flex items-center gap-2 bg-[#4A3B32] text-white px-8 py-4 rounded-full font-bold hover:bg-black transition-all shadow-lg hover:-translate-y-1">
                        <MessageCircle size={20} /> Apply to become a Host
                    </a>
                </div>
            </div>
        );
    }

    // Actual Create Event Form for Admins
    return (
        <div className="max-w-2xl mx-auto w-full bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-[#F3E8D8] mt-8 mb-20">
            <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-[#F3E8D8] rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-[#D48847]" size={32} />
                </div>
                <h2 className="text-3xl font-bold text-[#4A3B32] mb-2">Host an Event</h2>
                <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold mt-2">
                    <ShieldCheck size={14} /> Admin Privileges Verified
                </div>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-[#4A3B32] mb-1">Event Title</label>
                    <input required type="text" placeholder="e.g., Acoustic Campfire Jam" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white" />
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
                        <label className="block text-sm font-bold text-[#4A3B32] mb-1">Venue</label>
                        <input required type="text" placeholder="e.g., La Casa Cafe" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#4A3B32] mb-1">Price (₹)</label>
                        <input type="number" placeholder="Leave empty if Free" value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#4A3B32] mb-1">Cover Image URL</label>
                    <input type="url" placeholder="https://..." value={newEvent.imageUrl} onChange={e => setNewEvent({...newEvent, imageUrl: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white" />
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#4A3B32] mb-1">Description</label>
                    <textarea required rows="3" placeholder="What is this event about?" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white"></textarea>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-[#D48847] text-white py-4 rounded-xl font-bold hover:bg-[#b87439] transition-colors disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                    <PlusCircle size={20} /> {isSubmitting ? 'Publishing...' : 'Publish Event'}
                </button>
            </form>
        </div>
    );
  };

  const renderAdminDashboard = () => {
    if (!isAdmin) return null;

    return (
        <div className="max-w-5xl mx-auto w-full px-4 mt-8 pb-24">
            <div className="mb-8">
                <h2 className="text-4xl font-bold text-[#4A3B32] mb-2 flex items-center gap-3">
                    <ShieldCheck className="text-purple-600" size={40} /> Admin Command Center
                </h2>
                <p className="text-gray-500 font-medium">Welcome back, Super Admin. Manage your platform here.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Memory Wall Uploader */}
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-[#F3E8D8]">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <Camera className="text-[#D48847]" size={28} />
                        <h3 className="text-2xl font-bold text-[#4A3B32]">Add to Memory Wall</h3>
                    </div>
                    
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                        <button onClick={() => setMemoryType('photo')} className={`flex-1 py-2 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors ${memoryType === 'photo' ? 'bg-white shadow text-[#D48847]' : 'text-gray-500'}`}>
                            <ImageIcon size={16} /> Upload Photo
                        </button>
                        <button onClick={() => setMemoryType('video')} className={`flex-1 py-2 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors ${memoryType === 'video' ? 'bg-white shadow text-[#D48847]' : 'text-gray-500'}`}>
                            <Video size={16} /> Link Video
                        </button>
                    </div>

                    {memoryType === 'photo' ? (
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors">
                                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                                <p className="text-sm text-gray-500 mb-4">Select an image from your computer or phone.<br/>It will be compressed automatically to save space!</p>
                                <label className="cursor-pointer bg-[#4A3B32] hover:bg-black text-white px-6 py-3 rounded-full font-bold transition-colors inline-block">
                                    Browse Files
                                    <input type="file" accept="image/*" className="hidden" onChange={handleMemoryUpload} disabled={isSubmitting} />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleVideoSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">YouTube Video Link</label>
                                <input required type="url" placeholder="https://www.youtube.com/watch?v=..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#D48847]" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-[#D48847] text-white py-3 rounded-xl font-bold hover:bg-[#b87439] transition-colors shadow-md">
                                {isSubmitting ? 'Adding...' : 'Add Video to Wall'}
                            </button>
                        </form>
                    )}

                    {/* Manage Existing Memories */}
                    <div className="mt-8">
                        <h4 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">Manage Recent Memories</h4>
                        <div className="flex overflow-x-auto gap-3 pb-2">
                            {memories.map(mem => (
                                <div key={mem.id} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 group shadow-sm border border-gray-200">
                                    <img src={mem.type === 'photo' ? mem.url : `https://img.youtube.com/vi/${mem.url.split('v=')[1]?.split('&')[0] || mem.url.split('/').pop()}/default.jpg`} className="w-full h-full object-cover" />
                                    <button onClick={() => deleteMemory(mem.id)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="text-red-400 hover:text-red-500" size={24} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Advertisement Uploader */}
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-[#F3E8D8]">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                            <Star className="text-yellow-500 fill-yellow-500" size={28} />
                            <h3 className="text-2xl font-bold text-[#4A3B32]">Homepage Ad Banner</h3>
                        </div>
                        {globalSettings?.adBanner && (
                            <button onClick={clearAdBanner} className="text-xs text-red-500 font-bold hover:underline">Remove Current Ad</button>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                <LinkIcon size={14} /> Where should this Ad link to? (Optional)
                            </label>
                            <input type="url" placeholder="https://..." value={adData.link} onChange={e => setAdData({...adData, link: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-yellow-400 mb-4" />
                        </div>

                        <div className="border-2 border-dashed border-yellow-300 bg-yellow-50 rounded-2xl p-6 text-center hover:bg-yellow-100 transition-colors">
                            <Upload className="mx-auto text-yellow-500 mb-2" size={32} />
                            <p className="text-sm text-yellow-700 font-medium mb-4">Upload a wide Banner Image (16:9 recommended).</p>
                            <label className="cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-full font-bold transition-colors inline-block shadow-md">
                                Upload Ad Image
                                <input type="file" accept="image/*" className="hidden" onChange={handleAdUpload} disabled={isSubmitting} />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans selection:bg-[#D48847] selection:text-white flex flex-col items-center relative">
      
      {/* Premium Toast Notification */}
      <div className={`fixed top-24 right-4 z-50 transition-all duration-300 transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
          <div className={`px-6 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#4A3B32] text-white'}`}>
              {toast.type === 'error' ? <Info size={20} /> : <ShieldCheck size={20} className="text-green-400" />}
              {toast.message}
          </div>
      </div>

      <nav className="bg-[#FDFBF7]/90 backdrop-blur-md sticky top-0 z-40 border-b border-[#F3E8D8] transition-all w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('home')}>
              <Logo size={40} />
              <span className="font-bold text-2xl text-[#4A3B32] tracking-tight group-hover:text-[#D48847] transition-colors">Funfinity</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 bg-white px-6 py-2 rounded-full shadow-sm border border-gray-100">
              <button onClick={() => setCurrentView('home')} className={`font-bold text-sm transition-colors ${currentView === 'home' ? 'text-[#D48847]' : 'text-[#4A3B32] hover:text-[#D48847]'}`}>Story</button>
              
              {/* Conditional Admin Button */}
              {isAdmin && (
                  <button onClick={() => setCurrentView('admin')} className={`font-bold text-sm flex items-center gap-1 transition-colors ${currentView === 'admin' ? 'text-purple-600' : 'text-purple-400 hover:text-purple-600'}`}>
                      <ShieldCheck size={16} /> Admin Zone
                  </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {user && !user.isAnonymous ? (
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col text-right">
                        <span className="text-xs font-bold text-[#4A3B32]">{user.email?.split('@')[0]}</span>
                        {isAdmin && <span className="text-[10px] text-purple-600 font-bold uppercase">Super Admin</span>}
                    </div>
                    <button onClick={handleLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-600 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-inner" title="Log Out">
                        <LogOut size={16} />
                    </button>
                  </div>
              ) : (
                  <button onClick={handleGoogleLogin} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2 rounded-full font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm">
                      <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                      Login
                  </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow w-full flex flex-col items-center">
        {currentView === 'home' && renderHome()}
        {currentView === 'create' && renderCreateEvent()}
        {currentView === 'admin' && renderAdminDashboard()}
      </main>

      {/* Global App Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 flex justify-around p-2 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'home' ? 'text-[#D48847]' : 'text-gray-400'}`}>
          <Home size={22} strokeWidth={currentView === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">Story</span>
        </button>
        <button onClick={() => setCurrentView('create')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'create' ? 'text-[#D48847]' : 'text-gray-400'}`}>
          <PlusCircle size={22} strokeWidth={currentView === 'create' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">Host</span>
        </button>
        {isAdmin && (
            <button onClick={() => setCurrentView('admin')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'admin' ? 'text-purple-600' : 'text-gray-400'}`}>
                <ShieldCheck size={22} strokeWidth={currentView === 'admin' ? 2.5 : 2} />
                <span className="text-[10px] font-bold mt-0.5">Admin</span>
            </button>
        )}
      </div>
    </div>
  );
}
