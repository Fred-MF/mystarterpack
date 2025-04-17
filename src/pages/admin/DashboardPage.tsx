import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Users, Package, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  return (
    <>
      <Helmet>
        <title>Administration - StarterPrint3D</title>
        <meta name="description" content="Tableau de bord administrateur StarterPrint3D" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de bord</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/commandes"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Commandes</h2>
                <p className="text-sm text-gray-500">Gérer les commandes</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/clients"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
                <p className="text-sm text-gray-500">Gérer les clients</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/statistiques"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">Statistiques</h2>
                <p className="text-sm text-gray-500">Voir les statistiques</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;