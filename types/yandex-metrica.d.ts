declare global {
  interface Window {
    ym: (
      counterId: number,
      method: 'init' | 'reachGoal' | 'userParams' | 'params' | 'hit' | 'extLink' | 'file' | 'notBounce' | 'getClientID',
      ...args: any[]
    ) => void;
  }

  interface YandexMetricaEcommerce {
    purchase?: {
      actionField: {
        id: string;
        goal_id?: string;
        coupon?: string;
        revenue?: number;
        tax?: number;
        shipping?: number;
      };
      products: Array<{
        id: string;
        name: string;
        price: number;
        brand?: string;
        category?: string;
        variant?: string;
        quantity?: number;
        coupon?: string;
        position?: number;
      }>;
    };
    add?: {
      products: Array<{
        id: string;
        name: string;
        price: number;
        brand?: string;
        category?: string;
        variant?: string;
        quantity?: number;
        position?: number;
      }>;
    };
    remove?: {
      products: Array<{
        id: string;
        name: string;
        price?: number;
        category?: string;
        quantity?: number;
      }>;
    };
    detail?: {
      products: Array<{
        id: string;
        name: string;
        price: number;
        brand?: string;
        category?: string;
        variant?: string;
      }>;
    };
  }
}

export {};