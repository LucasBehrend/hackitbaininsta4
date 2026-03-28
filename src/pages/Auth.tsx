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

      // Check if user has a neighborhood set in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().neighborhood) {
        // User is fully registered
        navigate('/productos');
      } else {
        // Need to ask for neighborhood
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
      // Save user profile with neighborhood to Firestore
      const userDocRef = doc(db, 'users', pendingUser.uid);
      await setDoc(userDocRef, {
        name: pendingUser.displayName,
        email: pendingUser.email,
        photoURL: pendingUser.photoURL,
        neighborhood: finalNeighborhood,
        createdAt: new Date(),
      });

      // If it's a new custom neighborhood, add it to the neighborhoods collection
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
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
              ¡Casi listo, {pendingUser?.displayName?.split(' ')[0]}!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Para unirte a las compras comunales, necesitamos saber de qué barrio sos.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleCompleteRegistration}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccioná tu Barrio Privado
                </label>
                <select
                  id="neighborhood"
                  name="neighborhood"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                >
                  <option value="">Selecciona tu barrio...</option>
                  {availableNeighborhoods.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                  <option value="Otro">Otro (crear nuevo)</option>
                </select>
              </div>

              {neighborhood === 'Otro' && (
                <div>
                  <label htmlFor="customNeighborhood" className="block text-sm font-medium text-gray-700 mb-2">
                    Ingresá el nombre de tu barrio
                  </label>
                  <input
                    id="customNeighborhood"
                    name="customNeighborhood"
                    type="text"
                    required
                    placeholder="Nombre del barrio"
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    value={customNeighborhood}
                    onChange={(e) => setCustomNeighborhood(e.target.value)}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Completar registro
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Inicia sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Para comprar junto a tu barrio
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <img className="h-5 w-5 mr-3" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
}
