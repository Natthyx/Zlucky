export interface ChapaInitializeOptions {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name?: string;
  phone_number: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
    logo?: string;
  };
}

export class ChapaClient {
  private secretKey: string;
  private baseUrl = "https://api.chapa.co/v1";

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  async initialize(options: ChapaInitializeOptions) {
    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    return response.json();
  }

  async verify(tx_ref: string) {
    const response = await fetch(`${this.baseUrl}/transaction/verify/${tx_ref}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    return response.json();
  }
}

export const chapa = new ChapaClient(process.env.CHAPA_SECRET_KEY!);
