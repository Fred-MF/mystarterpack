export const STRIPE_PRODUCTS = {
  STARTER_PACK_3X: {
    priceId: 'price_1RE9GBR6UU7oxZFBIA1KsRPt',
    name: 'Starter Pack x 3 ex.',
    description: 'Pack de démarrage pour l\'impression 3D - 3 exemplaires',
    price: 69.50,
    mode: 'payment' as const,
  },
  STARTER_PACK_2X: {
    priceId: 'price_1RE9E3R6UU7oxZFBy3Ured1g',
    name: 'Starter Pack x 2 ex.',
    description: 'Pack de démarrage pour l\'impression 3D - 2 exemplaires',
    price: 49.50,
    mode: 'payment' as const,
  },
  STARTER_PACK_1X: {
    priceId: 'price_1RDtLhR6UU7oxZFBNZ2Y8SF4',
    name: 'Starter Pack x 1 ex.',
    description: 'Pack de démarrage pour l\'impression 3D - 1 exemplaire',
    price: 29.50,
    mode: 'payment' as const,
  },
} as const;

export type StripeProduct = typeof STRIPE_PRODUCTS[keyof typeof STRIPE_PRODUCTS];