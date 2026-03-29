import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, LogOut, Package, ClipboardList, X } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';

export default function Navbar() {
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const { user, logout } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
    {showLogoutModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-sm">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-2xl mb-4">
            <LogOut className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Cerrar sesión</h3>
          <p className="text-sm text-gray-500 mb-6">¿Estás seguro que querés cerrar sesión?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { setShowLogoutModal(false); logout(); }}
              className="flex-1 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    )}
    <nav className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2.5 text-xl font-bold text-blue-900">
              <div className="bg-blue-900 text-white p-1.5 rounded-lg">
                <Package className="h-5 w-5" />
              </div>
              <span>ComprasComunales</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.admin === 1 ? (
                  <Link to="/admin" className="flex items-center gap-1.5 text-gray-500 hover:text-blue-900 font-medium transition-colors text-sm">
                    <ClipboardList className="h-4 w-4" />
                    Panel Admin
                  </Link>
                ) : (
                  <>
                    <Link to="/productos" className="text-gray-500 hover:text-blue-900 font-medium transition-colors text-sm">
                      Productos
                    </Link>
                    <Link to="/orders" className="text-gray-500 hover:text-blue-900 font-medium transition-colors text-sm">
                      Mis Pedidos
                    </Link>
                    <Link to="/cart" className="relative p-2 text-gray-500 hover:text-blue-900 transition-colors">
                      <ShoppingCart className="h-5 w-5" />
                      {cartCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-blue-800 rounded-full">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                <div className="flex items-center space-x-2 border-l border-blue-100 pl-4 ml-1">
                  <Link to="/perfil" className="text-sm text-gray-600 hidden sm:block font-medium hover:text-blue-900 transition-colors">
                    {user.name}
                    {user.admin === 1
                      ? <span className="ml-1 text-xs bg-blue-900 text-white px-1.5 py-0.5 rounded font-semibold">Admin</span>
                      : <span className="text-gray-400 font-normal"> · {user.neighborhood}</span>
                    }
                  </Link>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/productos" className="text-gray-500 hover:text-blue-900 font-medium transition-colors text-sm">
                  Productos
                </Link>
                <Link
                  to="/auth"
                  className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm"
                >
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}
