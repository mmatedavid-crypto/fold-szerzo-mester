import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export type PdfInput = {
  documentNumber: string;
  documentHash: string;
  templateVersion: string;
  clauseVersion: string;
  generatedAt: Date;
  title: string;
  sections: { title: string; text: string }[];
  verificationUrl: string;
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const LINE_H = 14;

function wrap(text: string, font: import("pdf-lib").PDFFont, size: number, maxWidth: number): string[] {
  const paragraphs = text.split(/\n+/);
  const out: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        if (cur) out.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) out.push(cur);
    out.push("");
  }
  return out;
}

export async function renderContractPdf(input: PdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const qrDataUrl = await QRCode.toDataURL(input.verificationUrl, { margin: 0, width: 120 });
  const qrPng = await pdf.embedPng(qrDataUrl);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  const contentW = PAGE_W - MARGIN * 2;

  const drawFooter = (p: import("pdf-lib").PDFPage) => {
    const footer = `drfold.hu | Dokumentum ID: ${input.documentNumber} | Generálva: ${input.generatedAt.toISOString().slice(0, 10)} | Sablonverzió: ${input.templateVersion} | Klauzulacsomag: ${input.clauseVersion}`;
    p.drawText(footer, { x: MARGIN, y: 24, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
    p.drawText(`Hash: ${input.documentHash.slice(0, 32)}...`, { x: MARGIN, y: 14, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
  };

  // Title page header
  page.drawText(input.title, { x: MARGIN, y, size: 16, font: fontBold });
  y -= 28;
  page.drawText(`Dokumentumazonosító: ${input.documentNumber}`, { x: MARGIN, y, size: 9, font });
  y -= 14;
  page.drawText(`Generálva: ${input.generatedAt.toLocaleString("hu-HU")}`, { x: MARGIN, y, size: 9, font });
  y -= 14;
  page.drawText(`Sablonverzió: ${input.templateVersion} • Klauzulák: ${input.clauseVersion}`, { x: MARGIN, y, size: 9, font });
  y -= 14;
  page.drawImage(qrPng, { x: PAGE_W - MARGIN - 80, y: PAGE_H - MARGIN - 80, width: 80, height: 80 });
  y -= 18;

  for (const sec of input.sections) {
    if (y < MARGIN + 60) {
      drawFooter(page);
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
    page.drawText(sec.title, { x: MARGIN, y, size: 12, font: fontBold });
    y -= 18;
    const lines = wrap(sec.text, font, 10, contentW);
    for (const line of lines) {
      if (y < MARGIN + 50) {
        drawFooter(page);
        page = pdf.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN;
      }
      page.drawText(line, { x: MARGIN, y, size: 10, font });
      y -= LINE_H;
    }
    y -= 8;
  }

  // Signatures
  if (y < MARGIN + 120) {
    drawFooter(page);
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }
  y -= 30;
  page.drawText("Kelt: _____________________________", { x: MARGIN, y, size: 10, font });
  y -= 50;
  page.drawText("________________________", { x: MARGIN, y, size: 10, font });
  page.drawText("________________________", { x: PAGE_W - MARGIN - 180, y, size: 10, font });
  y -= 12;
  page.drawText("Haszonbérbeadó", { x: MARGIN, y, size: 9, font });
  page.drawText("Haszonbérlő", { x: PAGE_W - MARGIN - 180, y, size: 9, font });

  drawFooter(page);

  return pdf.save();
}