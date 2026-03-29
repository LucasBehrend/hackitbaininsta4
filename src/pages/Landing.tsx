import { Link } from 'react-router-dom';
import { ShoppingCart, Users, Truck, ArrowRight, ClipboardList } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Landing() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          Compras comunitarias para barrios privados
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
          Comprá mayorista,{' '}
          <br className="hidden md:block" />
          <span className="text-blue-900">junto a tu barrio.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Unite a tus vecinos para hacer compras comunitarias. Accedé a precios de supermercado mayorista con envío directo a tu barrio privado.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/productos"
            className="px-8 py-4 bg-blue-900 text-white rounded-xl font-bold text-lg hover:bg-blue-800 hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Ver productos
            <ArrowRight className="h-5 w-5" />
          </Link>
          {user ? (
            <Link
              to="/orders"
              className="px-8 py-4 bg-white text-blue-900 border-2 border-blue-900 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <ClipboardList className="h-5 w-5" />
              Mis pedidos
            </Link>
          ) : (
            <Link
              to="/auth"
              className="px-8 py-4 bg-white text-blue-900 border-2 border-blue-900 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors flex items-center justify-center"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
        {user && (
          <p className="mt-6 text-gray-400 text-sm">
            Bienvenido de nuevo, <span className="font-semibold text-gray-700">{user.name}</span> — {user.neighborhood}
          </p>
        )}
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">¿Cómo funciona?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Todo el barrio compra junto, cada uno paga lo suyo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-blue-100 rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-md hover:border-blue-200 transition-all">
              <div className="h-14 w-14 bg-blue-900 text-white rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Precios Mayoristas</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Al sumar la demanda de todo el barrio, logramos llegar a los mínimos de compra para acceder a precios reales de mayorista.
              </p>
            </div>

            <div className="bg-blue-900 rounded-2xl p-8 flex flex-col items-center text-center shadow-md">
              <div className="h-14 w-14 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-5">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Pedí en comunidad</h3>
              <p className="text-blue-200 text-sm leading-relaxed">
                Cada vecino elige lo que necesita y paga su parte. Nosotros nos encargamos de unificar todo el pedido del barrio.
              </p>
            </div>

            <div className="bg-white border border-blue-100 rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-md hover:border-blue-200 transition-all">
              <div className="h-14 w-14 bg-blue-100 text-blue-800 rounded-2xl flex items-center justify-center mb-5">
                <Truck className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Envío Simplificado</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Armás tu lista de compras, pedís, pagás y recibís el pedido en la puerta de tu casa al mejor precio. 
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
