import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Loader2, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import productosData from '../data/productos1.json';

const MIN_DEMAND = 6;

const parsePrice = (priceStr: string): number => {
  const numericStr = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(numericStr);
};

// Lookup por product id (prod-0, prod-1, ...)
const esencialMap: Record<string, boolean> = {};
const precioMinoMap: Record<string, number> = {};
productosData.forEach((item, index) => {
  const id = `prod-${index}`;
  esencialMap[id] = item.Esencial === 1;
  precioMinoMap[id] = parsePrice(item.precioMino);
});

// preferencias para el admin si no se llega al mínimo:
// 'minorista'  = comprar igual pero a precio minorista
// 'noIncluir'  = no comprar ese producto
// undefined    = pendiente de decisión
type ItemDecision = 'minorista' | 'noIncluir';

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [demandMap, setDemandMap] = useState<Record<string, number>>({});
  const [demandLoading, setDemandLoading] = useState(true);
  const [decisions, setDecisions] = useState<Record<string, ItemDecision>>({});

  // Fetch neighborhood demand from Firestore
  useEffect(() => {
    const fetchDemand = async () => {
      if (!user?.neighborhood) {
        setDemandLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'orders'),
          where('neighborhood', '==', user.neighborhood)
        );
        const snapshot = await getDocs(q);
        const map: Record<string, number> = {};
        snapshot.forEach(doc => {
          const data = doc.data();
          if (Array.isArray(data.items)) {
            data.items.forEach((it: { id: string; quantity: number }) => {
              map[it.id] = (map[it.id] || 0) + it.quantity;
            });
          }
        });
        setDemandMap(map);
      } catch (err) {
        console.error('Error fetching demand:', err);
      } finally {
        setDemandLoading(false);
      }
    };
    fetchDemand();
  }, [user?.neighborhood]);

  // Items that require a user decision (non-essential + low demand)
  const itemsNeedingDecision = useMemo(
    () => items.filter(item => {
      const esencial = esencialMap[item.id] ?? true;
      if (esencial) return false;
      return (demandMap[item.id] || 0) < MIN_DEMAND;
    }),
    [items, demandMap]
  );

  const needsDecision = (itemId: string) =>
    itemsNeedingDecision.some(p => p.id === itemId);

  const hasPendingDecisions = !demandLoading &&
    itemsNeedingDecision.some(p => decisions[p.id] === undefined);

  // All items stay in order — decisions are preferences saved for the admin
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const setDecision = (itemId: string, decision: ItemDecision) =>
    setDecisions(prev => ({ ...prev, [itemId]: decision }));

  const handleCheckout = async () => {
    if (!user) { navigate('/auth'); return; }

    try {
      setIsSubmitting(true);

      const orderItems = items.map(item => {
        const decision = decisions[item.id] ?? null;
        const base = {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          preferenciaDemandaBaja: decision,
        };
        if (decision === 'minorista') {
          return { ...base, precioMino: precioMinoMap[item.id] ?? null };
        }
        return base;
      });

      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        userName: user.name,
        neighborhood: user.neighborhood || '',
        lote: user.lote || '',
        items: orderItems,
        total,
        status: 'Pendiente',
        createdAt: serverTimestamp(),
      });
      clearCart();
      setOrderSuccess(true);
      setTimeout(() => navigate('/orders'), 2500);
    } catch (error) {
      console.error('Error al confirmar pedido:', error);
      alert('Hubo un error al procesar tu pedido. Por favor intentá de nuevo.');
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-blue-800" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">¡Pedido registrado!</h1>
        <p className="text-gray-500 mb-2">Tu pedido fue sumado a la demanda de tu barrio.</p>
        <p className="text-sm text-gray-400 animate-pulse">Redirigiendo a tus pedidos...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-12 w-12 text-blue-200" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Tu carrito está vacío</h2>
        <p className="mb-6 text-gray-400 text-sm">¡Descubrí los productos con demanda comunal en tu barrio!</p>
        <Link to="/productos" className="bg-blue-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors shadow-sm">
          Ver productos
        </Link>
      </div>
    );
  }

  const checkoutDisabled = isSubmitting || hasPendingDecisions || demandLoading || items.length === 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tu Carrito</h1>
        <Link to="/productos" className="text-blue-800 hover:text-blue-900 font-semibold text-sm flex items-center group">
          <ArrowLeft className="h-4 w-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Seguir comprando
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Items list */}
        <div className="flex-grow space-y-3">
          {items.map((item) => {
            const decision = decisions[item.id] as ItemDecision | undefined;
            const requiresDecision = needsDecision(item.id);
            const isPending = requiresDecision && decision === undefined;
            const neighborhoodDemand = demandMap[item.id] || 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  isPending
                    ? 'border-amber-300 shadow-sm'
                    : 'border-gray-100 hover:border-blue-100 hover:shadow-sm'
                }`}
              >
                {/* Main item row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
                  <div className="h-20 w-20 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-blue-50">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      : <span className="text-xs text-gray-400">Sin img</span>
                    }
                  </div>

                  <div className="flex-grow w-full sm:w-auto">
                    <h3 className="text-base font-bold text-gray-900 mb-0.5 line-clamp-2">{item.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-blue-900">${item.price.toFixed(2)}</span>
                      {decision === 'minorista' && (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                          Si no se llega: precio minorista
                        </span>
                      )}
                      {decision === 'noIncluir' && (
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full">
                          Si no se llega: no se compra
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100">
                    <div className="flex items-center bg-blue-50 rounded-xl p-1 border border-blue-100">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-2 rounded-lg text-blue-700 hover:bg-white hover:shadow-sm transition-all"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-9 text-center font-bold text-blue-900 text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 rounded-lg text-blue-700 hover:bg-white hover:shadow-sm transition-all"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      aria-label="Remove item"
                      title="Eliminar del carrito"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Decision banner — only for non-essential low-demand items */}
                {requiresDecision && !demandLoading && (
                  <div className={`border-t px-5 py-4 ${isPending ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                    {isPending ? (
                      <>
                        <div className="flex items-start gap-2 mb-3">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800">Puede que no se llegue al mínimo mayorista</p>
                            <p className="text-xs text-amber-700 mt-0.5">
                              Tu barrio pidió {neighborhoodDemand} unidad{neighborhoodDemand !== 1 ? 'es' : ''} — se necesitan {MIN_DEMAND}+ para hacer la compra grupal. ¿Qué hacemos si no se llega?
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => setDecision(item.id, 'minorista')}
                            className="flex-1 py-2 px-3 bg-white border border-amber-300 text-amber-800 text-sm font-semibold rounded-xl hover:bg-amber-50 transition-colors"
                          >
                            Comprar a precio minorista (${precioMinoMap[item.id]?.toFixed(2) ?? '—'})
                          </button>
                          <button
                            onClick={() => setDecision(item.id, 'noIncluir')}
                            className="flex-1 py-2 px-3 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <X className="h-3.5 w-3.5" />
                            No incluir en el pedido
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          {decision === 'minorista'
                            ? `Si no se llega a ${MIN_DEMAND} unidades: se comprará a precio minorista`
                            : `Si no se llega a ${MIN_DEMAND} unidades: no se va a comprar`
                          }
                        </div>
                        <button
                          onClick={() => setDecisions(prev => { const n = { ...prev }; delete n[item.id]; return n; })}
                          className="text-xs text-blue-700 hover:text-blue-900 font-semibold ml-3"
                        >
                          Cambiar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="w-full lg:w-[320px] flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl border border-blue-100 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Resumen del pedido</h3>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Productos ({items.length})</span>
                <span className="font-medium text-gray-700">${total.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-blue-900 text-lg">${total.toFixed(2)}</span>
              </div>
            </div>

            {hasPendingDecisions && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-medium">
                  Hay productos que necesitan tu decisión antes de confirmar.
                </p>
              </div>
            )}


            <button
              onClick={handleCheckout}
              disabled={checkoutDisabled}
              className="w-full bg-blue-900 text-white py-3.5 px-4 rounded-xl font-bold text-base hover:bg-blue-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {demandLoading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Verificando demanda...</>
              ) : isSubmitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Procesando...</>
              ) : (
                'Confirmar Pedido'
              )}
            </button>

            {!user && (
              <p className="text-xs text-center text-gray-400 mt-3">
                Tendrás que iniciar sesión en el siguiente paso.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
