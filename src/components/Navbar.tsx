import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer, ShoppingCart, User, LogOut } from 'lucide-react';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import AuthModal from './AuthModal';

const Navbar = () => {
  const { items } = useCart();
  const { user, isAuthenticated, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Printer className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">StarterPrint3D</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/personnaliser" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
              Personnaliser
            </Link>
            <Link to="/suivi-commande" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
              Suivi
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/compte" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md">
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"
              >
                Connexion
              </button>
            )}
            <Link to="/panier" className="relative flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              <ShoppingCart className="h-5 w-5" />
              <span>Panier</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;