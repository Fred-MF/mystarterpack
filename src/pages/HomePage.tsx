import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Wand2, Printer, Package, Truck } from 'lucide-react';

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>MyStarterPack - Votre Starter Pack personnalisé imprimé en 3D</title>
        <meta name="description" content="Découvrez nos starter packs d'impression 3D personnalisés et générés par IA. Commandez vos modèles 3D uniques dès maintenant." />
      </Helmet>

      <div className="relative">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1631544114506-c920f0c6e4c8?auto=format&fit=crop&q=80"
            alt="Impression 3D en action"
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              Votre Starter Pack 3D personnalisé
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
              Créez votre pack de démarrage unique généré par IA et lancez-vous dans l'impression 3D.
            </p>
            <div className="mt-10">
              <Link
                to="/personnaliser"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Commencer la personnalisation
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Comment ça marche ?
            </h2>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="flex justify-center">
                  <Wand2 className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Personnalisez</h3>
                <p className="mt-2 text-base text-gray-500">
                  Définissez vos préférences et laissez l'IA créer votre pack unique
                </p>
              </div>

              <div className="text-center">
                <div className="flex justify-center">
                  <Printer className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Génération</h3>
                <p className="mt-2 text-base text-gray-500">
                  Notre IA génère des modèles 3D adaptés à vos besoins
                </p>
              </div>

              <div className="text-center">
                <div className="flex justify-center">
                  <Package className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Commandez</h3>
                <p className="mt-2 text-base text-gray-500">
                  Validez votre pack et procédez au paiement sécurisé
                </p>
              </div>

              <div className="text-center">
                <div className="flex justify-center">
                  <Truck className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Réception</h3>
                <p className="mt-2 text-base text-gray-500">
                  Recevez votre pack et commencez à imprimer
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;