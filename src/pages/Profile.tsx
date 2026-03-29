import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAuthStore from '../store/useAuthStore';
import { User, MapPin, Hash, CheckCircle, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuthStore();

  const [neighborhood, setNeighborhood] = useState(user?.neighborhood ?? '');
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [neighborhoodAddress, setNeighborhoodAddress] = useState('');
  const [lote, setLote] = useState(user?.lote ?? '');
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNeighborhoods = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'neighborhoods'));
        const fetched = snapshot.docs.map(d => d.data().name as string);
        setAvailableNeighborhoods(Array.from(new Set(fetched)).sort());
      } catch (err) {
        console.error('Error fetching neighborhoods:', err);
      }
    };
    fetchNeighborhoods();
  }, []);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const finalNeighborhood = neighborhood === 'Otro' ? customNeighborhood.trim() : neighborhood;

    if (!finalNeighborhood) {
      setError('Seleccioná un barrio.');
      return;
    }
    if (!lote.trim()) {
      setError('Ingresá tu número de lote.');
      return;
    }
    if (neighborhood === 'Otro' && !neighborhoodAddress.trim()) {
      setError('Ingresá la dirección del barrio.');
      return;
    }

    try {
      setSubmitting(true);

      await updateDoc(doc(db, 'users', user.uid), {
        neighborhood: finalNeighborhood,
        lote: lote.trim(),
      });

      if (neighborhood === 'Otro') {
        await setDoc(doc(collection(db, 'neighborhoods')), {
          name: customNeighborhood.trim(),
          address: neighborhoodAddress.trim(),
        });
      }

      setUser({ ...user, neighborhood: finalNeighborhood, lote: lote.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError('Error al guardar los cambios.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-900 text-white rounded-2xl flex items-center justify-center flex-shrink-0">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{user.name}</h1>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-blue-100 p-6">
        <h2 className="text-base font-bold text-gray-800 mb-5">Editar datos de entrega</h2>

        <form onSubmit={handleSave} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl p-3">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Cambios guardados correctamente.
            </div>
          )}

          {/* Barrio */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="h-3.5 w-3.5 text-blue-700" />
              Barrio privado
            </label>
            <select
              required
              className="w-full px-3 py-2.5 border border-gray-200 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white transition-colors"
              value={neighborhood}
              onChange={e => { setNeighborhood(e.target.value); setError(null); }}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del barrio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Los Robles"
                  className="w-full px-3 py-2.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  value={customNeighborhood}
                  onChange={e => setCustomNeighborhood(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección del barrio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ruta 25 km 38, Pilar"
                  className="w-full px-3 py-2.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                  value={neighborhoodAddress}
                  onChange={e => setNeighborhoodAddress(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Lote */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <Hash className="h-3.5 w-3.5 text-blue-700" />
              Número de lote
            </label>
            <input
              type="text"
              required
              placeholder="Ej: 42"
              className="w-full px-3 py-2.5 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
              value={lote}
              onChange={e => { setLote(e.target.value); setError(null); }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-900 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
