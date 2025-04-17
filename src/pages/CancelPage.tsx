import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const CancelPage = () => {
  return (
    <>
      <Helmet>
        <title>Paiement annulé - StarterPrint3D</title>
        <meta name="description" content="Le paiement a été annulé." />
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Paiement annulé
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Votre paiement a été annulé. Aucun montant n'a été débité.
            </p>
          </div>

          <div className="mt-8">
            <Link
              to="/commander"
              className="block w-full bg-blue-600 text-center py-3 px-4 rounded-md text-white font-medium hover:bg-blue-700"
            >
              Réessayer
            </Link>
            <Link
              to="/"
              className="block w-full mt-4 text-center py-3 px-4 rounded-md text-gray-600 font-medium hover:text-gray-900"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CancelPage;