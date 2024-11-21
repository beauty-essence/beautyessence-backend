import fs from 'fs';
import path from 'path';
import moment from 'moment';
import { jsPDF } from 'jspdf';
import { imageBg } from '@/utils/imageBg';
import { customFont } from '@/public/fonts/CormorantGaramond-Bold';

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

  const doc = new jsPDF('p', 'mm', [210, 297]);
  const expiredDate = moment().add(3, 'months').format("DD/MM/YYYY");
  const today = moment().format("DD/MM/YYYY").split('/');
  const voucherNumber = `${today[2].slice(2)}${today[1]}${today[0]}/${createRandomString(4)}`

  doc.addImage(imageBg, 'JPEG', 0, 0, 210, 297);

  // Dodaj treść PDF
  doc.addFileToVFS('CormorantGaramond-Bold-bold.ttf', customFont);
  doc.addFont('CormorantGaramond-Bold-bold.ttf', 'CormorantGaramond-Bold', 'bold');
  doc.setFont('CormorantGaramond-Bold')

  doc.setTextColor(34, 34, 34);
  doc.setFontSize(40);
  doc.text(`${variant} PLN`, 85, 140);
  doc.setFontSize(12);
  doc.text(expiredDate, 39, 233);
  doc.setFontSize(12);
  doc.text(voucherNumber, 144, 233);

  // Wygeneruj PDF jako Base64
  const base64 = doc.output('datauristring').split(',')[1]; // Pobierz samą zawartość Base64
  const pdfBuffer = Buffer.from(base64, 'base64');

  // Define the MIME type for PDF
  const mimeType = 'application/pdf';

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
