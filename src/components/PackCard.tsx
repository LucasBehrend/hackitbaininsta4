import { ShoppingCart, Package } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import { type Product } from './ProductCard';

export interface Pack {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  productos: string[];
}

interface PackCardProps {
  pack: Pack;
  allProducts: Product[];
}

export default function PackCard({ pack, allProducts }: PackCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const resolvedProducts = pack.productos
    .map((name) => allProducts.find((p) => p.name.trim() === name.trim()))
    .filter((p): p is Product => p !== undefined);

  const total = resolvedProducts.reduce((sum, p) => sum + p.price, 0);

  const handleAddPack = () => {
    resolvedProducts.forEach((product) => {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
      });
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all flex flex-col">
      <div className="relative h-44 overflow-hidden bg-blue-50">
        <img
          src={pack.imagen}
          alt={pack.nombre}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-3 left-3 bg-blue-900 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Package className="h-3 w-3" />
          Pack
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-extrabold text-gray-900 text-base mb-1">{pack.nombre}</h3>
        <p className="text-gray-400 text-xs mb-4 leading-relaxed">{pack.descripcion}</p>

        <ul className="space-y-1 mb-4 flex-1">
          {resolvedProducts.map((p) => (
            <li key={p.id} className="flex justify-between items-center text-xs text-gray-600">
              <span className="truncate mr-2">{p.name}</span>
              <span className="font-semibold text-gray-800 flex-shrink-0">${p.price.toFixed(2)}</span>
            </li>
          ))}
          {resolvedProducts.length < pack.productos.length && (
            <li className="text-xs text-red-400 italic">
              {pack.productos.length - resolvedProducts.length} producto(s) no encontrado(s)
            </li>
          )}
        </ul>

        <div className="border-t border-blue-50 pt-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">Total pack</div>
            <div className="text-xl font-black text-blue-900">${total.toFixed(2)}</div>
          </div>
          <button
            onClick={handleAddPack}
            disabled={resolvedProducts.length === 0}
            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-4 w-4" />
            Agregar pack
          </button>
        </div>
      </div>
    </div>
  );
}
