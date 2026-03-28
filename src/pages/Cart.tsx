import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      setIsSubmitting(true);

      const orderData = {
        userId: user.uid,
        userName: user.name,
        neighborhood: user.neighborhood,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        total: total,
        status: 'Pendiente',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'orders'), orderData);

      clearCart();
      setOrderSuccess(true);
      setTimeout(() => navigate('/'), 2500);
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
        <p className="text-sm text-gray-400 animate-pulse">Redirigiendo al inicio...</p>
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
        <Link
          to="/productos"
          className="bg-blue-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors shadow-sm"
        >
          Ver productos
        </Link>
      </div>
    );
  }

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
        <div className="flex-grow space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all">
              <div className="h-20 w-20 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-blue-50">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">Sin img</span>
                )}
              </div>

              <div className="flex-grow w-full sm:w-auto">
                <h3 className="text-base font-bold text-gray-900 mb-0.5 line-clamp-2">{item.name}</h3>
                <div className="text-xl font-black text-blue-900">${item.price.toFixed(2)}</div>
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
                  title="Eliminar producto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full lg:w-[320px] flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl border border-blue-100 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Resumen del pedido</h3>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Productos ({items.length})</span>
                <span className="font-medium text-gray-700">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Envío al barrio</span>
                <span className="text-blue-700 font-semibold">Gratis</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-blue-900 text-lg">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full bg-blue-900 text-white py-3.5 px-4 rounded-xl font-bold text-base hover:bg-blue-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:-translate-y-0 disabled:hover:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </>
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
