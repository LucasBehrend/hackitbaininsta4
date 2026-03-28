import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function CheckoutResult() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <CheckCircle className="h-24 w-24 text-green-500 mb-6 animate-bounce" />
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">¡Pedido registrado!</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-lg">
        Tu pedido ha sido sumado a la demanda de tu barrio.
      </p>

      <div className="bg-blue-50 text-blue-800 p-6 rounded-xl border border-blue-100 max-w-md w-full shadow-sm mb-8">
        <h3 className="font-bold text-lg mb-2">Aviso MVP</h3>
        <p className="text-sm">
          El pago no está implementado en esta versión. Nos pondremos en contacto cuando se alcance el mínimo comunal para coordinar la entrega.
        </p>
      </div>

      <p className="text-sm text-gray-500 animate-pulse">Redirigiendo al inicio en unos segundos...</p>
    </div>
  );
}
