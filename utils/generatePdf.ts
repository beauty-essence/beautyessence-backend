import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import moment from 'moment';

function uint8ArrayToBase64(uint8Array: Uint8Array) {
  // Convert Uint8Array to a string
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }

  // Encode the string to base64
  return btoa(binaryString);
}

function createRandomString(length: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  randomArray.forEach((number) => {
    result += chars[number % chars.length];
  });
  return result;
}


export const generatePdf = async (variant: number) => {
  console.log('generatePdf::', await chromium.executablePath());
  const isLocal = process.env.ENVIROMENT === 'local';
  console.log('isLocal::', isLocal);
  console.log('process.env.ENVIROMENT::', process.env.ENVIROMENT);

  const browser = isLocal
    // if we are running locally, use the puppeteer that is installed in the node_modules folder
    ? await require('puppeteer').launch()
    // if we are running in AWS, download and use a compatible version of chromium at runtime
    : await puppeteer.launch({
      ignoreDefaultArgs: ['--disable-extensions'],
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar',
      ),
      headless: chromium.headless,
    });
  console.log('browser is up', browser);

  const page = await browser.newPage();
  const currentDate = moment().add(3, 'months').format("DD/MM/YYYY");
  const today = moment().format("DD/MM/YYYY").split('/');
  const voucherNumber = `${today[2].slice(2)}${today[1]}${today[0]}/${createRandomString(4)}`
  const url = `${process.env.HOST_URL}/voucher.jpeg`

  //Create HTML
  await page.setContent(`
      <html>
        <body>
        <div style="background: url(${url}); background-repeat: no-repeat; width: 3460px; height: 1165px; background-size: contain; position: relative">
        <p style="position: absolute; top: 470px; left: 370px; color: #222222; font-size: 40px; font-family: 'sans-serif'">${variant} zł</p>
        <p style="position: absolute; top: 880px; left: 156px; color: #222222; font-size: 18px; font-family: 'sans-serif'">${currentDate}</p>
        <p style="position: absolute; top: 880px; left: 567px; color: #222222; font-size: 18px; font-family: 'sans-serif'">${voucherNumber}</p>
        </div>
        </body>
      </html>
    `);

  //Generate PDF and save to buffer
  const pdfBuffer = await page.pdf({ format: "a5", printBackground: true });

  await browser.close();

  // Path to save PDF ('public/pdfs')
  const filePath = path.join(process.cwd(), "public", "pdfs", "generated.pdf");

  // Make sure the directory exists (if not, create it)
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Define the MIME type for PDF
  const mimeType = 'application/pdf';
  const pdfBase64 = uint8ArrayToBase64(pdfBuffer);

  // Save PDF
  //fs.writeFileSync(filePath, pdfBuffer);

  return `data:${mimeType};base64,${pdfBase64}`;
}
