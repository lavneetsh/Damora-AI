import { Injectable, Logger } from '@nestjs/common';

// pdf-parse v1.x and mammoth are CommonJS modules that export their function directly.
// We use require() with explicit type annotations to avoid any interop issues.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (
  buf: Buffer,
  opts?: { pagerender?: (pageData: any) => Promise<string> },
) => Promise<{ text: string; numpages: number }> = require('pdf-parse');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth: {
  extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>;
} = require('mammoth');

export interface ChunkResult {
  content: string;
  index: number;
  tokenCount: number;  // approximate (1 word ≈ 1.3 tokens)
  pageNumber: number;  // 1-indexed actual source page number
}

@Injectable()
export class TextExtractorService {
  private readonly logger = new Logger(TextExtractorService.name);

  // ─── Supported MIME Types ─────────────────────────────────────────────────

  static readonly SUPPORTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
  ] as const;

  static isSupportedType(mimeType: string): boolean {
    return TextExtractorService.SUPPORTED_TYPES.includes(
      mimeType as (typeof TextExtractorService.SUPPORTED_TYPES)[number],
    );
  }

  // ─── Text Extraction (full text — for backward compat) ────────────────────

  async extract(buffer: Buffer, mimeType: string): Promise<string> {
    const { fullText } = await this.extractWithPages(buffer, mimeType);
    return fullText;
  }

  // ─── Page-Aware Extraction ────────────────────────────────────────────────

  /**
   * Extracts text from a document file and returns:
   *   - fullText: combined text of all pages
   *   - pageTexts: array of text per page (index 0 = page 1)
   *
   * For non-paginated formats (DOCX, TXT, MD) all text is treated as page 1.
   */
  async extractWithPages(
    buffer: Buffer,
    mimeType: string,
  ): Promise<{ fullText: string; pageTexts: string[] }> {
    this.logger.debug(`Extracting text (with pages) from mimeType: ${mimeType}`);

    switch (mimeType) {
      case 'application/pdf':
        return this.extractPdfWithPages(buffer);

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword': {
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value as string;
        return { fullText: text, pageTexts: [text] };
      }

      case 'text/plain':
      case 'text/markdown':
      case 'text/x-markdown': {
        const text = buffer.toString('utf-8');
        return { fullText: text, pageTexts: [text] };
      }

      default:
        throw new Error(`Unsupported MIME type for text extraction: ${mimeType}`);
    }
  }

  private async extractPdfWithPages(
    buffer: Buffer,
  ): Promise<{ fullText: string; pageTexts: string[] }> {
    try {
      // pageTexts[i] will hold the text of PDF page i+1 (0-indexed array, 1-indexed pages)
      const pageTexts: string[] = [];

      const options = {
        // pdf-parse calls this once for every page.
        // We reconstruct readable text by tracking each item's x/y position:
        //   – Y axis change  → new line
        //   – X gap > 1 pt   → missing space (insert one)
        // This handles PDFs where spaces are encoded as positional gaps, not characters.
        pagerender: async (pageData: any): Promise<string> => {
          try {
            const content = await pageData.getTextContent();

            let text = '';
            let lastEndX = 0;
            let lastY = Number.NEGATIVE_INFINITY;

            for (const item of content.items as any[]) {
              if (!item.str) continue;

              // transform[4] = x position, transform[5] = y position (PDF coordinates)
              const x: number = item.transform[4];
              const y: number = item.transform[5];
              // advance width of this text run in the same coordinate space
              const w: number = typeof item.width === 'number' ? item.width : 0;

              if (Math.abs(y - lastY) > 2) {
                // Y changed → new line
                if (text.length > 0) text += '\n';
                lastEndX = 0;
              } else if (x > lastEndX + 1) {
                // Same line but there is a gap → insert a space
                if (text.length > 0 && !text.endsWith(' ')) text += ' ';
              }

              text += item.str;
              lastEndX = x + w;
              lastY = y;
            }

            const pageText = text.trim();
            pageTexts[pageData.pageIndex] = pageText;
            return pageText;
          } catch {
            pageTexts[pageData.pageIndex] = '';
            return '';
          }
        },
      };

      const data = await pdfParse(buffer, options as any);

      // Fallback: if pagerender didn't fire (some pdf-parse builds), use full text as page 1
      const resolvedPageTexts =
        pageTexts.length > 0 ? pageTexts : [data.text as string];

      this.logger.debug(
        `PDF extracted: ${(data.text as string).length} chars, ${data.numpages} pages, ${resolvedPageTexts.length} page entries`,
      );

      return { fullText: data.text as string, pageTexts: resolvedPageTexts };
    } catch (err) {
      this.logger.error(`PDF extraction failed: ${err}`);
      throw new Error(`PDF extraction failed: ${err}`);
    }
  }

  // ─── Page-Aware Chunking ──────────────────────────────────────────────────

  /**
   * Chunks text from multiple pages into overlapping segments, preserving
   * the actual source page number on every chunk.
   *
   * Strategy:
   *   - Process each page's text independently.
   *   - chunkSize: target words per chunk (default 200 words ≈ 1 Q&A paragraph)
   *   - overlap:   words shared between consecutive chunks within the same page
   *
   * Smaller chunks (200 words vs 500 words) give more precise semantic matches
   * because each chunk covers one logical topic instead of blending multiple ones.
   */
  chunkWithPages(
    pageTexts: string[],
    chunkSize = 200,
    overlap = 30,
  ): ChunkResult[] {
    const allChunks: ChunkResult[] = [];
    let globalIndex = 0;

    for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
      const pageNumber = pageIdx + 1; // 1-based
      const pageText = (pageTexts[pageIdx] ?? '').replace(/\s+/g, ' ').trim();
      if (!pageText) continue;

      const words = pageText.split(' ');
      let startWord = 0;

      while (startWord < words.length) {
        const endWord = Math.min(startWord + chunkSize, words.length);
        const content = words.slice(startWord, endWord).join(' ');

        if (content.trim().length > 0) {
          allChunks.push({
            content,
            index: globalIndex++,
            tokenCount: Math.ceil(content.split(' ').length * 1.3),
            pageNumber,
          });
        }

        startWord += chunkSize - overlap;
        if (chunkSize <= overlap) break; // safety guard
      }
    }

    this.logger.debug(
      `Chunked ${pageTexts.length} pages into ${allChunks.length} chunks (size=${chunkSize}, overlap=${overlap})`,
    );

    return allChunks;
  }

  /**
   * Legacy single-text chunking (kept for backward compat, page defaults to 1).
   */
  chunk(text: string, chunkSize = 200, overlap = 30): ChunkResult[] {
    return this.chunkWithPages([text], chunkSize, overlap);
  }

  /**
   * Performs WebAssembly-based Tesseract OCR on a PDF by first rendering
   * pages to PNG images and then executing character recognition.
   */
  async extractOcrWithPages(
    buffer: Buffer
  ): Promise<{ fullText: string; pageTexts: string[] }> {
    this.logger.log('📷 Starting OCR text extraction...');
    
    // Dynamically load libraries to keep startup fast and support ESM
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createCanvas } = require('@napi-rs/canvas');
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { createWorker } = require('tesseract.js');

    const pageTexts: string[] = [];
    let fullText = '';

    try {
      // Set the workerSrc for PDF.js
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';

      const pdfData = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        disableFontFace: true,
        verbosity: 0,
      });
      const pdfDocument = await loadingTask.promise;

      this.logger.debug(`Loaded PDF for OCR. Total pages: ${pdfDocument.numPages}`);

      // Initialize Tesseract WASM worker
      const worker = await createWorker('eng');

      // Process each page sequentially
      for (let pageNo = 1; pageNo <= pdfDocument.numPages; pageNo++) {
        this.logger.debug(`OCR rendering page ${pageNo}/${pdfDocument.numPages}...`);
        const page = await pdfDocument.getPage(pageNo);
        const viewport = page.getViewport({ scale: 1.5 }); // 1.5x scale is optimal for OCR quality

        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        // Render the page on canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Encode canvas to PNG Buffer (async, non-blocking)
        const imageBuffer = await canvas.encode('png');

        this.logger.debug(`OCR processing page ${pageNo}/${pdfDocument.numPages}...`);
        const result = await worker.recognize(imageBuffer);
        const text = result.data.text.trim();
        pageTexts.push(text);
        fullText += (fullText.length > 0 ? '\n' : '') + text;
      }

      await worker.terminate();
      this.logger.log('🎉 OCR text extraction completed successfully');

      return { fullText, pageTexts };
    } catch (err) {
      this.logger.error(`OCR extraction failed: ${err}`);
      throw new Error(`OCR extraction failed: ${err}`);
    }
  }
}
