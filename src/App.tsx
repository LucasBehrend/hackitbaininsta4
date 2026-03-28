import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import useAuthStore, { type UserProfile } from './store/useAuthStore';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Products from './pages/Products';
import Auth from './pages/Auth';
import Cart from './pages/Cart';
import CheckoutResult from './pages/CheckoutResult';
import Orders from './pages/Orders';
import { Loader2 } from 'lucide-react';

function App() {
  const { setUser, setLoading, loading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user profile data from Firestore (like neighborhood)
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        let neighborhood = '';
        let lote = '';
        if (userDoc.exists()) {
          neighborhood = userDoc.data().neighborhood || '';
          lote = userDoc.data().lote || '';
        }

        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Usuario',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined,
          neighborhood,
          lote,
        };
        setUser(userProfile);

        // If logged in but no neighborhood, user might have refreshed mid-registration
        if (!neighborhood && window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/result" element={<CheckoutResult />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
