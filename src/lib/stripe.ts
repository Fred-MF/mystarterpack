import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { supabase } from './supabase';
import type { CartItem } from './cart';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export async function createCheckoutSession(items: CartItem[], shippingAddress: any) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Vous devez être connecté pour effectuer un paiement');
  }

  try {
    // First, ensure all files are uploaded and get their URLs
    const itemsWithUrls = await Promise.all(items.map(async (item) => {
      if (item.uploadedFile) {
        const { data: { publicUrl } } = supabase.storage
          .from('starter-pack-files')
          .getPublicUrl(item.uploadedFile.path);

        return {
          ...item,
          uploadedFile: {
            ...item.uploadedFile,
            url: publicUrl
          }
        };
      }
      return item;
    }));

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        line_items: items.map(item => ({
          price: item.priceId,
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/cancel`,
        shipping_address_collection: {
          allowed_countries: ['FR'],
        },
        metadata: {
          shipping_address: JSON.stringify(shippingAddress),
          uploaded_files: JSON.stringify(itemsWithUrls.map(item => item.uploadedFile))
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Erreur lors de la création de la session de paiement');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Erreur lors de la création de la session de paiement. Veuillez réessayer plus tard.');
  }
}