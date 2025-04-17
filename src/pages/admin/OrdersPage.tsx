import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Package, Truck, MapPin, Eye, X, Download } from 'lucide-react';

interface Order {
  order_id: string;
  checkout_session_id: string;
  customer_email: string;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  tracking_number?: string;
  carrier?: string;
  shipping_status?: string;
  order_date: string;
  shipping_address?: {
    line1: string;
    line2?: string;
    postal_code: string;
    city: string;
    country: string;
  };
  uploaded_files?: Array<{
    name: string;
    type: string;
    path: string;
    url: string;
  }>;
}

interface TrackingUpdate {
  tracking_number: string;
  carrier: string;
  estimated_delivery: string;
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingUpdate>({
    tracking_number: '',
    carrier: '',
    estimated_delivery: ''
  });
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!isAdmin) return;

        const { data, error } = await supabase
          .from('admin_orders')
          .select('*')
          .order('order_date', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError('Erreur lors du chargement des commandes');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAdmin]);

  const updateShippingStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('order_tracking')
        .update({ status })
        .eq('order_id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.order_id === orderId 
          ? { ...order, shipping_status: status }
          : order
      ));
    } catch (err: any) {
      console.error('Error updating shipping status:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const updateTracking = async (orderId: string) => {
    try {
      const { error: trackingError } = await supabase
        .from('order_tracking')
        .upsert({
          order_id: orderId,
          tracking_number: trackingData.tracking_number,
          carrier: trackingData.carrier,
          estimated_delivery: trackingData.estimated_delivery,
          status: 'shipped'
        });

      if (trackingError) throw trackingError;

      setOrders(orders.map(order => 
        order.order_id === orderId 
          ? { 
              ...order, 
              tracking_number: trackingData.tracking_number,
              carrier: trackingData.carrier,
              shipping_status: 'shipped'
            }
          : order
      ));

      setEditingOrder(null);
      setTrackingData({
        tracking_number: '',
        carrier: '',
        estimated_delivery: ''
      });
    } catch (err: any) {
      console.error('Error updating tracking:', err);
      setError('Erreur lors de la mise à jour du suivi');
    }
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Erreur lors du téléchargement du fichier');
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des commandes...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gestion des commandes - StarterPrint3D</title>
        <meta name="description" content="Gestion des commandes StarterPrint3D" />
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestion des commandes</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expédition
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.order_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order.order_id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.order_date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.customer_email}</div>
                      {order.shipping_address && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {order.shipping_address.city}, {order.shipping_address.country}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(order.amount_total / 100).toFixed(2)} €
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.payment_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.payment_status === 'paid' ? 'Payé' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.shipping_status || 'pending'}
                        onChange={(e) => updateShippingStatus(order.order_id, e.target.value)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="pending">En attente</option>
                        <option value="processing">En préparation</option>
                        <option value="shipped">Expédié</option>
                        <option value="delivered">Livré</option>
                        <option value="returned">Retourné</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-700 inline-flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Détails de la commande #{selectedOrder.order_id}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Informations client</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Email: {selectedOrder.customer_email}</p>
                  {selectedOrder.shipping_address && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">Adresse de livraison:</p>
                      <p className="text-sm text-gray-600">{selectedOrder.shipping_address.line1}</p>
                      {selectedOrder.shipping_address.line2 && (
                        <p className="text-sm text-gray-600">{selectedOrder.shipping_address.line2}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {selectedOrder.shipping_address.postal_code} {selectedOrder.shipping_address.city}
                      </p>
                      <p className="text-sm text-gray-600">{selectedOrder.shipping_address.country}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Suivi d'expédition</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {editingOrder === selectedOrder.order_id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Numéro de suivi
                        </label>
                        <input
                          type="text"
                          value={trackingData.tracking_number}
                          onChange={(e) => setTrackingData(prev => ({ ...prev, tracking_number: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Transporteur
                        </label>
                        <input
                          type="text"
                          value={trackingData.carrier}
                          onChange={(e) => setTrackingData(prev => ({ ...prev, carrier: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Date de livraison estimée
                        </label>
                        <input
                          type="date"
                          value={trackingData.estimated_delivery}
                          onChange={(e) => setTrackingData(prev => ({ ...prev, estimated_delivery: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateTracking(selectedOrder.order_id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingOrder(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {selectedOrder.tracking_number ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Numéro de suivi:</span> {selectedOrder.tracking_number}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Transporteur:</span> {selectedOrder.carrier}
                          </p>
                          <button
                            onClick={() => {
                              setEditingOrder(selectedOrder.order_id);
                              setTrackingData({
                                tracking_number: selectedOrder.tracking_number || '',
                                carrier: selectedOrder.carrier || '',
                                estimated_delivery: selectedOrder.shipping_status || ''
                              });
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Modifier
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingOrder(selectedOrder.order_id)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Ajouter les informations de suivi
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Fichiers uploadés</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedOrder.uploaded_files && selectedOrder.uploaded_files.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedOrder.uploaded_files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-600">{file.name}</span>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(file.url, file.name)}
                            className="ml-2 text-blue-600 hover:text-blue-700 inline-flex items-center"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Aucun fichier uploadé</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrdersPage;