import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAuthStore from '../store/useAuthStore';
import { Package, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  preferenciaDemandaBaja?: 'minorista' | 'noIncluir' | null;
}

interface Order {
  id: string;
  userId: string;
  date: string;
  status: 'Pendiente' | 'Confirmado' | 'Entregado' | 'Cancelado';
  total: number;
  items: OrderItem[];
}

const STATUS_CONFIG = {
  Entregado: { icon: CheckCircle2, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Pendiente: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  Cancelado: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  Confirmado: { icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

export default function Orders() {
  const { user } = useAuthStore();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const fetchedOrders: Order[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || '',
            date: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            status: data.status || 'Pendiente',
            total: data.total || 0,
            items: data.items || [],
          };
        });

        fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5">
          <Package className="h-10 w-10 text-blue-200" />
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-800">Iniciá sesión</h2>
        <p className="mb-6 text-gray-400 text-sm max-w-xs">Debés iniciar sesión para ver el historial de tus pedidos comunitarios.</p>
        <Link to="/auth" className="bg-blue-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors shadow-sm">
          Ir a Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-blue-800 animate-spin" />
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Mis Pedidos</h1>

      {error ? (
        <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-100">
          <p className="text-red-500 text-sm">Hubo un error al cargar tus pedidos. Intentá recargar la página.</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-blue-100">
          <Package className="h-12 w-12 text-blue-100 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Aún no realizaste pedidos.</p>
          <Link to="/productos" className="inline-block mt-4 text-blue-800 font-semibold text-sm hover:text-blue-900">
            Ver productos →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.Confirmado;
            const StatusIcon = config.icon;

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-blue-100 transition-colors">
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-semibold">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </span>
                      <time className="text-xs text-gray-400" dateTime={order.date}>
                        {new Date(order.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </time>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full border ${config.color} ${config.bg} ${config.border}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {order.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-5 w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0">
                    <div className="text-right flex-1 sm:flex-none">
                      <div className="text-xs text-gray-400">Total</div>
                      <div className="text-lg font-black text-blue-900">${order.total.toFixed(2)}</div>
                    </div>
                    <div className="text-gray-300">
                      {expandedOrder === order.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="px-5 pb-5 bg-blue-50/40 border-t border-blue-50">
                    <h4 className="font-semibold text-gray-700 text-sm mt-4 mb-3">Detalle del pedido</h4>
                    <ul className="space-y-2">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between items-start text-sm gap-3">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="w-7 text-center bg-blue-100 text-blue-800 rounded-lg py-0.5 text-xs font-bold flex-shrink-0">{item.quantity}x</span>
                            <div className="min-w-0">
                              <span className="text-gray-600">{item.name}</span>
                              {item.preferenciaDemandaBaja === 'minorista' && (
                                <span className="ml-2 inline-block text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                  Si no se llega: precio minorista
                                </span>
                              )}
                              {item.preferenciaDemandaBaja === 'noIncluir' && (
                                <span className="ml-2 inline-block text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                  Si no se llega: no se compra
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-gray-800 font-semibold flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-3 border-t border-blue-100 flex justify-between font-bold text-blue-900 text-sm">
                      <span>Total del pedido</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
