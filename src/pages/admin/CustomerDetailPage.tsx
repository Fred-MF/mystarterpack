import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { ArrowLeft, Mail, Package, CreditCard, Calendar } from 'lucide-react';

interface CustomerDetail {
  user_id: string;
  email: string;
  stripe_customer_id: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  subscription_status: string;
  subscription_renewal: number;
  shipping_address?: {
    line1: string;
    line2?: string;
    postal_code: string;
    city: string;
    country: string;
  };
}

interface Order {
  order_id: string;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

const CustomerDetailPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAddress, setEditedAddress] = useState<CustomerDetail['shipping_address']>();

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!isAdmin || !customerId) return;

      try {
        // Fetch customer details
        const { data: customerData, error: customerError } = await supabase
          .from('admin_customers')
          .select('*')
          .eq('user_id', customerId)
          .single();

        if (customerError) throw customerError;

        // Fetch shipping address
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('shipping_address')
          .eq('id', customerId)
          .maybeSingle();

        // Fetch orders
        const { data: orderData, error: orderError } = await supabase
          .from('admin_orders')
          .select('*')
          .eq('user_id', customerId)
          .order('order_date', { ascending: false });

        if (orderError) throw orderError;

        setCustomer({
          ...customerData,
          shipping_address: profileData?.shipping_address || undefined
        });
        setOrders(orderData || []);
        setEditedAddress(profileData?.shipping_address);
      } catch (err: any) {
        console.error('Error fetching customer details:', err);
        setError('Erreur lors du chargement des données client');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [customerId, isAdmin]);

  const handleSaveAddress = async () => {
    if (!customer || !editedAddress) return;

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: customer.user_id,
          shipping_address: editedAddress,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      setCustomer(prev => prev ? {
        ...prev,
        shipping_address: editedAddress
      } : null);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating address:', err);
      setError('Erreur lors de la mise à jour de l\'adresse');
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des données client...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center">
        <p className="text-red-600">Client non trouvé</p>
        <button
          onClick={() => navigate('/admin/clients')}
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Détail client - ${customer.email || 'Client'} | StarterPrint3D`}</title>
        <meta name="description" content="Détails du client" />
      </Helmet>

      <div>
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/clients')}
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour à la liste
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Détails du client</h1>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CreditCard className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">ID Client Stripe</p>
                    <p className="text-sm text-gray-600">{customer.stripe_customer_id}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Package className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Commandes</p>
                    <p className="text-sm text-gray-600">
                      {customer.total_orders} commande(s) - Total: {(customer.total_spent / 100).toFixed(2)} €
                    </p>
                  </div>
                </div>
                {customer.subscription_status && (
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Abonnement</p>
                      <p className="text-sm text-gray-600">
                        Status: {customer.subscription_status}
                        {customer.subscription_renewal && (
                          <> - Renouvellement: {new Date(customer.subscription_renewal * 1000).toLocaleDateString('fr-FR')}</>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Adresse de livraison</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {isEditing ? 'Annuler' : 'Modifier'}
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adresse</label>
                    <input
                      type="text"
                      value={editedAddress?.line1 || ''}
                      onChange={(e) => setEditedAddress(prev => ({ ...prev, line1: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Complément d'adresse</label>
                    <input
                      type="text"
                      value={editedAddress?.line2 || ''}
                      onChange={(e) => setEditedAddress(prev => ({ ...prev, line2: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Code postal</label>
                      <input
                        type="text"
                        value={editedAddress?.postal_code || ''}
                        onChange={(e) => setEditedAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ville</label>
                      <input
                        type="text"
                        value={editedAddress?.city || ''}
                        onChange={(e) => setEditedAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pays</label>
                    <input
                      type="text"
                      value={editedAddress?.country || ''}
                      onChange={(e) => setEditedAddress(prev => ({ ...prev, country: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <button
                    onClick={handleSaveAddress}
                    className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Enregistrer
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  {customer.shipping_address ? (
                    <>
                      <p>{customer.shipping_address.line1}</p>
                      {customer.shipping_address.line2 && <p>{customer.shipping_address.line2}</p>}
                      <p>
                        {customer.shipping_address.postal_code} {customer.shipping_address.city}
                      </p>
                      <p>{customer.shipping_address.country}</p>
                    </>
                  ) : (
                    <p className="italic">Aucune adresse enregistrée</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Historique des commandes</h2>
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.order_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.order_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(order.amount_total / 100).toFixed(2)} €
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDetailPage;