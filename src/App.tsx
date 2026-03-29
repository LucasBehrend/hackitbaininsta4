import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Package } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import useAuthStore, { type UserProfile } from './store/useAuthStore';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Products from './pages/Products';
import Auth from './pages/Auth';
import Cart from './pages/Cart';
import CheckoutResult from './pages/CheckoutResult';
import Orders from './pages/Orders';
import AdminOrders from './pages/AdminOrders';
import Profile from './pages/Profile';
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
        let admin = 0;
        if (userDoc.exists()) {
          neighborhood = userDoc.data().neighborhood || '';
          lote = userDoc.data().lote || '';
          if (userDoc.data().admin === undefined) {
            await updateDoc(userDocRef, { admin: 0 });
          }
          admin = userDoc.data().admin ?? 0;
        }

        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Usuario',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined,
          neighborhood,
          lote,
          admin,
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
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/result" element={<CheckoutResult />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin" element={<AdminOrders />} />
          <Route path="/perfil" element={<Profile />} />
        </Routes>
      </main>
      <footer className="bg-gray-950 text-gray-400 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 font-bold text-white">
            <div className="bg-blue-900 p-1.5 rounded-lg">
              <Package className="h-4 w-4 text-white" />
            </div>
            CoMarket
          </div>
          <div className="text-center text-xs text-gray-500">
            © 2026 · Equipo ininsta · HackItBA 2026
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
