import { Link } from 'react-router-dom';
import { ShoppingCart, LogOut, Package } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';

export default function Navbar() {
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-green-600">
              <Package className="h-6 w-6" />
              <span>ComprasComunales</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/productos" className="text-gray-600 hover:text-gray-900 font-medium">
                  Productos
                </Link>
                <Link to="/orders" className="text-gray-600 hover:text-gray-900 font-medium">
                  Mis Pedidos
                </Link>
                <Link to="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center space-x-2 border-l pl-4 ml-2">
                  <span className="text-sm text-gray-700 hidden sm:block">
                    {user.name} ({user.neighborhood})
                  </span>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/productos" className="text-gray-600 hover:text-gray-900 font-medium">
                  Productos
                </Link>
                <Link
                  to="/auth"
                  className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors"
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
