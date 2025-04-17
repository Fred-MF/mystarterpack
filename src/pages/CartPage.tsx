import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '../lib/cart';
import { supabase } from '../lib/supabase';
import AuthModal from '../components/AuthModal';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, total } = useCart();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 3) {
      updateQuantity(id, newQuantity);
    }
  };

  const handleProceedToCheckout = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthModalOpen(true);
        return;
      }

      navigate('/checkout');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    handleProceedToCheckout();
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Votre panier est vide</h2>
          <p className="mt-2 text-gray-600">
            Commencez par personnaliser votre Starter Pack
          </p>
          <Link
            to="/personnaliser"
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Créer un Starter Pack
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Votre panier - StarterPrint3D</title>
        <meta name="description" content="Consultez et modifiez votre panier StarterPrint3D" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Votre panier</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {items.map((item) => (
                  <li key={item.id} className="p-6">
                    <div className="flex items-center">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                      <div className="ml-6 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Starter Pack personnalisé
                        </p>
                        <div className="mt-4 flex items-center">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="text-gray-500 hover:text-gray-600 p-1"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="mx-4 text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="text-gray-500 hover:text-gray-600 p-1"
                            disabled={item.quantity >= 3}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-6 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="ml-6">
                        <p className="text-lg font-medium text-gray-900">
                          {item.price.toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Link
                to="/personnaliser"
                className="inline-flex items-center text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Ajouter un autre Starter Pack
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Récapitulatif
              </h2>
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Sous-total</dt>
                  <dd className="text-gray-900">{total().toFixed(2)} €</dd>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <dt className="text-lg font-medium text-gray-900">Total</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {total().toFixed(2)} €
                  </dd>
                </div>
              </dl>

              <button
                onClick={handleProceedToCheckout}
                disabled={isLoading}
                className={`mt-6 w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Chargement...' : 'Procéder au paiement'}
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </>
  );
}