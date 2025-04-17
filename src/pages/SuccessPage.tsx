import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/cart';

interface OrderDetails {
  amount_total: number;
  currency: string;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
  order_id: string;
  created_at: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { clearCart } = useCart();

  useEffect(() => {
    let retryCount = 0;
    let mounted = true;

    const fetchOrderDetails = async () => {
      try {
        if (!sessionId) {
          setError('Session de paiement introuvable. Veuillez réessayer votre achat.');
          setIsLoading(false);
          return;
        }

        // Check authentication status
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error('Erreur d\'authentification. Veuillez vous reconnecter.');
        }

        if (!session) {
          // Redirect to home if not authenticated
          navigate('/', { 
            replace: true,
            state: { 
              error: 'Votre session a expiré. Veuillez vous reconnecter pour voir les détails de votre commande.' 
            }
          });
          return;
        }

        const fetchOrder = async () => {
          const { data: order, error: orderError } = await supabase
            .from('stripe_orders')
            .select('*')
            .eq('checkout_session_id', sessionId)
            .maybeSingle();

          if (orderError) {
            console.error('Error fetching order:', orderError);
            throw new Error('Erreur lors de la récupération de la commande');
          }

          return order;
        };

        let order = await fetchOrder();

        // Implement retry mechanism with delay
        while (!order && retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          order = await fetchOrder();
        }

        if (!order) {
          throw new Error('Commande introuvable. Veuillez contacter le support.');
        }

        if (mounted) {
          setOrderDetails({
            amount_total: order.amount_total / 100,
            currency: order.currency,
            items: [],
            order_id: order.id,
            created_at: order.created_at,
          });

          // Only clear cart after successful order fetch
          clearCart();
        }
      } catch (err: any) {
        console.error('Error processing success page:', err);
        if (mounted) {
          setError(err.message || 'Une erreur est survenue lors de la vérification de votre commande');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrderDetails();

    // Cleanup function to prevent state updates after unmount
    return () => {
      mounted = false;
    };
  }, [sessionId, clearCart, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de votre commande...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Une erreur est survenue
          </h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link
            to="/"
            className="mt-6 inline-block px-6 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Commande confirmée - StarterPrint3D</title>
        <meta name="description" content="Votre commande a été confirmée avec succès." />
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Merci pour votre commande !
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Votre paiement a été traité avec succès.
            </p>
          </div>

          {orderDetails && (
            <div className="mt-8">
              <div className="bg-white shadow rounded-lg">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">Détails de la commande</h3>
                  <dl className="mt-4 space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Numéro de commande</dt>
                      <dd className="text-sm text-gray-900">#{orderDetails.order_id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-600">Date</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(orderDetails.created_at).toLocaleDateString('fr-FR')}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-4">
                      <dt className="text-sm font-medium text-gray-600">Total</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {orderDetails.amount_total.toFixed(2)} €
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <Link
                  to="/suivi-commande"
                  className="block w-full bg-blue-600 text-center py-3 px-4 rounded-md text-white font-medium hover:bg-blue-700"
                >
                  Suivre ma commande
                </Link>
                <Link
                  to="/"
                  className="block w-full text-center py-3 px-4 rounded-md text-gray-600 font-medium hover:text-gray-900"
                >
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SuccessPage;