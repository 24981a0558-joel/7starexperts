// ─────────────────────────────────────────────────────────────────────────────
// RAZORPAY TYPE DECLARATIONS
// ─────────────────────────────────────────────────────────────────────────────
// 📘 Since @types/razorpay doesn't exist on npm, we declare the types manually.
// A .d.ts file = "declaration file" — it tells TypeScript the shape of a module
// WITHOUT containing any actual runtime code.
// TypeScript reads this to provide type-checking and autocomplete.
// ─────────────────────────────────────────────────────────────────────────────

declare module 'razorpay' {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  interface RazorpayOrderCreateParams {
    amount: number;        // amount in PAISE (₹1 = 100 paise)
    currency: string;      // 'INR'
    receipt: string;       // your internal order reference
    notes?: Record<string, string>;
    payment_capture?: 0 | 1;
  }

  interface RazorpayOrder {
    id: string;            // e.g. "order_OxxxxxxxxxxxxX"
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: 'created' | 'attempted' | 'paid';
    attempts: number;
    notes: Record<string, string>;
    created_at: number;
  }

  interface RazorpayRefundParams {
    amount?: number;       // partial refund amount in paise (omit for full refund)
    notes?: Record<string, string>;
  }

  class Razorpay {
    constructor(options: RazorpayOptions);
    orders: {
      create(params: RazorpayOrderCreateParams): Promise<RazorpayOrder>;
      fetch(orderId: string): Promise<RazorpayOrder>;
    };
    payments: {
      fetch(paymentId: string): Promise<any>;
      refund(paymentId: string, params?: RazorpayRefundParams): Promise<any>;
    };
  }

  export = Razorpay;
}
