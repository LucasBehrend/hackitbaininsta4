import { useState } from 'react';
import { Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  demand?: number; // mock for now
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAddToCart = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setQuantity(1);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col group">
      <div className="relative h-56 bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-gray-400">Sin imagen</div>
        )}

        {/* Overlay gradient for better badge readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-2 leading-tight min-h-[3rem]">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">{product.description}</p>

        <div className="flex items-end justify-between mb-5 mt-auto">
          <div>
            <span className="text-2xl font-black text-gray-900">${product.price.toFixed(2)}</span>
            <span className="text-sm text-gray-500 ml-1">/ un</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={handleDecrement}
              className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:shadow-sm hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isAdded}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="font-bold w-8 text-center text-gray-900">{quantity}</span>
            <button
              onClick={handleIncrement}
              className="p-1.5 rounded-md text-gray-600 hover:bg-white hover:shadow-sm hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isAdded}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAdded}
            className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center font-bold transition-all ${
              isAdded
                ? 'bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-2'
                : user
                ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="h-5 w-5 mr-1.5" />
                ¡Listo!
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 mr-1.5" />
                Agregar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
