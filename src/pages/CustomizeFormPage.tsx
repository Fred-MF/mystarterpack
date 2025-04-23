import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Check } from 'lucide-react';
import StepperLayout from '../components/StepperLayout';

const STORAGE_KEY = 'starterprint3d_form_data';

const BACKGROUND_COLORS = [
  { id: 'light-blue', name: 'Bleu clair', value: 'bleu clair', class: 'bg-blue-100' },
  { id: 'light-green', name: 'Vert clair', value: 'vert clair', class: 'bg-green-100' },
  { id: 'light-pink', name: 'Rose clair', value: 'rose clair', class: 'bg-pink-100' },
  { id: 'light-yellow', name: 'Jaune clair', value: 'jaune clair', class: 'bg-yellow-100' },
  { id: 'light-purple', name: 'Violet clair', value: 'violet clair', class: 'bg-purple-100' },
  { id: 'light-orange', name: 'Orange clair', value: 'orange clair', class: 'bg-orange-100' },
  { id: 'light-gray', name: 'Gris clair', value: 'gris clair', class: 'bg-gray-100' },
  { id: 'white', name: 'Blanc', value: 'blanc', class: 'bg-white' },
];

export default function CustomizeFormPage() {
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
      backgroundColor: 'bleu clair',
    };
  });

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

  const handleColorChange = (color: typeof BACKGROUND_COLORS[0]) => {
    setFormData(prev => ({
      ...prev,
      backgroundColor: color.value
    }));
  };

  return (
    <>
      <Helmet>
        <title>Personnalisez Votre Starter Pack | StarterPrint3D</title>
        <meta name="description" content="Personnalisez votre Starter Pack d'impression 3D en définissant les caractéristiques de votre figurine personnalisée." />
      </Helmet>

      <StepperLayout
        instructions="Complétez le formulaire ci-dessous pour personnaliser votre figurine. Une fois terminé, vous pourrez générer votre design unique avec ChatGPT."
      >
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
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Couleur de fond
            </label>
            <div className="grid grid-cols-4 gap-3">
              {BACKGROUND_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => handleColorChange(color)}
                  className={`relative h-12 rounded-lg border-2 transition-all ${
                    formData.backgroundColor === color.value
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${color.class}`}
                  title={color.name}
                >
                  {formData.backgroundColor === color.value && (
                    <Check className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
                  )}
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
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
      </StepperLayout>
    </>
  );
}