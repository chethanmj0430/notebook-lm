import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { dataStore } from '../../../lib/dataStore';

const SIMILARITY_THRESHOLD = 0.5; 

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length to calculate cosine similarity.");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0; 
  }

  return dotProduct / (magnitudeA * magnitudeB);
}


const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:4200',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query provided.' }, { status: 400, headers: corsHeaders });
    }

    if (!process.env.GOOGLE_API_KEY) {
      console.error("GOOGLE_API_KEY is not set in .env.local");
      return NextResponse.json({ error: 'Google API key not configured.' }, { status: 500, headers: corsHeaders });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    // const { embedding: queryEmbeddingResult } = await embeddingModel.embedContent(query);
    // const queryEmbedding = queryEmbeddingResult.values;

    let queryEmbedding: number[];
    try {
      const { embedding: queryEmbeddingResult } = await embeddingModel.embedContent(query);
      queryEmbedding = queryEmbeddingResult.values;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) { 
      console.error("Error embedding user query:", error);

      if (error.response && error.response.status === 429) {
        return NextResponse.json(
          { error: 'API rate limit exceeded or free tokens exhausted. Please try again later, or consider upgrading your Gemini plan.' },
          { status: 429, headers: corsHeaders }
        );
      } else if (error.message && error.message.includes('Resource has been exhausted')) {
        return NextResponse.json(
          { error: 'Gemini API free tokens exhausted. Please try again later, or consider upgrading your Gemini plan.' },
          { status: 429, headers: corsHeaders }
        );
      }
      return NextResponse.json(
        { error: 'Failed to process query for embedding. Please try again.' },
        { status: 500, headers: corsHeaders }
      );
    }


    const pdfChunks = dataStore.getPdfChunks();

    if (pdfChunks.length === 0) {
      return NextResponse.json(
        { message: "No PDF content loaded yet. Please upload a PDF first." },
        { status: 200, headers: corsHeaders }
      );
    }

    const relevantChunks = [];
    console.log(`Searching for relevant chunks for query: "${query}"`);
    for (const chunk of pdfChunks) {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (similarity >= SIMILARITY_THRESHOLD) {
        relevantChunks.push({
          text: chunk.text,
          similarity: similarity,
        });
      }
    }

    relevantChunks.sort((a, b) => b.similarity - a.similarity);
    const topRelevantChunks = relevantChunks.slice(0, 3); 

    let context = "";
    if (topRelevantChunks.length > 0) {
        context = topRelevantChunks.map(c => c.text).join("\n\n---\n\n");
        console.log("Retrieved context for query:", context.substring(0, Math.min(500, context.length)) + "...");
    } else {
        context = "No highly relevant information found in the document.";
        console.log("No highly relevant chunks found for query.");
    }

    const prompt = `You are a helpful assistant. Use the following document context to answer the user's question. If the answer is not in the context, state that you don't know.

Document Context:
${context}

User Question: ${query}
`;

    const result = await chatModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ answer: text }, { status: 200, headers: corsHeaders });

  } catch (error: unknown) {
    console.error('Error processing chat query:', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: `Failed to process chat query: ${errorMessage}` }, { status: 500, headers: corsHeaders });
  }
}