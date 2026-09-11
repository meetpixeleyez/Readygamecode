import { db } from "@/lib/db";

export interface PaymentCredentials {
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  paypalClientSecret: string;
  paypalMode: string;
}

export async function getPaymentCredentials(): Promise<PaymentCredentials> {
  try {
    const setting = await db.paymentSetting.findUnique({
      where: { id: "default" },
    });

    return {
      razorpayEnabled: setting ? setting.razorpayEnabled : true,
      razorpayKeyId: setting?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || "",
      razorpayKeySecret: setting?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || "",
      paypalEnabled: setting ? setting.paypalEnabled : true,
      paypalClientId: setting?.paypalClientId || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
      paypalClientSecret: setting?.paypalClientSecret || process.env.PAYPAL_CLIENT_SECRET || "",
      paypalMode: setting?.paypalMode || "sandbox",
    };
  } catch (error) {
    console.error("Error fetching payment settings from DB, falling back to ENV:", error);
    return {
      razorpayEnabled: true,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
      paypalEnabled: true,
      paypalClientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
      paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
      paypalMode: "sandbox",
    };
  }
}
