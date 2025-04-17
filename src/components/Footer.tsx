import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">StarterPrint3D</h3>
            <p className="text-gray-400">
              Votre partenaire pour des starter packs d'impression 3D personnalisés et générés par IA.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-400" />
                <span>contact@starterprint3d.fr</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-blue-400" />
                <span>01 23 45 67 89</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-400" />
                <span>Paris, France</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens utiles</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/mentions-legales" className="text-gray-400 hover:text-white">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link to="/cgv" className="text-gray-400 hover:text-white">
                  CGV
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="text-gray-400 hover:text-white">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} StarterPrint3D. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;