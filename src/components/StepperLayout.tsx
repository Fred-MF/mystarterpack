import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const steps = [
  { id: 1, name: 'Personnaliser', path: '/personnaliser' },
  { id: 2, name: 'Générer', path: '/generer' },
  { id: 3, name: 'Déposer', path: '/deposer' },
  { id: 4, name: 'Commander', path: '/commander' }
];

interface StepperLayoutProps {
  children: React.ReactNode;
  instructions: string;
}

export default function StepperLayout({ children, instructions }: StepperLayoutProps) {
  const location = useLocation();
  const currentStep = steps.findIndex(step => step.path === location.pathname) + 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {steps[currentStep - 1].name}
      </h1>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -z-10"></div>
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step.id <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              } font-semibold`}
            >
              {step.id}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          {steps.map((step) => (
            <span
              key={step.id}
              className={step.id <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'}
            >
              {step.name}
            </span>
          ))}
        </div>
      </div>

      {/* Instructions Block */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
        <p className="text-blue-700">{instructions}</p>
      </div>

      {/* Content */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        {children}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        {currentStep > 1 && (
          <Link
            to={steps[currentStep - 2].path}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Retour
          </Link>
        )}
        {currentStep < steps.length && (
          <Link
            to={steps[currentStep].path}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ml-auto"
          >
            Continuer
          </Link>
        )}
      </div>
    </div>
  );
}