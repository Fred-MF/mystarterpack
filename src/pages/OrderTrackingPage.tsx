import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Package, Truck, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OrderWithTracking {
  id: string;
  created_at: string;
  amount_total: number;
  currency: string;
  status: string;
  tracking_number?: string;
  carrier?: string;
  shipping_status?: string;
  estimated_delivery?: string;
  shipping_address?: {
    line1?: string;
    line2?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  };
  uploaded_files?: Array<{
    name: string;
    type: string;
    path: string;
    url: string;
  }>;
}

function OrderTrackingPage() {
  const [orders, setOrders] = useState<OrderWithTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('stripe_user_orders')
          .select('*')
          .order('order_date', { ascending: false });

        if (orderError) throw orderError;

        const ordersWithTracking = await Promise.all(
          orderData.map(async (order) => {
            const { data: trackingData } = await supabase
              .from('order_tracking')
              .select('*')
              .eq('order_id', order.order_id)
              .maybeSingle();

            // Get the uploaded files for this order
            const { data: orderDetails } = await supabase
              .from('stripe_orders')
              .select('uploaded_files')
              .eq('id', order.order_id)
              .single();

            return {
              id: order.order_id,
              created_at: order.order_date,
              amount_total: order.amount_total / 100,
              currency: order.currency,
              status: order.order_status,
              tracking_number: trackingData?.tracking_number || null,
              carrier: trackingData?.carrier || null,
              shipping_status: trackingData?.status || 'pending',
              estimated_delivery: trackingData?.estimated_delivery || null,
              shipping_address: trackingData?.shipping_address || null,
              uploaded_files: orderDetails?.uploaded_files || [],
            };
          })
        );

        setOrders(ordersWithTracking);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError('Une erreur est survenue lors du chargement des commandes.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de vos commandes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Aucune commande</h2>
          <p className="mt-2 text-gray-600">Vous n'avez pas encore passé de commande.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Suivi de commande - StarterPrint3D</title>
        <meta name="description" content="Suivez l'état de votre commande de Starter Pack d'impression 3D personnalisé" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Suivi de commande</h1>

        {orders.map((order) => (
          <div key={order.id} className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left column: Order tracking */}
              <div className="space-y-8">
                {/* Étape de commande */}
                <div className="relative flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Commande confirmée</h3>
                    <p className="text-sm text-gray-500">
                      Commande #{order.id} du {formatDateTime(order.created_at)}
                    </p>
                  </div>
                </div>

                {/* Étape de production */}
                <div className="relative flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 ${
                    order.shipping_status === 'processing' ? 'bg-blue-100' : 'bg-gray-100'
                  } rounded-full`}>
                    <Package className={`w-6 h-6 ${
                      order.shipping_status === 'processing' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">En production</h3>
                    <p className="text-sm text-gray-500">
                      {order.shipping_status === 'processing' 
                        ? 'Vos modèles 3D sont en cours de préparation'
                        : order.shipping_status === 'shipped' || order.shipping_status === 'delivered'
                        ? 'Production terminée'
                        : 'En attente de production'}
                    </p>
                  </div>
                </div>

                {/* Étape d'expédition */}
                <div className="relative flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 ${
                    order.shipping_status === 'shipped' || order.shipping_status === 'delivered'
                      ? 'bg-blue-100'
                      : 'bg-gray-100'
                  } rounded-full`}>
                    <Truck className={`w-6 h-6 ${
                      order.shipping_status === 'shipped' || order.shipping_status === 'delivered'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Expédition</h3>
                    {order.tracking_number ? (
                      <div className="text-sm text-gray-500">
                        <p>Numéro de suivi : {order.tracking_number}</p>
                        <p>Transporteur : {order.carrier}</p>
                        {order.estimated_delivery && (
                          <p>Livraison estimée : {new Date(order.estimated_delivery).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">En attente d'expédition</p>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Détails de la commande</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Numéro de commande</dt>
                        <dd className="text-sm text-gray-900">#{order.id}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Date de commande</dt>
                        <dd className="text-sm text-gray-900">
                          {formatDateTime(order.created_at)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Total</dt>
                        <dd className="text-sm text-gray-900">{order.amount_total.toFixed(2)} €</dd>
                      </div>
                      {order.shipping_address && (
                        <div className="pt-2 mt-2 border-t border-gray-200">
                          <dt className="text-sm font-medium text-gray-500 mb-1">Adresse de livraison</dt>
                          <dd className="text-sm text-gray-900">
                            <p>{order.shipping_address.line1}</p>
                            {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                            <p>
                              {order.shipping_address.postal_code} {order.shipping_address.city}
                            </p>
                            <p>{order.shipping_address.country}</p>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>

              {/* Right column: Visual preview */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Aperçu de votre commande</h4>
                {order.uploaded_files && order.uploaded_files.length > 0 ? (
                  <div className="space-y-4">
                    {order.uploaded_files.map((file, index) => (
                      <div key={index} className="relative aspect-square w-full overflow-hidden rounded-lg bg-white shadow">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={file.url}
                            alt={`Aperçu ${index + 1}`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-16 w-16 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">Aperçu non disponible</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Aucun aperçu disponible</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default OrderTrackingPage;