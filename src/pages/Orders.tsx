import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAuthStore from '../store/useAuthStore';
import { Package, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  date: string;
  status: 'Pendiente' | 'Confirmado' | 'Entregado' | 'Cancelado';
  total: number;
  items: OrderItem[];
}

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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <Package className="h-24 w-24 mb-6 text-gray-300" />
        <h2 className="text-2xl font-semibold mb-2 text-gray-700">Inicia sesión</h2>
        <p className="mb-6 text-center max-w-sm">Debes iniciar sesión para ver el historial de tus pedidos comunitarios.</p>
        <a href="/auth" className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
          Ir a Login
        </a>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Entregado': return <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />;
      case 'Pendiente': return <Clock className="h-5 w-5 text-yellow-500 mr-2" />;
      case 'Cancelado': return <XCircle className="h-5 w-5 text-red-500 mr-2" />;
      default: return <Package className="h-5 w-5 text-blue-500 mr-2" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Mis Pedidos</h1>

      {error ? (
        <p className="text-red-500">Hubo un error al cargar tus pedidos. Intentá recargar la página.</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">Aún no has realizado pedidos.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700 mr-3">
                      {order.id.substring(0, 8).toUpperCase()}
                    </span>
                    <time dateTime={order.date}>{new Date(order.date).toLocaleDateString()}</time>
                  </div>
                  <div className="flex items-center text-lg font-medium text-gray-900">
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-xl font-bold text-gray-900">${order.total.toFixed(2)}</div>
                  </div>
                  <div className="text-gray-400">
                    {expandedOrder === order.id ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                  </div>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4">Detalle del pedido</h4>
                  <ul className="space-y-3">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <span className="w-8 text-center bg-gray-200 text-gray-700 rounded mr-3 py-1 font-medium">{item.quantity}x</span>
                          <span className="text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-gray-900 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                    <span>Total del pedido</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
