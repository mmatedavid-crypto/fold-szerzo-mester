export type CheckoutInput = {
  userId: string;
  productType: "single" | "subscription_gazda" | "subscription_pro";
  planId: string;
  amountHuf: number;
  draftId?: string;
  returnUrl: string;
};

export type CheckoutSession = {
  paymentId: string;
  redirectUrl: string;
  provider: string;
};

export type PaymentProvider = {
  name: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
};