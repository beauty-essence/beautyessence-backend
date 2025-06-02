import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_KEY as string, {
  apiVersion: "2023-08-16",
});

interface VARIANTS_PRICES {
  [key: number]: string;
}
// 100: "price_1NuI0qHhE1I6QTRHEsqusuTB", // This is a test price
const VARIANTS_PRICES: VARIANTS_PRICES = {
  100: "price_1NwNEdHhE1I6QTRHeE6E1Yho",
  150: "price_1NwNFEHhE1I6QTRHrxXmERvU",
  200: "price_1NwNFVHhE1I6QTRHIXwSIQkJ",
  300: "price_1NwNFkHhE1I6QTRHsQXXFsRh",
  500: "price_1NwNG0HhE1I6QTRHZyhzmADn",
  1000: "price_1NwNGJHhE1I6QTRHWBze6pzC",
};

interface PaymentRequestBody {
  variant?: number;
  duration?: number;
  slug?: string;
  productName?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") return res.status(202).json({});

  const { slug, duration, variant, productName } = req.body as PaymentRequestBody;

  try {
    let price;
    let productTitle = productName ?? "";

    if (variant) {
      // Voucher amounts
      const variantPrice = VARIANTS_PRICES[variant];
      if (!variantPrice) {
        return res.status(400).json({ error: "Invalid variant." });
      }

      price = await stripe.prices.retrieve(variantPrice);
      productTitle = `${variant} zł`;
    } else if (slug) {
      // Vouchers amounts with slug from Shop page
      const products = await stripe.products.list({ active: true, limit: 100 });
      const product = products.data.find(p => p.metadata.slug === slug);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const prices = await stripe.prices.list({ product: product.id, active: true });

      if (duration && duration > 0) {
        price = prices.data.find(
          p => p.metadata?.duration && parseInt(p.metadata.duration) === duration
        );
      } else {
        price = prices.data[0]; // Pierwsza aktywna cena (np. bez duration)
      }

      if (!price) {
        return res.status(404).json({ error: "Price not found" });
      }

      productTitle = product.name;
    }

    if (!price) {
      return res.status(400).json({ error: "Price is null or undefined" });
    }

    const metadata: Record<string, string | number> = {
      productName: productTitle,
    };

    // Vouchers for treatments using slugs and duration time
    if (duration && duration > 0) {
      metadata.duration = duration;
    }

    const payment = await stripe.paymentLinks.create({
      line_items: [{ price: price.id as string, quantity: 1 }],
      after_completion: {
        type: "redirect",
        redirect: {
          url: "https://beauty-essence.pl/voucher/",
        },
      },
      metadata,
      custom_fields: [
        {
          key: "voucherName",
          label: { custom: "Kto otrzyma voucher?", type: "custom" },
          type: "text",
        },
        {
          key: "voucherEmail",
          label: { custom: "Na jaki adres email wysłać voucher?", type: "custom" },
          type: "text",
        },
      ],
    });

    return res.status(200).json(payment);

  } catch (error) {
    console.error("Stripe error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
