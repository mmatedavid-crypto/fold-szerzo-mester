import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { company, companyLegalDisclaimerAscii, companyLegalLineAscii } from "@/lib/company";

export type PdfInput = {
  documentNumber: string;
  documentHash: string;
  templateVersion: string;
  clauseVersion: string;
  generatedAt: Date;
  title: string;
  sections: { title: string; text: string }[];
  verificationUrl: string;
  /** Ha van, minden lapra diagonális szürke vízjel kerül. */
  watermark?: string;
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const LINE_H = 14;
const DF_GREEN = rgb(0.129, 0.329, 0.227);
const DF_CREAM = rgb(0.957, 0.906, 0.812);
const DF_CARD = rgb(1, 0.976, 0.925);
const DF_RED = rgb(0.706, 0.227, 0.184);
const DF_INK = rgb(0.114, 0.129, 0.106);
const DF_GRAY = rgb(0.42, 0.435, 0.388);

function wrap(
  text: string,
  font: import("pdf-lib").PDFFont,
  size: number,
  maxWidth: number,
): string[] {
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

  const drawWatermark = (p: import("pdf-lib").PDFPage) => {
    if (!input.watermark) return;
    p.drawText(input.watermark, {
      x: 60,
      y: PAGE_H / 2,
      size: 38,
      font: fontBold,
      color: rgb(0.85, 0.35, 0.35),
      rotate: { type: "degrees", angle: 35 } as unknown as { type: "degrees"; angle: number },
      opacity: 0.25,
    });
  };

  const drawFooter = (p: import("pdf-lib").PDFPage) => {
    p.drawLine({
      start: { x: MARGIN, y: 42 },
      end: { x: PAGE_W - MARGIN, y: 42 },
      thickness: 0.6,
      color: DF_CREAM,
    });
    const footer = `${company.domain} | Dokumentum ID: ${input.documentNumber} | Generálva: ${input.generatedAt.toISOString().slice(0, 10)} | Sablonverzió: ${input.templateVersion} | Klauzulacsomag: ${input.clauseVersion}`;
    p.drawText(companyLegalDisclaimerAscii, {
      x: MARGIN,
      y: 32,
      size: 6.4,
      font,
      color: DF_GRAY,
    });
    p.drawText(companyLegalLineAscii, {
      x: MARGIN,
      y: 23,
      size: 6.4,
      font,
      color: DF_GRAY,
    });
    p.drawText(footer, { x: MARGIN, y: 14, size: 6.5, font, color: DF_GRAY });
    p.drawText(`Hash: ${input.documentHash.slice(0, 32)}...`, {
      x: MARGIN,
      y: 6,
      size: 6.5,
      font,
      color: DF_GRAY,
    });
  };

  // Title page header
  page.drawRectangle({ x: 0, y: PAGE_H - 120, width: PAGE_W, height: 120, color: DF_CARD });
  page.drawRectangle({
    x: MARGIN,
    y: PAGE_H - 92,
    width: 126,
    height: 48,
    borderColor: DF_GREEN,
    borderWidth: 1.4,
    color: DF_CREAM,
  });
  page.drawText("DR FOLD", {
    x: MARGIN + 14,
    y: PAGE_H - 62,
    size: 18,
    font: fontBold,
    color: DF_GREEN,
  });
  page.drawRectangle({
    x: MARGIN + 14,
    y: PAGE_H - 82,
    width: 86,
    height: 13,
    color: rgb(0.878, 0.663, 0.184),
  });
  page.drawText("Ravasz a gazda.", {
    x: MARGIN + 19,
    y: PAGE_H - 79,
    size: 7,
    font: fontBold,
    color: DF_INK,
  });
  page.drawRectangle({
    x: PAGE_W - MARGIN - 112,
    y: PAGE_H - 91,
    width: 104,
    height: 28,
    borderColor: DF_RED,
    borderWidth: 1.2,
  });
  page.drawText("DOKUMENTUM", {
    x: PAGE_W - MARGIN - 101,
    y: PAGE_H - 75,
    size: 8,
    font: fontBold,
    color: DF_RED,
  });
  page.drawText(input.documentNumber.slice(0, 18), {
    x: PAGE_W - MARGIN - 101,
    y: PAGE_H - 86,
    size: 6.5,
    font,
    color: DF_RED,
  });
  y = PAGE_H - 148;
  page.drawText(input.title, { x: MARGIN, y, size: 16, font: fontBold, color: DF_INK });
  y -= 28;
  page.drawText(`Dokumentumazonosito: ${input.documentNumber}`, {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: DF_INK,
  });
  y -= 14;
  page.drawText(`Generalva: ${input.generatedAt.toLocaleString("hu-HU")}`, {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: DF_INK,
  });
  y -= 14;
  page.drawText(`Sablonverzio: ${input.templateVersion} | Klauzulak: ${input.clauseVersion}`, {
    x: MARGIN,
    y,
    size: 9,
    font,
    color: DF_INK,
  });
  y -= 14;
  page.drawImage(qrPng, {
    x: PAGE_W - MARGIN - 80,
    y: PAGE_H - MARGIN - 80,
    width: 80,
    height: 80,
  });
  y -= 18;

  for (const sec of input.sections) {
    if (y < MARGIN + 60) {
      drawFooter(page);
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
    page.drawText(sec.title, { x: MARGIN, y, size: 12, font: fontBold, color: DF_GREEN });
    y -= 18;
    const lines = wrap(sec.text, font, 10, contentW);
    for (const line of lines) {
      if (y < MARGIN + 50) {
        drawFooter(page);
        page = pdf.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN;
      }
      page.drawText(line, { x: MARGIN, y, size: 10, font, color: DF_INK });
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
  page.drawText("Kelt: _____________________________", {
    x: MARGIN,
    y,
    size: 10,
    font,
    color: DF_INK,
  });
  y -= 50;
  page.drawText("________________________", { x: MARGIN, y, size: 10, font, color: DF_INK });
  page.drawText("________________________", {
    x: PAGE_W - MARGIN - 180,
    y,
    size: 10,
    font,
    color: DF_INK,
  });
  y -= 12;
  page.drawText("Haszonberbeado", { x: MARGIN, y, size: 9, font, color: DF_GRAY });
  page.drawText("Haszonberlo", { x: PAGE_W - MARGIN - 180, y, size: 9, font, color: DF_GRAY });

  drawFooter(page);

  return pdf.save();
}
