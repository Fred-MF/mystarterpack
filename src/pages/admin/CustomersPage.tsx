import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Eye, AlertCircle } from 'lucide-react';

interface Customer {
  user_id: string;
  email: string;
  stripe_customer_id: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  subscription_status: string;
  subscription_renewal: number;
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { isAdmin, adminLogout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Verify admin status
        const { data: adminCheck, error: adminCheckError } = await supabase.rpc('is_admin');

        if (adminCheckError) {
          console.error('Error checking admin status:', adminCheckError);
          setError('Erreur lors de la vérification des droits administrateur');
          setDebugInfo({
            type: 'admin_check_error',
            error: adminCheckError
          });
          await adminLogout();
          navigate('/admin/login');
          return;
        }

        if (!adminCheck) {
          console.error('User is not admin according to database');
          setError('Accès non autorisé');
          setDebugInfo({
            type: 'unauthorized',
            adminCheck
          });
          await adminLogout();
          navigate('/admin/login');
          return;
        }

        // Fetch customers
        const { data: customers, error: fetchError } = await supabase
          .from('admin_customers')
          .select('*')
          .order('last_order_date', { ascending: false });

        if (fetchError) {
          console.error('Error fetching customers:', fetchError);
          setError('Erreur lors du chargement des clients');
          setDebugInfo({
            type: 'fetch_error',
            error: fetchError
          });
          return;
        }

        setCustomers(customers || []);
      } catch (err: any) {
        console.error('Unexpected error in fetchCustomers:', err);
        setError('Une erreur inattendue est survenue');
        setDebugInfo({
          type: 'unexpected_error',
          error: err
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchCustomers();
    } else {
      navigate('/admin/login');
    }
  }, [isAdmin, adminLogout, navigate]);

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des clients...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gestion des clients - StarterPrint3D</title>
        <meta name="description" content="Gestion des clients StarterPrint3D" />
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestion des clients</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-red-800 font-medium">Erreur</h3>
            </div>
            <p className="text-red-600">{error}</p>
            {debugInfo && (
              <details className="mt-2">
                <summary className="text-sm text-red-500 cursor-pointer">Détails techniques</summary>
                <pre className="mt-2 p-2 bg-red-50 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commandes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total dépensé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abonnement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Aucun client trouvé
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.user_id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{customer.email}</div>
                        <div className="text-sm text-gray-500">ID: {customer.stripe_customer_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.total_orders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(customer.total_spent / 100).toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.last_order_date
                          ? new Date(customer.last_order_date).toLocaleDateString('fr-FR')
                          : 'Jamais'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.subscription_status ? (
                          <div>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              customer.subscription_status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {customer.subscription_status}
                            </span>
                            {customer.subscription_renewal && (
                              <div className="text-sm text-gray-500 mt-1">
                                Renouvellement : {new Date(customer.subscription_renewal * 1000).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Pas d'abonnement</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link
                          to={`/admin/clients/${customer.user_id}`}
                          className="text-blue-600 hover:text-blue-700 inline-flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir détails
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomersPage;