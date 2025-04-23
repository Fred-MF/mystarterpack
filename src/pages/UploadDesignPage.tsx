import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Upload } from 'lucide-react';
import StepperLayout from '../components/StepperLayout';

const STORAGE_KEY = 'starterprint3d_form_data';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadDesignPage() {
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner un fichier image valide');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('La taille du fichier ne doit pas dépasser 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setPreviewImage(imageUrl);
        
        // Update storage with the new image
        const formData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...formData,
          imageUrl,
          file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <Helmet>
        <title>Déposer votre design | StarterPrint3D</title>
        <meta name="description" content="Déposez le design généré par ChatGPT pour votre Starter Pack" />
      </Helmet>

      <StepperLayout
        instructions="Une fois que ChatGPT a généré votre design, téléchargez-le ici. Assurez-vous que l'image correspond bien à vos attentes avant de continuer."
      >
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
        </div>
      </StepperLayout>
    </>
  );
}