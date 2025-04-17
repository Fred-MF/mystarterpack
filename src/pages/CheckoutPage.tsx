import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../lib/cart';
import { createCheckoutSession } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import { MapPin, Building2 } from 'lucide-react';

interface ShippingAddress {
  company_name?: string;
  line1: string;
  line2?: string;
  postal_code: string;
  city: string;
  country: string;
}

const CheckoutPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAddress, setSavedAddress] = useState<ShippingAddress | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<ShippingAddress>({
    company_name: '',
    line1: '',
    line2: '',
    postal_code: '',
    city: '',
    country: 'FR'
  });
  
  const navigate = useNavigate();
  const { items, total } = useCart();

  useEffect(() => {
    const fetchSavedAddress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/panier');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('shipping_address')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profile?.shipping_address) {
          setSavedAddress(profile.shipping_address);
        } else {
          setIsAddingNewAddress(true);
        }
      } catch (err) {
        console.error('Error fetching saved address:', err);
        setError('Erreur lors du chargement de l\'adresse');
      }
    };

    fetchSavedAddress();
  }, [navigate]);

  const handleSaveAddress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/panier');
        return;
      }

      const { error: saveError } = await supabase
        .from('user_profiles')
        .upsert({
          id: session.user.id,
          shipping_address: newAddress,
          updated_at: new Date().toISOString()
        });

      if (saveError) throw saveError;

      setSavedAddress(newAddress);
      setIsAddingNewAddress(false);
    } catch (err) {
      console.error('Error saving address:', err);
      setError('Erreur lors de l\'enregistrement de l\'adresse');
    }
  };

  const handleProceedToCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const address = savedAddress || newAddress;
      if (!address.line1 || !address.postal_code || !address.city) {
        setError('Veuillez renseigner une adresse de livraison complète');
        return;
      }

      const { url } = await createCheckoutSession(items, address);
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Une erreur est survenue lors de la redirection vers le paiement');
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/panier');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Paiement - StarterPrint3D</title>
        <meta name="description" content="Finalisez votre commande de Starter Pack d'impression 3D personnalisé." />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Récapitulatif de la commande
            </h2>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-8">
              {/* Shipping Address Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Adresse de livraison
                </h3>

                {!isAddingNewAddress && savedAddress ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="ml-3">
                        {savedAddress.company_name && (
                          <p className="text-sm text-gray-900 font-medium">{savedAddress.company_name}</p>
                        )}
                        <p className="text-sm text-gray-900">{savedAddress.line1}</p>
                        {savedAddress.line2 && (
                          <p className="text-sm text-gray-900">{savedAddress.line2}</p>
                        )}
                        <p className="text-sm text-gray-900">
                          {savedAddress.postal_code} {savedAddress.city}
                        </p>
                        <p className="text-sm text-gray-900">{savedAddress.country}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAddingNewAddress(true)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-500"
                    >
                      Utiliser une autre adresse
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                        Nom de l'entreprise
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="company_name"
                          value={newAddress.company_name}
                          onChange={(e) => setNewAddress({ ...newAddress, company_name: e.target.value })}
                          className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Optionnel"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="line1" className="block text-sm font-medium text-gray-700">
                        Adresse *
                      </label>
                      <input
                        type="text"
                        id="line1"
                        value={newAddress.line1}
                        onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="line2" className="block text-sm font-medium text-gray-700">
                        Complément d'adresse
                      </label>
                      <input
                        type="text"
                        id="line2"
                        value={newAddress.line2}
                        onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                          Code postal *
                        </label>
                        <input
                          type="text"
                          id="postal_code"
                          value={newAddress.postal_code}
                          onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          Ville *
                        </label>
                        <input
                          type="text"
                          id="city"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                        Pays *
                      </label>
                      <input
                        type="text"
                        id="country"
                        value={newAddress.country}
                        onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                        disabled
                      />
                    </div>

                    <div className="flex justify-between">
                      {savedAddress && (
                        <button
                          type="button"
                          onClick={() => setIsAddingNewAddress(false)}
                          className="text-sm text-gray-600 hover:text-gray-500"
                        >
                          Annuler
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveAddress}
                        className="text-sm text-blue-600 hover:text-blue-500"
                      >
                        Enregistrer cette adresse
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Articles
                </h3>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-b border-gray-200 pb-4">
                      <div className="flex items-center">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="text-gray-900 font-medium">
                        {item.price.toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center text-lg font-medium text-gray-900">
                    <span>Total</span>
                    <span>{total().toFixed(2)} €</span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  disabled={isLoading || (!savedAddress && !newAddress.line1)}
                  className={`mt-8 w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium ${
                    isLoading || (!savedAddress && !newAddress.line1)
                      ? 'opacity-75 cursor-not-allowed'
                      : 'hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? 'Redirection...' : 'Procéder au paiement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;