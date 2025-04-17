import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface ShippingAddress {
  line1: string;
  line2?: string;
  postal_code: string;
  city: string;
  country: string;
}

interface UserProfile {
  id: string;
  shipping_address?: ShippingAddress;
}

const initialShippingAddress: ShippingAddress = {
  line1: '',
  line2: '',
  postal_code: '',
  city: '',
  country: '',
};

const AccountPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ShippingAddress>(initialShippingAddress);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile(data);
          if (data.shipping_address) {
            setFormData(data.shipping_address);
          }
        } else {
          // Initialize empty profile if none exists
          setProfile({ id: user.id });
          setFormData(initialShippingAddress);
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError('Erreur lors du chargement du profil. Veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user!.id,
          shipping_address: formData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setProfile(prev => ({
        ...prev!,
        shipping_address: formData,
      }));
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Erreur lors de la mise à jour du profil. Veuillez réessayer.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mon compte - StarterPrint3D</title>
        <meta name="description" content="Gérez votre compte et vos informations de livraison" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon compte</h1>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Informations personnelles</h2>
            <p className="text-gray-600">Email : {user?.email}</p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Adresse de livraison</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Modifier
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md">
                {error}
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="line1" className="block text-sm font-medium text-gray-700">
                    Adresse
                  </label>
                  <input
                    type="text"
                    id="line1"
                    name="line1"
                    value={formData.line1}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="line2" className="block text-sm font-medium text-gray-700">
                    Complément d'adresse
                  </label>
                  <input
                    type="text"
                    id="line2"
                    name="line2"
                    value={formData.line2}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                      Code postal
                    </label>
                    <input
                      type="text"
                      id="postal_code"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      Ville
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Pays
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 text-gray-600">
                {profile?.shipping_address ? (
                  <>
                    <p>{profile.shipping_address.line1}</p>
                    {profile.shipping_address.line2 && <p>{profile.shipping_address.line2}</p>}
                    <p>
                      {profile.shipping_address.postal_code} {profile.shipping_address.city}
                    </p>
                    <p>{profile.shipping_address.country}</p>
                  </>
                ) : (
                  <p className="text-gray-500 italic">Aucune adresse de livraison enregistrée</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountPage;