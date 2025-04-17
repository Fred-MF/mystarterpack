import React, { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Copy, ExternalLink, Upload, ShoppingCart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useCart } from '../lib/cart';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { supabase } from '../lib/supabase';
import AuthModal from '../components/AuthModal';

const STORAGE_KEY = 'starterprint3d_form_data';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function CustomizePage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : {
      title: '',
      subtitle: '',
      expression: '',
      posture: '',
      habillement: '',
      accessoire1: '',
      accessoire2: '',
      accessoire3: '',
      imageUrl: '',
      file: null as File | null,
    };
  });

  const [promptCopied, setPromptCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner un fichier image valide');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > MAX_FILE_SIZE) {
        setError('La taille du fichier ne doit pas dépasser 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setPreviewImage(imageUrl);
        setFormData(prev => ({
          ...prev,
          imageUrl,
          file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePrompt = useCallback(() => {
    return `Crée un rendu 3D de haute qualité d'une figurine en style cartoon, présentée sous blister, à la manière d'un jouet de collection. Le fond en carton est bleu clair et porte une étiquette de jouet rétro. En haut au centre, en grandes lettres majuscules et en gras et noir, écris "${formData.title}". Juste en dessous, tu peux écrire "${formData.subtitle}" en plus petit en bas à droite. En haut à droite, un badge bleu circulaire indique "ACTION FIGURE". En haut à gauche, une petite bulle blanche indique "4+". 

Le personnage se tient debout, moulé dans une boîte en plastique transparente fixée sur un support en carton plat. Il doit ressembler à la [PHOTO PORTRAIT] fournie. L'expression de son visage est ${formData.expression}. Sa posture est ${formData.posture}. Le ton général est léger et réaliste. 

La figurine est habillée de ${formData.habillement}. Sur le côté de la figurine, intégrés dans des moules en plastique distincts, sont présents 3 accessoires :
${formData.accessoire1}
${formData.accessoire2}
${formData.accessoire3}

Chaque accessoire s'insère parfaitement dans son propre compartiment moulé. L'emballage est photographié ou rendu avec des ombres douces, un éclairage uniforme et un fond blanc épuré pour donner l'impression d'une séance photo commerciale.

Le style doit allier réalisme et stylisation du dessin animé 3D, à l'image de Pixar ou des maquettes de jouets modernes. Assure-toi que la disposition et les proportions du produit ressemblent à celles d'un véritable jouet vendu en magasin. Attache une attention toute particulière à ce que le visage de la figurine ressemble fidèlement à la photo portrait fournie.`;
  }, [formData]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatePrompt());
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const openChatGPT = () => {
    window.open('https://chat.openai.com', '_blank');
  };

  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

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
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // If not authenticated, show auth modal
        setIsAuthModalOpen(true);
        return;
      }

      // Validate required fields
      if (!formData.file) {
        setError('Veuillez télécharger le fichier de votre starter pack');
        return;
      }

      // Upload file to Supabase Storage
      const uploadedFile = await uploadFile(formData.file, session.user.id);

      // Add item to cart with the correct price and priceId
      const product = STRIPE_PRODUCTS.STARTER_PACK_1X; // Default to 1x pack
      await addItem({
        id: uuidv4(),
        title: formData.title || 'Starter Pack Personnalisé',
        imageUrl: previewImage || '',
        quantity: 1,
        price: product.price,
        priceId: product.priceId,
        formData: formData,
        uploadedFile,
      });

      // Navigate to cart
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
        <title>Personnalisez Votre Starter Pack | StarterPrint3D</title>
        <meta name="description" content="Personnalisez votre Starter Pack d'impression 3D en définissant les caractéristiques de votre figurine personnalisée." />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Personnalisez Votre Starter Pack
        </h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -z-10"></div>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                } font-semibold`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-blue-600 font-medium">Personnalisation</span>
            <span className={currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}>Image générée</span>
            <span className={currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'}>Commande</span>
          </div>
        </div>

        {/* Step 1: Customization Form */}
        <div className={`transition-all duration-300 ${currentStep === 1 ? 'opacity-100' : 'hidden opacity-0'}`}>
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-lg p-6 mb-8">
            <p className="text-gray-600 mb-6">
              Complétez le formulaire ci-dessous pour personnaliser votre figurine. Une fois terminé, 
              vous pourrez copier le prompt et l'utiliser dans ChatGPT pour générer votre design unique.
            </p>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Titre de la figurine
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ex: SUPER HERO MIKE"
                  />
                </div>

                <div>
                  <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Sous-titre
                  </label>
                  <input
                    type="text"
                    id="subtitle"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ex: Edition Limitée"
                  />
                </div>

                <div>
                  <label htmlFor="expression" className="block text-sm font-medium text-gray-700 mb-1">
                    Expression du visage
                  </label>
                  <input
                    type="text"
                    id="expression"
                    name="expression"
                    value={formData.expression}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ex: souriante et déterminée"
                  />
                </div>

                <div>
                  <label htmlFor="posture" className="block text-sm font-medium text-gray-700 mb-1">
                    Posture
                  </label>
                  <input
                    type="text"
                    id="posture"
                    name="posture"
                    value={formData.posture}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ex: en position de combat"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="habillement" className="block text-sm font-medium text-gray-700 mb-1">
                  Habillement
                </label>
                <input
                  type="text"
                  id="habillement"
                  name="habillement"
                  value={formData.habillement}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ex: une combinaison de super-héros bleue et rouge avec une cape"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Accessoires</h3>
                <div>
                  <label htmlFor="accessoire1" className="block text-sm font-medium text-gray-700 mb-1">
                    Accessoire 1
                  </label>
                  <input
                    type="text"
                    id="accessoire1"
                    name="accessoire1"
                    value={formData.accessoire1}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ex: un bouclier high-tech lumineux"
                  />
                </div>
                <div>
                  <label htmlFor="accessoire2" className="block text-sm font-medium text-gray-700 mb-1">
                    Accessoire 2
                  </label>
                  <input
                    type="text"
                    id="accessoire2"
                    name="accessoire2"
                    value={formData.accessoire2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ex: un jet-pack futuriste"
                  />
                </div>
                <div>
                  <label htmlFor="accessoire3" className="block text-sm font-medium text-gray-700 mb-1">
                    Accessoire 3
                  </label>
                  <input
                    type="text"
                    id="accessoire3"
                    name="accessoire3"
                    value={formData.accessoire3}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ex: une arme laser non létale"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Prompt généré</h2>
            <div className="bg-white p-4 rounded-md border border-gray-200 mb-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono">
                {generatePrompt()}
              </pre>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleCopyPrompt}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Copy className="h-5 w-5 mr-2" />
                {promptCopied ? 'Copié !' : 'Copier le prompt'}
              </button>
              <button
                onClick={openChatGPT}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Ouvrir ChatGPT
              </button>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={handleNextStep}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Passer à l'étape suivante
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Image Upload */}
        <div className={`transition-all duration-300 ${currentStep === 2 ? 'opacity-100' : 'hidden opacity-0'}`}>
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Téléchargez votre image générée</h2>
            <p className="text-gray-600 mb-6">
              Une fois que ChatGPT a généré votre image, téléchargez-la ici pour finaliser votre commande.
            </p>

            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="imageUpload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-3" />
                  <span className="text-sm text-gray-600">
                    Cliquez pour sélectionner une image ou glissez-la ici
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Taille maximale : 10MB
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {previewImage && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aperçu</h3>
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={previewImage}
                      alt="Aperçu de l'image générée"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-center mt-6">
                <button
                  onClick={handleNextStep}
                  disabled={!previewImage}
                  className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                    previewImage
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  Continuer vers la commande
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Order Summary */}
        <div className={`transition-all duration-300 ${currentStep === 3 ? 'opacity-100' : 'hidden opacity-0'}`}>
          <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Récapitulatif de votre commande</h2>
            
            {error && (
              <div className="text-red-600 text-center mb-4">
                {error}
              </div>
            )}
            
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
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}

export default CustomizePage;