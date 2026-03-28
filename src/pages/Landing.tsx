import { Link } from 'react-router-dom';
import { ShoppingCart, Users, Truck, ArrowRight, ClipboardList } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Landing() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-green-50 to-white">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Comprá mayorista, <br className="hidden md:block" />
          <span className="text-green-600">junto a tu barrio.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Unite a tus vecinos para hacer compras comunitarias. Accedé a precios de supermercado mayorista con envío directo a tu barrio privado.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/productos"
            className="px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Ver productos
            <ArrowRight className="h-5 w-5" />
          </Link>
          {user ? (
            <Link
              to="/orders"
              className="px-8 py-4 bg-white text-green-600 border-2 border-green-600 rounded-xl font-bold text-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
            >
              <ClipboardList className="h-5 w-5" />
              Mis pedidos
            </Link>
          ) : (
            <Link
              to="/auth"
              className="px-8 py-4 bg-white text-green-600 border-2 border-green-600 rounded-xl font-bold text-lg hover:bg-green-50 transition-colors flex items-center justify-center"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
        {user && (
          <p className="mt-6 text-gray-500 text-base">
            Bienvenido, <span className="font-semibold text-gray-700">{user.name}</span> — {user.neighborhood}
          </p>
        )}
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Precios Mayoristas</h3>
              <p className="text-gray-600">
                Al sumar la demanda de todo el barrio, logramos llegar a los mínimos de compra para acceder a precios reales de mayorista.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Compra Individual, Pedido Grupal</h3>
              <p className="text-gray-600">
                Cada vecino elige lo que necesita y paga su parte. Nosotros nos encargamos de unificar todo el pedido del barrio.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Envío Simplificado</h3>
              <p className="text-gray-600">
                Coordinamos una única entrega al barrio, reduciendo costos de logística y el tránsito en el acceso de tu loteo.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
