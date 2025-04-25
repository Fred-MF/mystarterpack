import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Upload } from 'lucide-react';
import StepperLayout from '../components/StepperLayout';

const STORAGE_KEY = 'starterprint3d_form_data';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PREVIEW_SIZE = 800; // Max width/height for preview

export default function UploadDesignPage() {
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height && width > MAX_PREVIEW_SIZE) {
            height = Math.round((height * MAX_PREVIEW_SIZE) / width);
            width = MAX_PREVIEW_SIZE;
          } else if (height > MAX_PREVIEW_SIZE) {
            width = Math.round((width * MAX_PREVIEW_SIZE) / height);
            height = MAX_PREVIEW_SIZE;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // Use JPEG with 70% quality
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      const file = e.target.files?.[0];
      
      if (!file) {
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner un fichier image valide');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('La taille du fichier ne doit pas dépasser 10MB');
        return;
      }

      // Generate compressed preview
      const compressedPreview = await compressImage(file);
      setPreviewImage(compressedPreview);

      // Store minimal file data
      const formData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        content: compressedPreview // Store compressed version
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...formData,
          file: fileData
        }));
      } catch (storageError) {
        console.error('Storage error:', storageError);
        setError('Erreur lors de la sauvegarde. Veuillez réessayer avec une image plus petite.');
        return;
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Une erreur est survenue lors du traitement de l\'image');
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