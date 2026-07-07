import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { MapPin, Calendar, Users, PlusCircle, Home, ShieldCheck, Search, Flame, Music, Camera, Sun, Heart, Star, MessageCircle, Rocket, Smile, Info, Map, Navigation, Coffee, Sparkles } from 'lucide-react';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'funfinity-app-id';

export default function FunfinityApp() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'discover', 'venues', 'create', 'add-venue'
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeVibeFilter, setActiveVibeFilter] = useState('All');
  const [activeCityFilter, setActiveCityFilter] = useState('All India');

  const cities = ['All India', 'Belagavi', 'Bengaluru', 'Mumbai', 'Goa', 'Delhi', 'Pune'];
  const vibes = ['All', 'Chill', 'High Energy', 'Deep Conversations', 'Creative'];

  const panIndiaVenues = [
    { id: 1, name: "La Casa Cafe", city: "Belagavi", type: "Cozy Cafe", capacity: "60+", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rating: 4.8 },
    { id: 2, name: "The Bombay Canteen", city: "Mumbai", type: "Restaurant & Bar", capacity: "150+", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rating: 4.8 },
    { id: 3, name: "Thalassa", city: "Goa", type: "Beachfront Lounge", capacity: "200+", image: "https://images.unsplash.com/photo-1515515535567-c205391e4db9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rating: 4.9 },
    { id: 4, name: "Piano Man Jazz Club", city: "Delhi", type: "Live Music", capacity: "100+", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", rating: 4.8 },
  ];

  const filteredVenues = useMemo(() => {
    if (activeCityFilter === 'All India') return panIndiaVenues;
    return panIndiaVenues.filter(v => v.city === activeCityFilter);
  }, [activeCityFilter]);

  const [newEvent, setNewEvent] = useState({
    title: '', date: '', time: '', venue: '', price: '', description: '', vibe: 'Chill', imageUrl: ''
  });

  const [newVenue, setNewVenue] = useState({
    name: '', city: 'Belagavi', type: 'Cafe', capacity: '', mapLink: '',
  });

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
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const unsubscribeEvents = onSnapshot(eventsRef, (snapshot) => {
      const eventsData = [];
      snapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsData.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });
    return () => unsubscribeEvents();
  }, [user]);

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

      return () => {
        revealElements.forEach((el) => observer.unobserve(el));
      };
    }
  }, [currentView]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
      await addDoc(eventsRef, {
        ...newEvent,
        imageUrl: newEvent.imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        hostId: user.uid,
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

  const handleRSVP = async (eventId) => {
    if (!user) return;
    try {
      const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
      await updateDoc(eventRef, { attendees: arrayUnion(user.uid) });
    } catch (error) {
      console.error("Error RSVPing: ", error);
    }
  };

  const handleAddVenue = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentView('venues');
      setNewVenue({ name: '', city: 'Belagavi', type: 'Cafe', capacity: '', mapLink: '' });
    }, 1500);
  };

  const filteredEvents = useMemo(() => {
    if (activeVibeFilter === 'All') return events;
    return events.filter(e => e.vibe === activeVibeFilter);
  }, [events, activeVibeFilter]);

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
      <section 
        className="min-h-screen flex items-center pt-20 relative bg-cover bg-center bg-fixed"
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
              <button onClick={() => setCurrentView('discover')} className="bg-[#D48847] text-white px-8 py-3 rounded-full font-bold hover:bg-[#4A3B32] transition-colors shadow-lg flex items-center gap-2">
                <Search size={18} /> Discover Events
              </button>
              
              {/* Android App Coming Soon Badge */}
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-5 py-2 border border-white/10 opacity-90 cursor-default">
                <Smile className="text-green-400" size={24} />
                <div className="text-white text-left">
                  <div className="text-[10px] leading-tight text-green-400 font-bold uppercase tracking-wider">Coming Soon on</div>
                  <div className="text-sm font-bold leading-tight">Android App</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile App Mockup Visual */}
          <div className="hidden md:flex justify-center reveal opacity-0 translate-y-8 transition-all duration-700 delay-300">
            <div className="relative w-72 h-[600px] bg-white rounded-[3rem] border-[8px] border-[#4A3B32] shadow-2xl overflow-hidden flex flex-col">
              <div className="bg-[#FDFBF7] p-4 pb-2 border-b border-gray-100 shrink-0">
                <div className="flex justify-between items-center mb-4 mt-2">
                  <div className="font-bold text-xl text-[#4A3B32] flex items-center gap-2"><Logo size={24} /> Funfinity</div>
                  <div className="w-8 h-8 rounded-full bg-[#D48847]/20 flex items-center justify-center">
                    <Heart size={16} className="text-[#D48847]" />
                  </div>
                </div>
                <div className="bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
                  <MapPin size={14} /> Belagavi
                </div>
              </div>
              <div className="p-4 space-y-4 flex-grow bg-gray-50 overflow-hidden">
                <h3 className="font-bold text-sm text-[#4A3B32]">Happening Tonight</h3>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  <img src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" className="w-full h-32 object-cover" alt="Jam" />
                  <div className="p-3">
                    <div className="text-xs text-[#D48847] font-bold mb-1">AUG 15 • 7:00 PM</div>
                    <div className="font-bold text-sm leading-tight mb-2 text-[#4A3B32]">Acoustic Campfire Jam</div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center"><ShieldCheck size={12} className="text-blue-500 mr-1" /> Verified</span>
                      <span className="bg-[#4A3B32] text-white px-3 py-1 rounded-full font-bold">₹499</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white border-t border-gray-100 p-4 flex justify-between px-6 shrink-0 text-gray-400">
                <Home className="text-[#D48847]" size={20} />
                <Search size={20} />
                <PlusCircle size={20} />
                <Map size={20} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Events Section */}
      <section className="py-24 bg-[#FDFBF7] px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12 reveal opacity-0 translate-y-8 transition-all duration-700">
            <div>
              <h2 className="text-4xl font-bold text-[#4A3B32] mb-2">Trending in Belagavi</h2>
              <p className="text-[#4A3B32]/70">Discover experiences hosted by verified creators.</p>
            </div>
            <button onClick={() => setCurrentView('discover')} className="hidden sm:inline-block text-[#D48847] font-bold hover:underline flex items-center gap-1">
              View All Events <Sparkles size={16} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* We map the top 3 live events, or show placeholders if empty */}
            {(events.length > 0 ? events.slice(0, 3) : [
              { id: 'demo1', title: 'Indie Music Sundowner', date: '2026-08-22', time: '18:00', venue: 'The Rustic Cafe', price: '399', imageUrl: 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', host: 'Tilak' },
              { id: 'demo2', title: 'Monsoon Trek & Breakfast', date: '2026-08-23', time: '05:00', venue: 'Central Bus Stand', price: '600', imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', host: 'Trekkers' },
              { id: 'demo3', title: 'Board Game Mixer Night', date: '2026-08-28', time: '19:00', venue: 'The Library Cafe', price: '200', imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', host: 'Priya' }
            ]).map((event, index) => (
              <div key={event.id} className={`reveal opacity-0 translate-y-8 transition-all duration-700 delay-${index * 100} bg-white rounded-2xl overflow-hidden shadow-lg border border-[#F3E8D8] cursor-pointer group`} onClick={() => setCurrentView('discover')}>
                <div className="relative overflow-hidden h-56">
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold shadow-sm flex items-center text-[#4A3B32]">
                    <Sparkles size={14} className="text-[#D48847] mr-1" /> Filling Fast
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#D48847] mb-2 uppercase tracking-wide">
                    <Calendar size={14} /> {event.date} • {event.time}
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-[#D48847] transition-colors text-[#4A3B32]">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-[#4A3B32]/70 mb-4">
                    <MapPin size={14} /> {event.venue}
                  </div>
                  <hr className="border-gray-100 mb-4" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#D48847] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {(event.host || "H")[0].toUpperCase()}
                      </div>
                      <div className="text-xs">
                        <div className="text-gray-500">Hosted by</div>
                        <div className="font-bold flex items-center gap-1 text-[#4A3B32]">Verified Host <ShieldCheck size={10} className="text-blue-500" /></div>
                      </div>
                    </div>
                    <button className="bg-[#F3E8D8] text-[#4A3B32] hover:bg-[#D48847] hover:text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm">
                      {event.price && event.price !== "0" ? `₹${event.price}` : 'Free'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Host Section */}
      <section className="py-24 bg-[#4A3B32] text-[#FDFBF7] px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
            <div className="inline-block bg-[#D48847]/20 text-[#D48847] px-4 py-1 rounded-full text-sm font-bold mb-6 border border-[#D48847]/30 flex items-center gap-2 w-max">
              <Star size={16} /> Creator Program
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Become a <span className="text-[#D48847]">Verified Host</span>.</h2>
            <p className="text-lg text-[#F3E8D8]/80 mb-8">
              Got a great idea for a party, a workshop, or a trek? Funfinity provides the platform, the audience, and the ticketing system. You just bring the vibe.
            </p>
            
            <div className="space-y-6">
              {[
                { step: '1', title: 'Apply & Get Verified', desc: 'Safety is our priority. All hosts undergo a strict ID and quality check.' },
                { step: '2', title: 'List Your Event', desc: 'Set your price, capacity, and venue. Our app handles the bookings and payments.' },
                { step: '3', title: 'Earn & Grow', desc: 'Build your own community following within the Funfinity ecosystem.' }
              ].map(item => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-[#D48847] font-bold text-xl shrink-0">{item.step}</div>
                  <div>
                    <h4 className="font-bold text-xl mb-1">{item.title}</h4>
                    <p className="text-sm text-[#F3E8D8]/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={() => setCurrentView('create')} className="mt-10 bg-[#D48847] hover:bg-orange-500 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg transform hover:-translate-y-1">
              Apply to Host
            </button>
          </div>
          
          <div className="relative reveal opacity-0 translate-y-8 transition-all duration-700 delay-200 hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#D48847]/20 to-transparent rounded-[3rem] transform rotate-3"></div>
            <img src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Hosting" className="relative rounded-[3rem] shadow-2xl object-cover h-[600px] w-full transform -rotate-3 hover:rotate-0 transition-transform duration-500" />
            <div className="absolute bottom-10 left-10 bg-white text-[#4A3B32] p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center text-xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="font-bold">Tickets Sold Out!</div>
                <div className="text-xs text-gray-500">₹15,000 earned</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Venue Partner Section */}
      <section className="py-24 bg-[#F3E8D8] px-4">
        <div className="max-w-7xl mx-auto text-center reveal opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-4xl font-bold text-[#4A3B32] mb-6">Are you a Cafe or Venue Owner?</h2>
          <p className="text-lg text-[#4A3B32]/80 max-w-2xl mx-auto mb-10">
            List your space on Funfinity. Let verified hosts book your venue for their events, showcase your digital menu on our app, and drive high-quality foot traffic to your business.
          </p>
          <button onClick={() => setCurrentView('add-venue')} className="inline-flex items-center gap-2 bg-[#4A3B32] text-white px-8 py-4 rounded-full font-bold transition-all hover:shadow-xl hover:bg-black">
            <Coffee size={20} /> Partner With Us
          </button>
        </div>
      </section>
    </div>
  );

  const renderDiscover = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      
      {/* FEATURED EVENT: STRANGERS MEETUP */}
      <div className="bg-[#FFF9F2] rounded-[2.5rem] border-2 border-[#D48847]/20 p-6 md:p-10 shadow-lg relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
        <div className="absolute top-4 right-10 text-[#D48847]/20"><Star size={60} fill="currentColor" /></div>
        <div className="absolute bottom-4 left-10 text-[#4A3B32]/10"><Heart size={80} fill="currentColor" /></div>
        
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
            <div className="flex gap-4 items-start bg-white/60 p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#4A3B32] text-[#F3E8D8] rounded-full flex items-center justify-center shrink-0 shadow-md">
                <Coffee size={24} />
              </div>
              <div>
                <h4 className="font-bold text-[#4A3B32]">COFFEE ON US!</h4>
                <p className="text-sm text-[#4A3B32]/70">A warm cup of coffee to get you started.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start bg-white/60 p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#D48847] text-white rounded-full flex items-center justify-center shrink-0 shadow-md">
                <Users size={24} />
              </div>
              <div>
                <h4 className="font-bold text-[#4A3B32]">MORE FUNS. MORE SURPRISES.</h4>
                <p className="text-sm text-[#4A3B32]/70">An evening full of laughter, connections & surprises you didn't see coming!</p>
              </div>
            </div>
          </div>

          <a href="https://chat.whatsapp.com/KNHPGQzwqtr4nWBIQcZyXH" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-gradient-to-r from-[#D48847] to-[#e09b5f] hover:from-[#4A3B32] hover:to-[#2c221c] text-white px-8 py-4 rounded-full font-bold shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg">
            <Navigation size={20} /> Register Now
          </a>
        </div>

        <div className="flex-1 relative z-10 w-full h-[400px] md:h-auto rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
          <img src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Strangers Meetup" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 text-white text-center">
            <p className="font-medium text-lg italic drop-shadow-md">"Come for coffee, stay for connections. Let's make unforgettable memories together!"</p>
          </div>
        </div>
      </div>
      
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
          <button 
            key={vibe} 
            onClick={() => setActiveVibeFilter(vibe)}
            className={`whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-all ${activeVibeFilter === vibe ? 'bg-[#4A3B32] text-white shadow-md' : 'bg-white text-[#4A3B32] border border-[#F3E8D8] hover:border-[#D48847]'}`}
          >
            {vibe === 'Chill' && '☕ '}{vibe === 'High Energy' && '⚡ '}{vibe === 'Deep Conversations' && '🌙 '}{vibe === 'Creative' && '🎨 '}
            {vibe}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D48847]"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#F3E8D8] shadow-sm">
          <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-[#4A3B32] mb-2">No {activeVibeFilter !== 'All' ? activeVibeFilter.toLowerCase() : ''} events found</h3>
          <p className="text-gray-500 mb-6">Be the first to host this kind of vibe in Belagavi!</p>
          <button onClick={() => setCurrentView('create')} className="bg-[#4A3B32] text-white px-6 py-2 rounded-full font-bold hover:bg-black transition-colors">Create Event</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => {
            const isAttending = event.attendees?.includes(user?.uid);
            const isHost = event.hostId === user?.uid;

            return (
              <div key={event.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-[#F3E8D8] flex flex-col h-full group">
                <div className="h-48 overflow-hidden relative shrink-0">
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#4A3B32] shadow flex items-center gap-1">
                    ₹{event.price || 'Free'}
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                    <Camera size={12} className="text-[#D48847]" /> Memory Wall enabled
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#D48847] uppercase tracking-wide">
                      <Calendar size={14} /> {event.date} • {event.time}
                    </div>
                    <span className="bg-[#F3E8D8] text-[#4A3B32] text-[10px] px-2 py-1 rounded-md font-bold">{event.vibe}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-[#4A3B32] mb-2">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <MapPin size={16} /> {event.venue}
                  </div>
                  <p className="text-sm text-gray-600 mb-6 line-clamp-3 flex-grow">{event.description}</p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                        <Users size={14} className="text-[#D48847]"/> {event.attendees?.length || 0} Attending
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                        <ShieldCheck size={12} className="text-blue-500"/> Verified Host
                      </div>
                    </div>
                    
                    {isHost ? (
                      <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm border border-gray-200">Manage</span>
                    ) : isAttending ? (
                      <span className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1 border border-green-200">
                        <ShieldCheck size={16} /> Booked
                      </span>
                    ) : (
                      <button onClick={() => handleRSVP(event.id)} className="bg-[#4A3B32] hover:bg-black text-white px-6 py-2 rounded-xl font-bold text-sm transition-colors shadow-md">
                        RSVP
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

  const renderVenues = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:flex-end gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-bold text-[#4A3B32] bg-clip-text text-transparent bg-gradient-to-r from-[#4A3B32] to-[#D48847]">Explore Venues Across India</h2>
          <p className="text-[#4A3B32]/70 font-medium mt-1">Find the perfect aesthetic space to host your next gathering.</p>
        </div>
        <button onClick={() => setCurrentView('add-venue')} className="bg-[#F3E8D8] text-[#4A3B32] border border-[#D48847]/30 px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-[#D48847] hover:text-white transition-all shadow-sm">
          <PlusCircle size={18} /> Partner Your Venue
        </button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {cities.map(city => (
          <button 
            key={city} 
            onClick={() => setActiveCityFilter(city)}
            className={`whitespace-nowrap px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${activeCityFilter === city ? 'bg-gradient-to-r from-[#D48847] to-[#e09b5f] text-white shadow-lg transform scale-105' : 'bg-white text-[#4A3B32] border border-[#F3E8D8] hover:border-[#D48847] hover:bg-orange-50'}`}
          >
            {city === 'All India' ? '🗺️ ' : '📍 '}{city}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
        {filteredVenues.map(venue => (
          <div key={venue.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-[#F3E8D8] flex flex-col group relative">
            <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-[#4A3B32] shadow-lg flex items-center gap-1 border border-white/20">
              <Star size={12} className="text-yellow-500 fill-yellow-500" /> {venue.rating}
            </div>
            <div className="h-56 overflow-hidden relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-0"></div>
              <img src={venue.image} alt={venue.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-4 left-4 z-10">
                <span className="bg-[#D48847] text-white text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider shadow-md">{venue.type}</span>
              </div>
            </div>
            <div className="p-6 flex flex-col flex-grow relative bg-white">
              <div className="absolute -top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-[#F3E8D8] group-hover:-translate-y-2 transition-transform duration-300">
                <Coffee className="text-[#D48847]" size={20} />
              </div>
              <h3 className="text-2xl font-bold text-[#4A3B32] mb-1 group-hover:text-[#D48847] transition-colors">{venue.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 font-medium">
                <Navigation size={14} className="text-[#D48847]" /> {venue.city}, India
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                    <Users size={14} className="text-[#D48847]"/> Capacity: {venue.capacity}
                  </div>
                </div>
                <button onClick={() => setCurrentView('create')} className="bg-[#4A3B32] hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2">
                  Host Here
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAddVenue = () => (
    <div className="max-w-2xl mx-auto w-full bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-[#F3E8D8] animate-in slide-in-from-bottom-8 duration-500 pb-24 md:pb-10 mt-8">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-[#F3E8D8] rounded-full flex items-center justify-center mx-auto mb-4">
          <Map className="text-[#D48847]" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-[#4A3B32] mb-2">Partner Your Venue</h2>
        <p className="text-gray-500">List your Cafe, Lounge, or Space on Funfinity. It's 100% Free.</p>
        
        <div className="mt-4 bg-green-50 text-green-800 text-xs p-3 rounded-xl flex items-start gap-2 text-left border border-green-100">
          <ShieldCheck size={16} className="shrink-0 mt-0.5" />
          <p><strong>Get More Footfall:</strong> When you list your venue, our verified hosts can select your location for their events, bringing high-quality crowds directly to your doors!</p>
        </div>
      </div>
      
      <form onSubmit={handleAddVenue} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-[#4A3B32] mb-1">Venue Name</label>
          <input required type="text" placeholder="e.g., La Casa Cafe" value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none transition-shadow bg-gray-50 focus:bg-white" />
        </div>

        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-6">
          <label className="block text-sm font-bold text-[#4A3B32] mb-2 flex items-center gap-2">
            <Search size={16} className="text-blue-500" /> Search Location (Powered by Google)
          </label>
          <div className="flex gap-2">
            <input type="text" placeholder="Search on Maps..." className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 outline-none bg-white text-sm" />
            <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-md">Search</button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 italic">*When you launch, Google Places API will automatically pull your cafe photos and map pin here!</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-[#4A3B32] mb-1">City</label>
            <select value={newVenue.city} onChange={e => setNewVenue({...newVenue, city: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white">
              {cities.filter(c => c !== 'All India').map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#4A3B32] mb-1">Venue Type</label>
            <select value={newVenue.type} onChange={e => setNewVenue({...newVenue, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white">
              <option value="Cafe">Cafe</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Lounge & Bar">Lounge & Bar</option>
              <option value="Rooftop">Rooftop</option>
              <option value="Studio/Workshop">Studio/Workshop</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#4A3B32] mb-1">Max Capacity</label>
          <input required type="text" placeholder="e.g., 50 people" value={newVenue.capacity} onChange={e => setNewVenue({...newVenue, capacity: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#D48847] outline-none bg-gray-50 focus:bg-white" />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => setCurrentView('venues')} className="flex-1 bg-gray-100 text-[#4A3B32] py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex-[2] bg-[#4A3B32] text-white py-4 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 shadow-lg">
            {isSubmitting ? 'Submitting...' : 'Submit Venue'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderCreateEvent = () => (
    <div className="max-w-2xl mx-auto w-full bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-[#F3E8D8] animate-in slide-in-from-bottom-8 duration-500 pb-24 md:pb-10 mt-8">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-[#F3E8D8] rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="text-[#D48847]" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-[#4A3B32] mb-2">Host an Event</h2>
        <p className="text-gray-500">Create a magical experience for the community. Your event will be reviewed for safety.</p>
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
            <label className="block text-sm font-bold text-[#4A3B32] mb-1">Venue</label>
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

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => setCurrentView('discover')} className="flex-1 bg-gray-100 text-[#4A3B32] py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex-[2] bg-[#4A3B32] text-white py-4 rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
            <PlusCircle size={20} /> {isSubmitting ? 'Publishing...' : 'Publish Event'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans selection:bg-[#D48847] selection:text-white flex flex-col items-center">
      
      {/* Desktop & Top Navigation */}
      <nav className="bg-[#FDFBF7]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#F3E8D8] transition-all w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('home')}>
              <Logo size={40} />
              <span className="font-bold text-2xl text-[#4A3B32] tracking-tight group-hover:text-[#D48847] transition-colors">Funfinity</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 bg-white px-6 py-2 rounded-full shadow-sm border border-gray-100">
              <button onClick={() => setCurrentView('home')} className={`font-bold text-sm transition-colors ${currentView === 'home' ? 'text-[#D48847]' : 'text-[#4A3B32] hover:text-[#D48847]'}`}>Story</button>
              <button onClick={() => setCurrentView('discover')} className={`font-bold text-sm transition-colors ${currentView === 'discover' ? 'text-[#D48847]' : 'text-[#4A3B32] hover:text-[#D48847]'}`}>Discover</button>
              <button onClick={() => setCurrentView('venues')} className={`font-bold text-sm transition-colors ${currentView === 'venues' ? 'text-[#D48847]' : 'text-[#4A3B32] hover:text-[#D48847]'}`}>Venues</button>
              <button onClick={() => setCurrentView('create')} className={`font-bold text-sm transition-colors ${currentView === 'create' ? 'text-[#D48847]' : 'text-[#4A3B32] hover:text-[#D48847]'}`}>Host</button>
            </div>

            <div className="flex items-center gap-3">
              <a href="mailto:tilakdongare064@gmail.com" className="hidden sm:flex items-center gap-2 bg-[#F3E8D8] text-[#4A3B32] px-4 py-2 rounded-full font-bold text-sm hover:bg-[#D48847] hover:text-white transition-colors shadow-sm">
                <MessageCircle size={16} /> Contact Us
              </a>
              {user ? (
                <div className="w-10 h-10 rounded-full bg-[#D48847] flex items-center justify-center text-white font-bold border-2 border-white shadow-sm" title="My Profile">
                  {user.uid.substring(0, 2).toUpperCase()}
                </div>
              ) : (
                <div className="animate-pulse bg-gray-200 w-10 h-10 rounded-full border-2 border-white"></div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Dynamic Content Area */}
      <main className="flex-grow w-full flex flex-col items-center">
        {currentView === 'home' && renderHome()}
        {currentView === 'discover' && renderDiscover()}
        {currentView === 'venues' && renderVenues()}
        {currentView === 'create' && renderCreateEvent()}
        {currentView === 'add-venue' && renderAddVenue()}
      </main>

      {/* Global Footer */}
      <footer className="w-full border-t border-[#F3E8D8] bg-[#FDFBF7] pt-16 pb-24 md:pb-12 text-center mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex justify-center mb-6 cursor-pointer" onClick={() => setCurrentView('home')}>
             <Logo size={60} />
          </div>
          <h3 className="text-2xl font-bold text-[#4A3B32] mb-2">Have questions or want to partner?</h3>
          <p className="text-[#4A3B32]/70 mb-8 max-w-lg mx-auto">We are always looking for amazing venues, hosts, and community members to join the Funfinity family.</p>
          <a href="mailto:tilakdongare064@gmail.com" className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#4A3B32] to-[#2c221c] text-white px-8 py-4 rounded-full font-bold hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <MessageCircle size={20} /> drop an email
          </a>
          
          <div className="mt-16 flex flex-col md:flex-row justify-between items-center w-full border-t border-gray-200 pt-8 px-4 gap-4">
            <p className="text-sm font-medium text-[#4A3B32]/60 uppercase tracking-widest">
              © 2026 Funfinity Social. Founded by Tilak Dongare.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/funfinity.social" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#4A3B32] text-white flex items-center justify-center hover:bg-[#D48847] transition-all transform hover:scale-110 shadow-md">
                <Camera size={18} />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Global App Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 flex justify-around p-2 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'home' ? 'text-[#D48847]' : 'text-gray-400 hover:text-gray-600'}`}>
          <Home size={22} strokeWidth={currentView === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">Story</span>
        </button>
        <button onClick={() => setCurrentView('discover')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'discover' ? 'text-[#D48847]' : 'text-gray-400 hover:text-gray-600'}`}>
          <Search size={22} strokeWidth={currentView === 'discover' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">Events</span>
        </button>
        <button onClick={() => setCurrentView('venues')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'venues' ? 'text-[#D48847]' : 'text-gray-400 hover:text-gray-600'}`}>
          <Map size={22} strokeWidth={currentView === 'venues' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">Venues</span>
        </button>
        <button onClick={() => setCurrentView('create')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16 ${currentView === 'create' ? 'text-[#D48847]' : 'text-gray-400 hover:text-gray-600'}`}>
          <PlusCircle size={22} strokeWidth={currentView === 'create' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-0.5">Host</span>
        </button>
      </div>
    </div>
  );
}
