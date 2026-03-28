import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAuthStore from '../store/useAuthStore';
import { Package, ChevronDown, ChevronUp, Clock, CheckCircle2, Loader2, Check, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface AdminOrder {
  id: string;
  userId: string;
  userName: string;
  neighborhood: string;
  lote: string;
  date: string;
  status: 'Pendiente' | 'Confirmado' | 'Entregado' | 'Cancelado';
  total: number;
  items: OrderItem[];
}

interface NeighborhoodGroup {
  neighborhood: string;
  orders: AdminOrder[];
  combinedItems: { name: string; quantity: number; price: number }[];
  total: number;
  allDelivered: boolean;
  latestDate: string;
}

function groupByNeighborhood(orders: AdminOrder[]): NeighborhoodGroup[] {
  const map = new Map<string, AdminOrder[]>();

  for (const order of orders) {
    const key = order.neighborhood || 'Sin barrio';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(order);
  }

  const groups: NeighborhoodGroup[] = [];

  map.forEach((groupOrders, neighborhood) => {
    // Aggregate items across all orders in the group
    const itemMap = new Map<string, { name: string; quantity: number; price: number }>();
    for (const order of groupOrders) {
      for (const item of order.items) {
        if (itemMap.has(item.name)) {
          itemMap.get(item.name)!.quantity += item.quantity;
        } else {
          itemMap.set(item.name, { name: item.name, quantity: item.quantity, price: item.price });
        }
      }
    }

    const total = groupOrders.reduce((sum, o) => sum + o.total, 0);
    const allDelivered = groupOrders.every(o => o.status === 'Entregado' || o.status === 'Cancelado');
    const latestDate = groupOrders.reduce((latest, o) =>
      o.date > latest ? o.date : latest, groupOrders[0].date
    );

    groups.push({
      neighborhood,
      orders: groupOrders,
      combinedItems: Array.from(itemMap.values()),
      total,
      allDelivered,
      latestDate,
    });
  });

  // Sort: pending groups first, then by latest order date
  groups.sort((a, b) => {
    if (a.allDelivered !== b.allDelivered) return a.allDelivered ? 1 : -1;
    return b.latestDate.localeCompare(a.latestDate);
  });

  return groups;
}

export default function AdminOrders() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (user.admin !== 1) { navigate('/'); return; }

    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const fetched: AdminOrder[] = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            userId: data.userId || '',
            userName: data.userName || 'Usuario',
            neighborhood: data.neighborhood || '',
            lote: data.lote || '',
            date: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            status: data.status || 'Pendiente',
            total: data.total || 0,
            items: data.items || [],
          };
        });
        setOrders(fetched);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const markNeighborhoodDelivered = async (neighborhood: string) => {
    setCompleting(neighborhood);
    try {
      const pending = orders.filter(
        o => o.neighborhood === neighborhood && o.status !== 'Entregado' && o.status !== 'Cancelado'
      );
      await Promise.all(
        pending.map(o => updateDoc(doc(db, 'orders', o.id), { status: 'Entregado' }))
      );
      setOrders(prev =>
        prev.map(o =>
          o.neighborhood === neighborhood && o.status !== 'Cancelado'
            ? { ...o, status: 'Entregado' }
            : o
        )
      );
    } catch (err) {
      console.error('Error updating orders:', err);
    } finally {
      setCompleting(null);
    }
  };

  if (!user || user.admin !== 1) return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-blue-800 animate-spin" />
      </div>
    );
  }

  const groups = groupByNeighborhood(orders);
  const pendingGroups = groups.filter(g => !g.allDelivered).length;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Panel de Pedidos</h1>
        <p className="text-gray-500 text-sm mt-1">
          {pendingGroups} barrio{pendingGroups !== 1 ? 's' : ''} con pedidos pendientes
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-blue-100">
          <Package className="h-12 w-12 text-blue-100 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay pedidos todavía.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isExpanded = expanded === group.neighborhood;
            const pendingCount = group.orders.filter(
              o => o.status !== 'Entregado' && o.status !== 'Cancelado'
            ).length;

            return (
              <div
                key={group.neighborhood}
                className={`bg-white rounded-2xl border overflow-hidden transition-colors ${
                  group.allDelivered ? 'border-emerald-100' : 'border-gray-100 hover:border-blue-100'
                }`}
              >
                {/* Header */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : group.neighborhood)}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-blue-700 flex-shrink-0" />
                        <span className="font-extrabold text-gray-900 text-base">{group.neighborhood}</span>
                      </div>
                      <div className="text-xs text-gray-400 ml-6">
                        {group.orders.length} pedido{group.orders.length !== 1 ? 's' : ''} ·{' '}
                        {group.orders.map(o => o.userName).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {group.allDelivered ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border text-emerald-600 bg-emerald-50 border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Entregado
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border text-amber-600 bg-amber-50 border-amber-200">
                          <Clock className="h-3 w-3" />
                          {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                        </div>
                      )}
                      <div className="text-lg font-black text-blue-900 ml-auto sm:ml-0">
                        ${group.total.toFixed(2)}
                      </div>
                      <div className="text-gray-300">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-blue-50 bg-blue-50/40">
                    {/* Combined items */}
                    <div className="px-5 pt-4 pb-2">
                      <h4 className="font-semibold text-gray-700 text-sm mb-3">
                        Productos del barrio (combinados)
                      </h4>
                      <ul className="space-y-2">
                        {group.combinedItems.map((item) => (
                          <li key={item.name} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-7 text-center bg-blue-100 text-blue-800 rounded-lg py-0.5 text-xs font-bold">
                                {item.quantity}x
                              </span>
                              <span className="text-gray-600">{item.name}</span>
                            </div>
                            <span className="text-gray-800 font-semibold">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Per-user breakdown */}
                    <div className="px-5 pt-3 pb-2">
                      <h4 className="font-semibold text-gray-700 text-sm mb-2">Por usuario</h4>
                      <div className="space-y-2">
                        {group.orders.map(order => (
                          <div key={order.id} className="flex justify-between items-center text-xs text-gray-500 bg-white rounded-xl px-3 py-2 border border-blue-50">
                            <span>
                              <span className="font-semibold text-gray-700">{order.userName}</span>
                              {order.lote ? ` · Lote ${order.lote}` : ''}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">${order.total.toFixed(2)}</span>
                              {order.status === 'Entregado' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-amber-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 border-t border-blue-100 flex justify-between items-center">
                      <div className="font-bold text-blue-900 text-sm">
                        Total barrio: ${group.total.toFixed(2)}
                      </div>
                      {!group.allDelivered && (
                        <button
                          onClick={() => markNeighborhoodDelivered(group.neighborhood)}
                          disabled={completing === group.neighborhood}
                          className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-60"
                        >
                          {completing === group.neighborhood ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Marcar barrio como entregado
                        </button>
                      )}
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
