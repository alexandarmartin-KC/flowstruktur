/**
 * Client-side PDF to Image converter
 * Uses pdfjs-dist to render PDF pages to canvas, then converts to base64
 * 
 * This module is CLIENT-ONLY and should only be imported in 'use client' components
 */

export interface PDFPageImage {
  pageNumber: number;
  base64: string; // data:image/png;base64,...
  width: number;
  height: number;
}

/**
 * Convert a PDF file to an array of base64 PNG images
 * @param file - The PDF file to convert
 * @param maxPages - Maximum number of pages to convert (default: 3)
 * @param scale - Render scale for quality (default: 2.0 for high quality)
 */
export async function pdfToImages(
  file: File,
  maxPages: number = 3,
  scale: number = 2.0
): Promise<PDFPageImage[]> {
  // Only run on client
  if (typeof window === 'undefined') {
    throw new Error('pdfToImages can only be used in browser environment');
  }
  
  // Dynamic import pdfjs-dist to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker path for pdfjs
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Load PDF document
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = Math.min(pdf.numPages, maxPages);
  
  console.log(`PDF to Image: Converting ${numPages} pages (scale: ${scale})`);
  
  const images: PDFPageImage[] = [];
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not create canvas context');
    }
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas as HTMLCanvasElement,
    }).promise;
    
    // Convert to base64 PNG
    const base64 = canvas.toDataURL('image/png');
    
    images.push({
      pageNumber: pageNum,
      base64,
      width: viewport.width,
      height: viewport.height,
    });
    
    console.log(`PDF to Image: Page ${pageNum} converted (${viewport.width}x${viewport.height})`);
  }
  
  return images;
}

/**
 * Extract just the base64 data (without the data:image/png;base64, prefix)
 */
export function getBase64Data(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  return match ? match[1] : dataUrl;
}
