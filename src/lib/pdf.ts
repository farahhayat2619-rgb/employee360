// PDF builders (pdf-lib, pure JavaScript, so they run on any host). Used by the payslip download
// route and by the seed script for sample policy documents.
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

const NAVY = rgb(0.043, 0.122, 0.239);
const BLUE = rgb(0.153, 0.388, 0.871);
const INK = rgb(0.13, 0.16, 0.22);
const SOFT = rgb(0.38, 0.42, 0.5);
const LINE = rgb(0.87, 0.89, 0.92);
const PALE = rgb(0.95, 0.96, 0.98);

const A4: [number, number] = [595.28, 841.89];
const M = 48; // page margin

export const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString("en-US")}`;

function right(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color = INK) {
  page.drawText(text, { x: x - font.widthOfTextAtSize(text, size), y, size, font, color });
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

export type PayslipPdfData = {
  company: string;
  month: string; // "November 2026"
  employee: { id: string; name: string; designation: string; department: string; office: string; joiningDate: string };
  earnings: [string, number][];
  deductions: [string, number][];
  net: number;
  generatedAt: string;
};

export async function payslipPdf(d: PayslipPdfData) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Salary slip ${d.month} - ${d.employee.name}`);
  doc.setAuthor(d.company);
  doc.setCreator("Employee360");
  const page = doc.addPage(A4);
  const [W, H] = A4;
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Header band
  page.drawRectangle({ x: 0, y: H - 110, width: W, height: 110, color: NAVY });
  page.drawText(d.company, { x: M, y: H - 58, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Salary slip", { x: M, y: H - 82, size: 11, font: reg, color: rgb(0.8, 0.85, 0.95) });
  right(page, d.month, W - M, H - 58, bold, 16, rgb(1, 1, 1));
  right(page, "Confidential", W - M, H - 82, reg, 10, rgb(0.8, 0.85, 0.95));

  // Employee block
  let y = H - 150;
  const info: [string, string][] = [
    ["Employee", d.employee.name],
    ["Employee ID", d.employee.id],
    ["Designation", d.employee.designation],
    ["Department", d.employee.department],
    ["Office", d.employee.office],
    ["Joining date", d.employee.joiningDate],
  ];
  info.forEach(([k, v], i) => {
    const col = i % 2;
    const x = M + col * ((W - 2 * M) / 2);
    const yy = y - Math.floor(i / 2) * 34;
    page.drawText(k.toUpperCase(), { x, y: yy, size: 7.5, font: bold, color: SOFT });
    page.drawText(v, { x, y: yy - 13, size: 11, font: reg, color: INK });
  });
  y -= 3 * 34 + 14;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: LINE });

  // Earnings and deductions side by side
  const colW = (W - 2 * M - 24) / 2;
  const table = (x: number, title: string, rows: [string, number][], totalLabel: string, minus: boolean) => {
    let ty = y - 30;
    page.drawText(title.toUpperCase(), { x, y: ty, size: 8, font: bold, color: SOFT });
    ty -= 20;
    for (const [k, v] of rows) {
      page.drawText(k, { x, y: ty, size: 10.5, font: reg, color: INK });
      right(page, `${minus && v > 0 ? "- " : ""}${pkr(v)}`, x + colW, ty, reg, 10.5);
      ty -= 20;
    }
    page.drawLine({ start: { x, y: ty + 12 }, end: { x: x + colW, y: ty + 12 }, thickness: 0.8, color: LINE });
    const total = rows.reduce((s, [, v]) => s + v, 0);
    page.drawText(totalLabel, { x, y: ty - 4, size: 10.5, font: bold, color: NAVY });
    right(page, pkr(total), x + colW, ty - 4, bold, 10.5, NAVY);
    return ty - 4;
  };
  const endA = table(M, "Earnings", d.earnings, "Gross pay", false);
  const endB = table(M + colW + 24, "Deductions", d.deductions, "Total deductions", true);
  y = Math.min(endA, endB) - 34;

  // Net pay box
  page.drawRectangle({ x: M, y: y - 44, width: W - 2 * M, height: 54, color: PALE, borderColor: BLUE, borderWidth: 1 });
  page.drawText("Net salary", { x: M + 18, y: y - 22, size: 12, font: bold, color: NAVY });
  right(page, pkr(d.net), W - M - 18, y - 24, bold, 18, NAVY);

  // Footer
  const foot = wrap(
    "This is a computer-generated salary slip from Employee360 and does not need a signature. Figures use the demo company's simplified rule (flat income tax and provident fund percentages) and are not tax advice.",
    reg,
    8.5,
    W - 2 * M,
  );
  foot.forEach((l, i) => page.drawText(l, { x: M, y: 70 - i * 12, size: 8.5, font: reg, color: SOFT }));
  page.drawText(`Generated ${d.generatedAt}`, { x: M, y: 40, size: 8, font: reg, color: SOFT });
  return doc.save();
}

/** Simple text document, used for the sample policy files. */
export async function textDocumentPdf(title: string, subtitle: string, sections: { heading: string; body: string }[]) {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setCreator("Employee360");
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const [W, H] = A4;
  let page = doc.addPage(A4);
  page.drawRectangle({ x: 0, y: H - 90, width: W, height: 90, color: NAVY });
  page.drawText(title, { x: M, y: H - 50, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText(subtitle, { x: M, y: H - 72, size: 10, font: reg, color: rgb(0.8, 0.85, 0.95) });
  let y = H - 130;
  for (const s of sections) {
    if (y < 120) {
      page = doc.addPage(A4);
      y = H - M;
    }
    page.drawText(s.heading, { x: M, y, size: 12.5, font: bold, color: NAVY });
    y -= 20;
    for (const line of wrap(s.body, reg, 10.5, W - 2 * M)) {
      if (y < 60) {
        page = doc.addPage(A4);
        y = H - M;
      }
      page.drawText(line, { x: M, y, size: 10.5, font: reg, color: INK });
      y -= 15;
    }
    y -= 12;
  }
  return { bytes: await doc.save(), pages: doc.getPageCount() };
}
