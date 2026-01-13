import { toCanvas } from "html-to-image";
import { PDFDocument } from "pdf-lib";

const MM_TO_PT = 2.834645669;
const A4 = {
  width: 210 * MM_TO_PT,
  height: 297 * MM_TO_PT,
};

type DownloadElementAsPdfOptions = {
  element: HTMLElement;
  fileName: string;
  marginMm?: number;
  backgroundColor?: string;
  pixelRatio?: number;
};

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function downloadElementAsPdf({
  element,
  fileName,
  marginMm = 8,
  backgroundColor = "#ffffff",
  pixelRatio = 2,
}: DownloadElementAsPdfOptions): Promise<void> {
  const canvas = await toCanvas(element, {
    cacheBust: true,
    backgroundColor,
    pixelRatio,
  });

  const pdf = await PDFDocument.create();

  const margin = marginMm * MM_TO_PT;
  const pageWidth = A4.width;
  const pageHeight = A4.height;
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;

  const scale = availableWidth / canvas.width;
  const sliceHeightPx = Math.max(1, Math.floor(availableHeight / scale));

  for (let y = 0; y < canvas.height; y += sliceHeightPx) {
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.min(sliceHeightPx, canvas.height - y);

    const sliceCtx = sliceCanvas.getContext("2d");
    if (!sliceCtx) continue;

    sliceCtx.drawImage(
      canvas,
      0,
      y,
      canvas.width,
      sliceCanvas.height,
      0,
      0,
      canvas.width,
      sliceCanvas.height
    );

    const pngDataUrl = sliceCanvas.toDataURL("image/png");
    const pngBytes = dataUrlToUint8Array(pngDataUrl);
    const pngImage = await pdf.embedPng(pngBytes);

    const imgWidthPt = canvas.width * scale;
    const imgHeightPt = sliceCanvas.height * scale;
    
    // Center horizontally
    const xOffset = (pageWidth - imgWidthPt) / 2;

    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawImage(pngImage, {
      x: xOffset,
      y: pageHeight - margin - imgHeightPt,
      width: imgWidthPt,
      height: imgHeightPt,
    });
  }

  const pdfBytes = await pdf.save();
  
  // Create a new ArrayBuffer copy to satisfy BlobPart type
  const arrayBuffer = new Uint8Array(pdfBytes).buffer as ArrayBuffer;
  
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // Cleanup (delay a tick for Safari)
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
