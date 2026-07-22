// ... existing code ...
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

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

  const handleGoogleLogin = async () => {
// ... existing code ...
  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('home');
    showToast("Logged out successfully");
  };

  useEffect(() => {
    // 1. Fetch Events
    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const unsubscribeEvents = onSnapshot(eventsRef, (snapshot) => {
// ... existing code ...
  const handleRSVP = async (eventId) => {
    if (!user) {
        setShowAuthModal(true);
        showToast("Please log in to RSVP!", "error");
        return;
    }
    try {
      const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId);
// ... existing code ...
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => {
            const isAttending = event.attendees?.includes(user?.uid);
            const isHost = user && event.hostId === user.uid;

            return (
              <div key={event.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-[#F3E8D8] flex flex-col h-full group">
// ... existing code ...
