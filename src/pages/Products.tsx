import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import useAuthStore from '../store/useAuthStore';
import ProductCard, { type Product } from '../components/ProductCard';
import PackCard, { type Pack } from '../components/PackCard';
import productosData from '../data/productos1.json';
import packsData from '../data/packs.json';

const parsePrice = (priceStr: string): number => {
  const numericStr = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(numericStr);
};

const CATEGORIES = ['Todos', 'Packs', 'Alimentos', 'Bebidas', 'Higiene', 'Limpieza'] as const;
type Category = typeof CATEGORIES[number];

const baseProducts: Product[] = productosData.map((item, index) => ({
  id: `prod-${index}`,
  name: item.nombre,
  description: 'Producto de catálogo mayorista.',
  category: (item.Categoria as Category) ?? 'Alimentos',
  price: parsePrice(item.precio),
  precioMino: parsePrice(item.precioMino),
  esencial: item.Esencial === 1,
  image: item.imagen,
  demand: 0,
}));

const packs: Pack[] = packsData as Pack[];

export default function Products() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Todos');
  const [products, setProducts] = useState<Product[]>(baseProducts);

  useEffect(() => {
    const fetchDemandAndLoadProducts = async () => {
      if (!user || !user.neighborhood) {
        setProducts(baseProducts);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'orders'),
          where('neighborhood', '==', user.neighborhood)
        );

        const querySnapshot = await getDocs(q);
        const demandMap: Record<string, number> = {};

        querySnapshot.forEach((doc) => {
          const orderData = doc.data();
          if (orderData.items && Array.isArray(orderData.items)) {
            orderData.items.forEach((item: { id: string; quantity: number }) => {
              if (!demandMap[item.id]) demandMap[item.id] = 0;
              demandMap[item.id] += item.quantity;
            });
          }
        });

        setProducts(baseProducts.map(p => ({ ...p, demand: demandMap[p.id] || 0 })));
      } catch (error) {
        console.error('Error fetching neighborhood demand:', error);
        setProducts(baseProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchDemandAndLoadProducts();
  }, [user]);

  const showingPacks = selectedCategory === 'Packs';

  const filteredPacks = packs.filter((pack) =>
    pack.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col">
      {/* ── Header banner ── */}
      <div className="bg-blue-100 px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-serif font-extrabold text-gray-900 tracking-tight mb-2">
            Productos Mayoristas
          </h1>
          <p className="text-blue-700/70 max-w-2xl text-base">
            Comprá en cantidad con tus vecinos y accedé a precios de mayorista directamente en tu barrio.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={showingPacks ? 'Buscar packs...' : 'Buscar productos...'}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar w-full md:w-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setSearchTerm(''); }}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {showingPacks ? (
          filteredPacks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-blue-100">
              <p className="text-lg font-semibold text-gray-700 mb-1">No se encontraron packs</p>
              <p className="text-gray-400 text-sm">Probá con otro término de búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPacks.map((pack) => (
                <PackCard key={pack.id} pack={pack} allProducts={products} />
              ))}
            </div>
          )
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 overflow-hidden h-96">
                <div className="h-48 bg-blue-50" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-8 bg-gray-100 rounded w-1/3" />
                  <div className="h-10 bg-gray-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-blue-100">
            <p className="text-lg font-semibold text-gray-700 mb-1">No se encontraron productos</p>
            <p className="text-gray-400 text-sm mb-4">Probá ajustando tu búsqueda o filtros.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
              className="text-blue-800 hover:text-blue-900 font-semibold text-sm"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
