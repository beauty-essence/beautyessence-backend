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
  variant: number;
  duration: number;
  slug: string;
  productName: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") return res.status(202).json({});

  const { slug, duration, variant, productName } = req.body;

  try {
    let price;
    let productTitle;

    if(variant) {
      const data = req.body as PaymentRequestBody;

      const variantPrice = VARIANTS_PRICES[data.variant];

      if (!variantPrice) {
        return res.status(400).json({error: "Invalid variant."});
      }

      price = await stripe.prices.retrieve(variantPrice);
    } else if(slug && duration) {
      // get all products and find this with slug
      const products = await stripe.products.list({ active: true, limit: 100 });
      const product = products.data.find(p => p.metadata.slug === slug);
      productTitle = productName;

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // get price of product
      const prices = await stripe.prices.list({ product: product.id, active: true });

      // find the price based on duration (stored as metadata.duration)
      price = prices.data.find(
        p => p.metadata?.duration && parseInt(p.metadata.duration) === duration
      );

      if (!price) {
        return res.status(404).json({ error: "Matching price not found" });
      }

    }

    // create link for payment
    const payment = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      after_completion: {
        type: "redirect",
        redirect: {
          url: "https://beauty-essence.pl/voucher/",
        },
      },
      metadata: {
        productName: productTitle,
        duration: duration,
      },
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
