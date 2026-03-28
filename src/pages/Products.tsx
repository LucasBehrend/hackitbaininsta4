import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAuthStore from '../store/useAuthStore';
import ProductCard, { type Product } from '../components/ProductCard';
import productosData from '../data/productos1.json';

const parsePrice = (priceStr: string): number => {
  const numericStr = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(numericStr);
};

const CATEGORIES = ['Todos', 'Alimentos', 'Bebidas', 'Higiene', 'Limpieza'] as const;
type Category = typeof CATEGORIES[number];

const getCategory = (name: string): Category => {
  const n = name.toLowerCase();
  if (/agua|jugo|gaseosa|cerveza|vino|leche|yogur|bebida|sprite|coca|fanta|seven|monster|baggio|cepita|tang|levite|cunnington|villavicencio/.test(n)) return 'Bebidas';
  if (/jabon personal|shampoo|acondicionador|desodorante|pasta dental|cepillo|afeitad|femenin|toalla|pañal|perfume|talco|crema facial|serum|tónico|micellar|limpieza facial/.test(n)) return 'Higiene';
  if (/detergente|lavandina|limpiador|ajax|mr\.?\s*musculo|don benito|procenex|blem|cif|ayudin|ace|ala |ariel|skip|drive|downy|suavitel|pino/.test(n)) return 'Limpieza';
  return 'Alimentos';
};

const baseProducts: Product[] = productosData.map((item, index) => ({
  id: `prod-${index}`,
  name: item.nombre,
  description: 'Producto de catálogo mayorista.',
  category: getCategory(item.nombre),
  price: parsePrice(item.precio),
  image: item.imagen,
  demand: 0,
}));

export default function Products() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Todos');
  const [products, setProducts] = useState<Product[]>(baseProducts);

  useEffect(() => {
    const fetchDemandAndLoadProducts = async () => {
      if (!user || !user.neighborhood) {
        // If not logged in or no neighborhood, just show products with 0 demand
        setProducts(baseProducts);
        setLoading(false);
        return;
      }

      try {
        // Fetch all orders for the user's specific neighborhood
        const q = query(
          collection(db, 'orders'),
          where('neighborhood', '==', user.neighborhood)
        );

        const querySnapshot = await getDocs(q);

        // Calculate total demand per product ID
        const demandMap: Record<string, number> = {};

        querySnapshot.forEach((doc) => {
          const orderData = doc.data();
          if (orderData.items && Array.isArray(orderData.items)) {
            orderData.items.forEach((item: { id: string; quantity: number }) => {
              if (!demandMap[item.id]) {
                demandMap[item.id] = 0;
              }
              demandMap[item.id] += item.quantity;
            });
          }
        });

        // Update products with real demand
        const updatedProducts = baseProducts.map(p => ({
          ...p,
          demand: demandMap[p.id] || 0
        }));

        setProducts(updatedProducts);
      } catch (error) {
        console.error('Error fetching neighborhood demand:', error);
        setProducts(baseProducts); // Fallback
      } finally {
        setLoading(false);
      }
    };

    fetchDemandAndLoadProducts();
  }, [user]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          Productos Mayoristas
        </h1>
        <p className="text-gray-500 max-w-2xl text-lg mb-6">
          Compra en cantidad con tus vecinos y accede a precios de supermercado mayorista directamente en tu barrio.
        </p>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar productos..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-96">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
                <div className="h-10 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">No se encontraron productos</h3>
              <p className="mt-1 text-gray-500">Prueba ajustando tu búsqueda o filtros.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
                className="mt-4 text-green-600 hover:text-green-700 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
