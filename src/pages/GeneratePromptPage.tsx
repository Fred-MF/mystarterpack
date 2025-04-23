import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Copy, ExternalLink } from 'lucide-react';
import StepperLayout from '../components/StepperLayout';

const STORAGE_KEY = 'starterprint3d_form_data';

export default function GeneratePromptPage() {
  const [promptCopied, setPromptCopied] = useState(false);
  const formData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  const generatePrompt = useCallback(() => {
    return `Crée un rendu 3D de haute qualité d'une figurine en style cartoon, présentée sous blister, à la manière d'un jouet de collection. Le fond en carton est ${formData.backgroundColor} et porte une étiquette de jouet rétro. En haut au centre, en grandes lettres majuscules et en gras et noir, écris "${formData.title}". Juste en dessous, tu peux écrire "${formData.subtitle}" en plus petit en bas à droite. En haut à droite, un badge bleu circulaire indique "ACTION FIGURE". En haut à gauche, une petite bulle blanche indique "4+". En bas à droite, une mention discrète indique "Made with ❤️ by www.mystarterpack.com".'

Le personnage se tient debout, moulé dans une boîte en plastique transparente fixée sur un support en carton plat. Il doit ressembler aux photos portrait fournies. L'expression de son visage est ${formData.expression}. Sa posture est ${formData.posture}. Le ton général est léger et réaliste. 

La figurine est habillée de ${formData.habillement}. Sur le côté de la figurine, intégrés dans des moules en plastique distincts, sont présents 3 accessoires :
- ${formData.accessoire1} ;
- ${formData.accessoire2} ;
- ${formData.accessoire3}.

Chaque accessoire est vu de face, positionné à droite de la figurine et s'insère parfaitement dans son propre compartiment moulé. L'emballage est photographié avec des ombres douces, entièrement visible, un éclairage uniforme et un fond blanc épuré pour donner l'impression d'une séance photo commerciale.

Le style doit allier réalisme et stylisation du dessin animé 3D, à l'image de Pixar ou des maquettes de jouets modernes. Assure-toi que la disposition et les proportions du produit ressemblent à celles d'un véritable jouet vendu en magasin. Attache une attention toute particulière à ce que le visage de la figurine ressemble fidèlement à la photo portrait fournie. Reproduis fidèlement la forme du visage, la coupe de cheveux, les yeux et les expressions faciales tout en gardant une touche stylisée, légèrement caricatural.`;
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

  return (
    <>
      <Helmet>
        <title>Générer votre design | StarterPrint3D</title>
        <meta name="description" content="Générez le design de votre Starter Pack avec ChatGPT" />
      </Helmet>

      <StepperLayout
        instructions="Copiez le prompt ci-dessous et collez-le dans ChatGPT pour générer votre design unique. N'oubliez pas de joindre votre photo portrait à ChatGPT."
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
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
        </div>
      </StepperLayout>
    </>
  );
}