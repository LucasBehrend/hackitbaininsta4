import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { Package, AlertCircle, Eye, EyeOff } from 'lucide-react';
import useAuthStore, { type UserProfile } from '../store/useAuthStore';

type AuthTab = 'login' | 'register';

export default function Auth() {
  const [tab, setTab] = useState<AuthTab>('login');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register fields
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Neighborhood step
  const [neighborhood, setNeighborhood] = useState('');
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [neighborhoodAddress, setNeighborhoodAddress] = useState('');
  const [lote, setLote] = useState('');
  const [needsNeighborhood, setNeedsNeighborhood] = useState(false);
  const [pendingUser, setPendingUser] = useState<FirebaseUser | null>(null);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([
    'Los Sauces', 'El Cantón', 'Nordelta', 'San Sebastián', 'Pilar del Este',
  ]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const fetchNeighborhoods = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'neighborhoods'));
        const fetched = querySnapshot.docs.map(d => d.data().name as string);
        setAvailableNeighborhoods(prev =>
          Array.from(new Set([...prev, ...fetched])).sort()
        );
      } catch (err) {
        console.error('Error fetching neighborhoods:', err);
      }
    };
    fetchNeighborhoods();
  }, []);

  const proceedAfterAuth = async (user: FirebaseUser) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists() && userDoc.data().neighborhood) {
      const data = userDoc.data();
      const profile: UserProfile = {
        uid: user.uid,
        name: user.displayName || 'Usuario',
        email: user.email || '',
        photoURL: user.photoURL || undefined,
        neighborhood: data.neighborhood || '',
        lote: data.lote || '',
        admin: data.admin ?? 0,
      };
      setUser(profile);
      if (data.admin === 1) {
        navigate('/admin');
      } else {
        navigate('/productos');
      }
    } else {
      setPendingUser(user);
      setNeedsNeighborhood(true);
    }
  };

  const friendlyError = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email o contraseña incorrectos.';
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con ese email.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'El email no es válido.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Esperá unos minutos.';
      default:
        return 'Ocurrió un error. Intentá de nuevo.';
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setSubmitting(true);
      const result = await signInWithPopup(auth, googleProvider);
      await proceedAfterAuth(result.user);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(friendlyError(code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSubmitting(true);
      const result = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      await proceedAfterAuth(result.user);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(friendlyError(code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSubmitting(true);
      const result = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      await updateProfile(result.user, { displayName: registerName });
      setPendingUser(result.user);
      setNeedsNeighborhood(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(friendlyError(code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalNeighborhood = neighborhood === 'Otro' ? customNeighborhood : neighborhood;
    if (!finalNeighborhood || !pendingUser) {
      setError('Por favor seleccioná tu barrio.');
      return;
    }
    if (!lote.trim()) {
      setError('Por favor ingresá tu número de lote.');
      return;
    }
    if (neighborhood === 'Otro' && !neighborhoodAddress.trim()) {
      setError('Por favor ingresá la dirección del barrio.');
      return;
    }
    try {
      setError(null);
      setSubmitting(true);
      await setDoc(doc(db, 'users', pendingUser.uid), {
        name: pendingUser.displayName,
        email: pendingUser.email,
        neighborhood: finalNeighborhood,
        lote: lote.trim(),
        admin: 0,
        createdAt: new Date(),
      });
      if (neighborhood === 'Otro') {
        await setDoc(doc(collection(db, 'neighborhoods')), {
          name: customNeighborhood,
          address: neighborhoodAddress.trim(),
        });
      }
      const updatedProfile: UserProfile = {
        uid: pendingUser.uid,
        name: pendingUser.displayName || 'Usuario',
        email: pendingUser.email || '',
        photoURL: pendingUser.photoURL || undefined,
        neighborhood: finalNeighborhood,
        lote: lote.trim(),
        admin: 0,
      };
      setUser(updatedProfile);
      navigate('/productos');
    } catch (err) {
      console.error(err);
      setError('Error al guardar los datos del barrio.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Neighborhood step ───────────────────────────────────────────
  if (needsNeighborhood) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-900 text-white rounded-2xl mb-4">
              <Package className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              ¡Casi listo, {pendingUser?.displayName?.split(' ')[0]}!
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Decinos desde qué barrio vas a comprar.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleCompleteRegistration}>
            {error && <ErrorBox message={error} />}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Seleccioná tu Barrio Privado
              </label>
              <select
                required
                className="w-full px-3 py-2.5 border border-gray-200 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white transition-colors"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              >
                <option value="">Seleccioná tu barrio...</option>
                {availableNeighborhoods.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
                <option value="Otro">Otro (crear nuevo)</option>
              </select>
            </div>

            {neighborhood === 'Otro' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del barrio
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Los Robles"
                    className="w-full px-3 py-2.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                    value={customNeighborhood}
                    onChange={(e) => setCustomNeighborhood(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dirección del barrio
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ruta 25 km 38, Pilar"
                    className="w-full px-3 py-2.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                    value={neighborhoodAddress}
                    onChange={(e) => setNeighborhoodAddress(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número de lote
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 42"
                className="w-full px-3 py-2.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-900 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Guardando...' : 'Completar registro'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main auth card ──────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-blue-100">

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-900 text-white rounded-2xl mb-4">
            <Package className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {tab === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">Para comprar junto a tu barrio</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-blue-50 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === 'login' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-blue-800'
            }`}
          >
            Ingresar
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === 'register' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-blue-800'
            }`}
          >
            Registrarse
          </button>
        </div>

        {error && <ErrorBox message={error} />}

        {tab === 'login' ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                placeholder="tu@email.com"
                className="w-full px-3 py-2.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(v => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-900 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60 mt-1"
            >
              {submitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre completo</label>
              <input
                type="text"
                required
                placeholder="Juan Pérez"
                className="w-full px-3 py-2.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                placeholder="tu@email.com"
                className="w-full px-3 py-2.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(v => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-900 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60 mt-1"
            >
              {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium">o continuá con</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={submitting}
          className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <img className="h-5 w-5 mr-2.5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
          Google
        </button>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2 border border-red-100 mb-4">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      {message}
    </div>
  );
}
