import type { NextApiRequest, NextApiResponse } from "next";
import { SMTPClient } from "emailjs";
import emailjs from "@emailjs/nodejs"
import { generatePdf } from '@/utils/generatePdf';

const client = new SMTPClient({
  user: "vouchery@beauty-essence.pl",
  password: process.env.EMAIL_PASSWORD,
  host: "h27.seohost.pl",
  ssl: true,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const data = req.body;

  const variant = data?.data?.object?.amount_total / 100 || 100;
  const voucherName =data?.data?.object?.custom_fields?.find(
      (field: any) => field.key === "voucherName"
    ).text.value ?? "Joanna Rogalska";
  const voucherEmail =
    data?.data?.object?.custom_fields?.find(
      (field: any) => field.key === "voucherEmail"
    ).text.value ?? "rogalska.joasia@gmail.com";
  const customerEmail = data?.data?.object?.customer_details?.email ?? "joannarogalska@vp.pl";

  try {
    const pdfFile = await generatePdf(variant);
    console.log('pdfFile::', pdfFile);
    const message = await emailjs.send("service_buv3hy1", "template_iz141u5", {
      voucherName: voucherName,
      variant: variant,
      customerEmail: customerEmail,
      voucherEmail: voucherEmail,
      voucherFile: pdfFile,
    }, {
      publicKey: "QWf0KsTI8rrabdJiX",
      privateKey: "dMtvnzX8Sh0GFMJvk_yeI"
    }).then(function(response) {
      console.log('SUCCESS!', response.status);
  })
    console.log(message);
  } catch (err) {
    console.error(err);
  }

  return res.status(200).json({ tak: "Successful!!!" });
}
