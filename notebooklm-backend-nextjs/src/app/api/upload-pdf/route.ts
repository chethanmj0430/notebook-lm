import { NextResponse } from 'next/server';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs/promises';
import { dataStore } from '../../../lib/dataStore';
import { Readable } from 'stream';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

pdfjs.GlobalWorkerOptions.workerSrc = path.resolve(
  process.cwd(),
  'node_modules/pdfjs-dist/legacy/build/pdf.worker.js'
);


export const config = {
  api: {
    bodyParser: false,
  },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:4200',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const createFormidableRequest = (request: Request) => {
  if (!request.body) {
    throw new Error('Request body is null. Cannot process file upload.');
  }

  // @ts-expect-error Type 'ReadableStream<Uint8Array<ArrayBuffer>>' is not assignable to parameter of type 'ReadableStream<any>'.
  const nodeReadable = Readable.fromWeb(request.body);

  const mockRequest = Object.assign(nodeReadable, {
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
    url: request.url,
    httpVersion: '1.1',
    httpVersionMajor: 1,
    httpVersionMinor: 1,
    complete: false,
  });

  return mockRequest as unknown;
};

export async function POST(req: Request) {
  try {
    const form = formidable({});
    const formidableRequest = createFormidableRequest(req);

    const [fields, files]: [Fields, Files] = await new Promise((resolve, reject) => {
      // @ts-expect-error Argument of type 'Readable' is not assignable to parameter of type 'IncomingMessage'.
      form.parse(formidableRequest, (err, fields, files) => {
        if (err) {
          console.error("Formidable parse error:", err);
          return reject(err);
        }
        resolve([fields, files]);
      });
    });

    const _fields = fields; 
    const pdfFile = files.file ? (files.file as formidable.File[])[0] : null;

    if (!pdfFile) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400, headers: corsHeaders });
    }

    if (pdfFile.mimetype !== 'application/pdf') {
      await fs.unlink(pdfFile.filepath);
      return NextResponse.json({ error: 'Invalid file type. Only PDF files are allowed.' }, { status: 400, headers: corsHeaders });
    }

    const filePath = pdfFile.filepath;

    let pdfTextContent = '';
    try {
      const dataBuffer = await fs.readFile(filePath);
      const uint8Array = new Uint8Array(dataBuffer);

      const loadingTask = pdfjs.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((item: any) => 'str' in item)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => item.str)
          .join(' ');
        pdfTextContent += pageText + '\n';
      }

      console.log(`Successfully extracted text from PDF: ${pdfFile.originalFilename}`);
      console.log(`Extracted text preview: ${pdfTextContent.substring(0, Math.min(500, pdfTextContent.length))}...`);
    } catch (parseError) {
      console.error('Error parsing PDF with pdfjs-dist:', parseError);
      await fs.unlink(filePath);
      return NextResponse.json({ error: 'Failed to parse PDF content with pdfjs-dist.' }, { status: 500, headers: corsHeaders });
    }

    if (!process.env.GOOGLE_API_KEY) {
      console.error("GOOGLE_API_KEY is not set in .env.local");
      await fs.unlink(filePath);
      return NextResponse.json({ error: 'Google API key not configured.' }, { status: 500, headers: corsHeaders });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

    const textChunks = pdfTextContent.split('\n\n').filter(chunk => chunk.trim().length > 0);

    const embeddedChunks = [];
    for (const chunk of textChunks) {
      if (chunk.length > 0) { 
          try {
              
              const { embedding } = await embeddingModel.embedContent(chunk);
              embeddedChunks.push({
                  text: chunk,
                  embedding: embedding.values, 
              });
          } catch (embeddingError) {
              console.error("Error generating embedding for chunk:", embeddingError);
              
          }
      }
    }

    dataStore.setPdfChunks(embeddedChunks);
    console.log(`PDF text content chunked and embedded. ${embeddedChunks.length} chunks stored in dataStore.`);
    dataStore.setPdfName(pdfFile.originalFilename || 'unnamed_pdf');
    
    dataStore.setPdfText(pdfTextContent); 
    console.log(`PDF text content updated in dataStore (in-memory).`);

    await fs.unlink(filePath); 

    return NextResponse.json({ message: 'PDF processed successfully!', filename: pdfFile.originalFilename || 'unnamed_pdf' }, { status: 200, headers: corsHeaders });

  } catch (error: unknown) {
    console.error('Error processing PDF:', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: `Failed to process PDF: ${errorMessage}` }, { status: 500, headers: corsHeaders });
  }
}