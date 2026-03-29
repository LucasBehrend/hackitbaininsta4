import { Link } from 'react-router-dom';
import { ShoppingCart, Users, Truck, ArrowRight, ClipboardList, Package, CheckCircle, TrendingDown, MapPin } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Landing() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-28 bg-blue-100">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-xs font-bold px-4 py-1.5 rounded-full mb-7 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          Compras comunitarias · Barrios privados
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 leading-[1.05]">
          Comprá mayorista,{' '}
          <span className="text-blue-900 block">junto a tu barrio.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Unite a tus vecinos, sumá demanda y accedé a precios de supermercado mayorista con entrega directa en tu barrio privado.
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
              Registrarse gratis
            </Link>
          )}
        </div>

        {user && (
          <p className="mt-6 text-gray-400 text-sm">
            Bienvenido, <span className="font-semibold text-gray-600">{user.name}</span> · {user.neighborhood}
          </p>
        )}
      </section>

      {/* ── Cómo funciona ───────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">¿Cómo funciona?</h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm">Tres pasos y tu pedido está en camino.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <Users className="h-6 w-6" />,
                title: 'Registrate y elegí tu barrio',
                desc: 'Creá tu cuenta, indicá en qué barrio privado vivís y tu número de lote. Listo para comprar.',
              },
              {
                step: '02',
                icon: <ShoppingCart className="h-6 w-6" />,
                title: 'Elegí tus productos',
                desc: 'Navegá el catálogo mayorista, sumá lo que necesitás al carrito y confirmá tu pedido.',
              },
              {
                step: '03',
                icon: <Truck className="h-6 w-6" />,
                title: 'Recibís en tu puerta',
                desc: 'Cuando el barrio llega al mínimo de demanda, coordinamos la compra y el envío llega directo a tu lote.',
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="relative bg-white border border-blue-100 rounded-2xl p-8 hover:shadow-md hover:border-blue-200 transition-all">
                <span className="text-6xl font-black text-blue-50 absolute top-4 right-5 leading-none select-none">{step}</span>
                <div className="h-12 w-12 bg-blue-900 text-white rounded-xl flex items-center justify-center mb-5 shadow-sm">
                  {icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Beneficios ──────────────────────────────────────────── */}
      <section className="py-24 bg-blue-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">¿Por qué CoMarket?</h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm">La forma más inteligente de abastecer tu casa.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white border border-blue-100 rounded-2xl p-8 hover:shadow-md transition-all">
              <div className="h-12 w-12 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center mb-5">
                <TrendingDown className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Precios reales de mayorista</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Al unificar la demanda del barrio llegamos a los volúmenes mínimos de Maxi Consumo y otros distribuidores. Comprás como si tuvieras un almacén.
              </p>
            </div>

            <div className="bg-white border border-blue-100 rounded-2xl p-8 hover:shadow-md transition-all">
              <div className="h-12 w-12 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center mb-5">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Cada uno paga lo suyo</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                No hay que coordinar entre vecinos ni juntar plata. Cada uno elige lo que necesita y paga su parte. Nosotros unificamos el pedido.
              </p>
            </div>

            <div className="bg-white border border-blue-100 rounded-2xl p-8 hover:shadow-md transition-all">
              <div className="h-12 w-12 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center mb-5">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Entrega directo en el lote</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Un solo camión entra al barrio y distribuye. Menos tránsito en el acceso, menos tiempo coordinando, menos costo de flete.
              </p>
            </div>

            <div className="bg-white border border-blue-100 rounded-2xl p-8 hover:shadow-md transition-all">
              <div className="h-12 w-12 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center mb-5">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sin compromiso hasta que se llega</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Si un producto no alcanza la demanda mínima del barrio, podés elegir comprarlo a precio minorista o directamente no incluirlo. Vos decidís.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
