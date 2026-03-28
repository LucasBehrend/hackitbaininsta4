import { Link } from 'react-router-dom';
import { ShoppingCart, LogOut, Package, ClipboardList } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';

export default function Navbar() {
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const { user, logout } = useAuthStore();

  return (
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
                  <span className="text-sm text-gray-600 hidden sm:block font-medium">
                    {user.name}
                    {user.admin === 1
                      ? <span className="ml-1 text-xs bg-blue-900 text-white px-1.5 py-0.5 rounded font-semibold">Admin</span>
                      : <span className="text-gray-400 font-normal"> · {user.neighborhood}</span>
                    }
                  </span>
                  <button
                    onClick={logout}
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
  );
}
