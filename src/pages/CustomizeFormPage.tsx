import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Check } from 'lucide-react';
import StepperLayout from '../components/StepperLayout';

const STORAGE_KEY = 'starterprint3d_form_data';

const BACKGROUND_COLORS = [
  // Light colors
  { id: 'light-blue', name: 'Bleu clair', value: 'bleu clair', hex: '#dbeafe', class: 'bg-blue-100' },
  { id: 'light-green', name: 'Vert clair', value: 'vert clair', hex: '#dcfce7', class: 'bg-green-100' },
  { id: 'light-pink', name: 'Rose clair', value: 'rose clair', hex: '#fce7f3', class: 'bg-pink-100' },
  { id: 'light-yellow', name: 'Jaune clair', value: 'jaune clair', hex: '#fef9c3', class: 'bg-yellow-100' },
  { id: 'light-purple', name: 'Violet clair', value: 'violet clair', hex: '#f3e8ff', class: 'bg-purple-100' },
  { id: 'light-orange', name: 'Orange clair', value: 'orange clair', hex: '#ffedd5', class: 'bg-orange-100' },
  { id: 'light-gray', name: 'Gris clair', value: 'gris clair', hex: '#f3f4f6', class: 'bg-gray-100' },
  { id: 'white', name: 'Blanc', value: 'blanc', hex: '#ffffff', class: 'bg-white' },
  // Medium colors
  { id: 'medium-blue', name: 'Bleu moyen', value: 'bleu moyen', hex: '#60a5fa', class: 'bg-blue-400' },
  { id: 'medium-green', name: 'Vert moyen', value: 'vert moyen', hex: '#4ade80', class: 'bg-green-400' },
  { id: 'medium-pink', name: 'Rose moyen', value: 'rose moyen', hex: '#f472b6', class: 'bg-pink-400' },
  { id: 'medium-yellow', name: 'Jaune moyen', value: 'jaune moyen', hex: '#fde047', class: 'bg-yellow-400' },
  { id: 'medium-purple', name: 'Violet moyen', value: 'violet moyen', hex: '#c084fc', class: 'bg-purple-400' },
  { id: 'medium-orange', name: 'Orange moyen', value: 'orange moyen', hex: '#fb923c', class: 'bg-orange-400' },
  { id: 'medium-gray', name: 'Gris moyen', value: 'gris moyen', hex: '#9ca3af', class: 'bg-gray-400' },
  { id: 'gray', name: 'Gris', value: 'gris', hex: '#d1d5db', class: 'bg-gray-300' },
  // Dark colors
  { id: 'dark-blue', name: 'Bleu foncé', value: 'bleu foncé', hex: '#1e40af', class: 'bg-blue-800' },
  { id: 'dark-green', name: 'Vert foncé', value: 'vert foncé', hex: '#166534', class: 'bg-green-800' },
  { id: 'dark-pink', name: 'Rose foncé', value: 'rose foncé', hex: '#9d174d', class: 'bg-pink-800' },
  { id: 'dark-yellow', name: 'Jaune foncé', value: 'jaune foncé', hex: '#854d0e', class: 'bg-yellow-800' },
  { id: 'dark-purple', name: 'Violet foncé', value: 'violet foncé', hex: '#6b21a8', class: 'bg-purple-800' },
  { id: 'dark-orange', name: 'Orange foncé', value: 'orange foncé', hex: '#9a3412', class: 'bg-orange-800' },
  { id: 'dark-gray', name: 'Gris foncé', value: 'gris foncé', hex: '#1f2937', class: 'bg-gray-800' },
  { id: 'black', name: 'Noir', value: 'noir', hex: '#111827', class: 'bg-gray-900' },
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
      backgroundColorHex: '#dbeafe',
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
      backgroundColor: color.value,
      backgroundColorHex: color.hex
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
            <div className="grid grid-cols-8 gap-3">
              {BACKGROUND_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => handleColorChange(color)}
                  className={`relative h-12 rounded-lg border-2 transition-all ${
                    formData.backgroundColor === color.value
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${color.class}`}
                  title={`${color.name} (${color.hex})`}
                >
                  {formData.backgroundColor === color.value && (
                    <Check className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 ${
                      color.id.startsWith('dark-') || color.id === 'black' ? 'text-white' : 'text-blue-600'
                    }`} />
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