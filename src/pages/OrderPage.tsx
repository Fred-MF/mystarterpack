import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useCart } from '../lib/cart';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { supabase } from '../lib/supabase';
import AuthModal from '../components/AuthModal';
import StepperLayout from '../components/StepperLayout';

const STORAGE_KEY = 'starterprint3d_form_data';

export default function OrderPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { addItem } = useCart();

  const uploadFile = async (file: File, userId: string): Promise<{ path: string; name: string; type: string }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('starter-pack-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
        },
      });

    if (uploadError) {
      throw new Error('Erreur lors de l\'upload du fichier');
    }

    return {
      path: filePath,
      name: file.name,
      type: file.type,
    };
  };

  const handleProceedToCheckout = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthModalOpen(true);
        return;
      }

      const formData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!formData.file) {
        setError('Veuillez télécharger le fichier de votre starter pack');
        return;
      }

      const uploadedFile = await uploadFile(formData.file, session.user.id);

      const product = STRIPE_PRODUCTS.STARTER_PACK_1X;
      await addItem({
        id: uuidv4(),
        title: formData.title || 'Starter Pack Personnalisé',
        imageUrl: formData.imageUrl || '',
        quantity: 1,
        price: product.price,
        priceId: product.priceId,
        formData: formData,
        uploadedFile,
      });

      navigate('/panier');
    } catch (error: any) {
      console.error('Error during checkout:', error);
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleAuthSuccess = async () => {
    setIsAuthModalOpen(false);
    await handleProceedToCheckout();
  };

  return (
    <>
      <Helmet>
        <title>Commander votre Starter Pack | StarterPrint3D</title>
        <meta name="description" content="Finalisez votre commande de Starter Pack personnalisé" />
      </Helmet>

      <StepperLayout
        instructions="Vérifiez les détails de votre commande et ajoutez votre Starter Pack au panier pour procéder au paiement."
      >
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Votre Starter Pack comprend :</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Fichiers 3D optimisés pour l'impression</li>
              <li>Guide d'impression détaillé</li>
              <li>Support technique par email</li>
              <li>Licence d'utilisation personnelle</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Starter Pack Personnalisé</span>
              <span className="text-gray-900 font-medium">29.50 €</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">29.50 €</span>
            </div>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleProceedToCheckout}
              disabled={isLoading}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isLoading ? 'Chargement...' : 'Ajouter au panier'}
            </button>
          </div>
        </div>
      </StepperLayout>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}