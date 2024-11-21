import fs from 'fs';
import path from 'path';
import moment from 'moment';
import { jsPDF } from 'jspdf';
import { imageBg } from '@/utils/imageBg';

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
  const isLocal = process.env.ENVIROMENT === 'local';
  console.log('isLocal::', isLocal);
  const doc = new jsPDF();

  doc.addImage(imageBg, 'JPEG', 15, 40, 180, 160);

  // Dodaj treść PDF
  doc.setFontSize(16);
  doc.text('Hello, this is a Base64 PDF!', 10, 10);

  // Wygeneruj PDF jako Base64
  const base64 = doc.output('datauristring').split(',')[1]; // Pobierz samą zawartość Base64

  const pdfBuffer = Buffer.from(base64, 'base64');

  // const page = await browser.newPage();
  // const currentDate = moment().add(3, 'months').format("DD/MM/YYYY");
  // const today = moment().format("DD/MM/YYYY").split('/');
  // const voucherNumber = `${today[2].slice(2)}${today[1]}${today[0]}/${createRandomString(4)}`
  // const url = `${process.env.HOST_URL}voucher.jpeg`
  // console.log('url::', url);

  //Create HTML
  // await page.setContent(`
  //     <html>
  //       <body>
  //       <div style="background-image: url(${url}); background-repeat: no-repeat; width: 3460px; height: 1165px; background-size: contain; position: relative">
  //       <p style="position: absolute; top: 470px; left: 370px; color: #222222; font-size: 40px; font-family: 'sans-serif'">${variant} zł</p>
  //       <p style="position: absolute; top: 880px; left: 156px; color: #222222; font-size: 18px; font-family: 'sans-serif'">${currentDate}</p>
  //       <p style="position: absolute; top: 880px; left: 567px; color: #222222; font-size: 18px; font-family: 'sans-serif'">${voucherNumber}</p>
  //       </div>
  //       </body>
  //     </html>
  //   `);
  //

  // Define the MIME type for PDF
  const mimeType = 'application/pdf';
  //console.log('base64::', base64)

  if(isLocal) {
    // Path to save PDF ('public/pdfs')
    const filePath = path.join(process.cwd(), "public", "pdfs", "generated.pdf");

    // Make sure the directory exists (if not, create it)
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save PDF
    fs.writeFileSync(filePath, pdfBuffer);
  }

  return `data:${mimeType};base64,${base64}`;
}
