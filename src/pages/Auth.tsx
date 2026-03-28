import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { Package, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [neighborhood, setNeighborhood] = useState('');
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [needsNeighborhood, setNeedsNeighborhood] = useState(false);
  const [pendingUser, setPendingUser] = useState<FirebaseUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([
    'Los Sauces', 'El Cantón', 'Nordelta', 'San Sebastián', 'Pilar del Este'
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNeighborhoods = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'neighborhoods'));
        const fetchedNeighborhoods = querySnapshot.docs.map(doc => doc.data().name as string);
        setAvailableNeighborhoods((prev) => {
          const allNeighborhoods = Array.from(new Set([...prev, ...fetchedNeighborhoods]));
          return allNeighborhoods.sort();
        });
      } catch (err) {
        console.error('Error fetching neighborhoods:', err);
      }
    };
    fetchNeighborhoods();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().neighborhood) {
        navigate('/productos');
      } else {
        setPendingUser(user);
        setNeedsNeighborhood(true);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google.';
      setError(errorMsg);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalNeighborhood = neighborhood === 'Otro' ? customNeighborhood : neighborhood;

    if (!finalNeighborhood || !pendingUser) {
      setError('Por favor completá tu barrio.');
      return;
    }

    try {
      setError(null);
      const userDocRef = doc(db, 'users', pendingUser.uid);
      await setDoc(userDocRef, {
        name: pendingUser.displayName,
        email: pendingUser.email,
        photoURL: pendingUser.photoURL,
        neighborhood: finalNeighborhood,
        createdAt: new Date(),
      });

      if (neighborhood === 'Otro') {
        const neighborhoodRef = doc(collection(db, 'neighborhoods'));
        await setDoc(neighborhoodRef, { name: customNeighborhood });
      }

      navigate('/productos');
    } catch (err) {
      console.error(err);
      setError('Error al guardar los datos del barrio.');
    }
  };

  if (needsNeighborhood) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-900 text-white rounded-2xl mb-4 shadow-sm">
              <Package className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              ¡Casi listo, {pendingUser?.displayName?.split(' ')[0]}!
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Para unirte a las compras comunales, necesitamos saber de qué barrio sos.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleCompleteRegistration}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div>
              <label htmlFor="neighborhood" className="block text-sm font-semibold text-gray-700 mb-2">
                Seleccioná tu Barrio Privado
              </label>
              <select
                id="neighborhood"
                name="neighborhood"
                required
                className="w-full px-3 py-2.5 border border-gray-200 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors bg-white"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              >
                <option value="">Seleccioná tu barrio...</option>
                {availableNeighborhoods.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
                <option value="Otro">Otro (crear nuevo)</option>
              </select>
            </div>

            {neighborhood === 'Otro' && (
              <div>
                <label htmlFor="customNeighborhood" className="block text-sm font-semibold text-gray-700 mb-2">
                  Ingresá el nombre de tu barrio
                </label>
                <input
                  id="customNeighborhood"
                  name="customNeighborhood"
                  type="text"
                  required
                  placeholder="Nombre del barrio"
                  className="w-full px-3 py-2.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  value={customNeighborhood}
                  onChange={(e) => setCustomNeighborhood(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-900 text-white text-sm font-bold rounded-xl hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 transition-colors shadow-sm"
            >
              Completar registro
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-900 text-white rounded-2xl mb-4 shadow-sm">
            <Package className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Inicia sesión</h2>
          <p className="mt-2 text-sm text-gray-500">Para comprar junto a tu barrio</p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2 border border-red-100">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-colors shadow-sm"
          >
            <img className="h-5 w-5 mr-3" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
}
