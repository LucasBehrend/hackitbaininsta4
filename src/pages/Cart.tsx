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
        <CheckCircle className="h-20 w-20 text-green-500 mb-6 animate-bounce" />
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">¡Pedido registrado!</h1>
        <p className="text-lg text-gray-600 mb-2">Tu pedido fue sumado a la demanda de tu barrio.</p>
        <p className="text-sm text-gray-400 animate-pulse">Redirigiendo al inicio...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <ShoppingBag className="h-24 w-24 mb-6 text-gray-300" />
        <h2 className="text-2xl font-semibold mb-2 text-gray-700">Tu carrito está vacío</h2>
        <p className="mb-6">¡Descubrí los productos con demanda comunal en tu barrio!</p>
        <Link
          to="/productos"
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
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
        <Link to="/productos" className="text-green-600 hover:text-green-700 font-medium flex items-center group">
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Seguir comprando
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="h-24 w-24 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">Sin img</span>
                )}
              </div>

              <div className="flex-grow w-full sm:w-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{item.name}</h3>
                <div className="text-2xl font-black text-gray-900">${item.price.toFixed(2)}</div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-gray-100">
                <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="p-2 rounded-md text-gray-600 hover:bg-white hover:shadow-sm hover:text-gray-900 transition-all focus:outline-none"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-gray-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 rounded-md text-gray-600 hover:bg-white hover:shadow-sm hover:text-gray-900 transition-all focus:outline-none"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
                  aria-label="Remove item"
                  title="Eliminar producto"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full lg:w-[340px] flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Resumen del pedido</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Productos ({items.length})</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Envío al barrio</span>
                <span className="text-green-600 font-medium">Gratis</span>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg text-gray-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-3.5 px-4 rounded-xl font-bold text-lg hover:bg-green-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:-translate-y-0 disabled:hover:shadow-none"
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
              <p className="text-sm text-center text-gray-500 mt-4">
                Tendrás que iniciar sesión en el siguiente paso.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
