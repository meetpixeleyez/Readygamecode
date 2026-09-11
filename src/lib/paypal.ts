import { getPaymentCredentials } from "@/lib/payment-settings";

export async function getPayPalAccessToken(): Promise<{ accessToken: string; baseUrl: string }> {
  const creds = await getPaymentCredentials();
  
  const clientId = creds.paypalClientId;
  const clientSecret = creds.paypalClientSecret;
  const mode = creds.paypalMode || "sandbox";

  const baseUrl = mode === "live" 
    ? "https://api-m.paypal.com" 
    : "https://api-m.sandbox.paypal.com";

  if (!clientId || !clientSecret) {
    throw new Error("PayPal Client ID or Client Secret is missing in payment settings.");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("PayPal Token Error:", errorText);
    throw new Error("Failed to authenticate with PayPal API");
  }

  const data = await res.json();
  return { accessToken: data.access_token, baseUrl };
}

export async function createPayPalOrder(amount: number, currency: string = "USD", customId: string) {
  const { accessToken, baseUrl } = await getPayPalAccessToken();

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: customId,
          custom_id: customId,
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2),
          },
          description: `ReadyGameCode Order #${customId}`,
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("PayPal Create Order Error:", data);
    throw new Error(data.message || "Failed to create PayPal order");
  }

  return data;
}

export async function capturePayPalOrder(paypalOrderId: string) {
  const { accessToken, baseUrl } = await getPayPalAccessToken();

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("PayPal Capture Order Error:", data);
    throw new Error(data.message || "Failed to capture PayPal order");
  }

  return data;
}
