import { NextResponse } from 'next/server';
import { dataStore } from '../../../lib/dataStore';
import { GoogleGenerativeAI } from "@google/generative-ai";

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

  if (!process.env.GOOGLE_API_KEY) {
      console.error("GOOGLE_API_KEY is not set in .env.local");
      return NextResponse.json({ error: 'Google API key not configured. Please ensure GOOGLE_API_KEY is set.' }, { status: 500, headers: corsHeaders });
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  // const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


  try {
    const data = await req.json();
    const userMessage = data.message;


    if (!userMessage) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400, headers: corsHeaders });
    }

    console.log(`User message received: ${userMessage}`);

    const pdfTextContent = dataStore.getPdfText();

    if (!pdfTextContent) {
      return NextResponse.json({ error: 'Please upload a PDF first to get document-specific answers.' }, { status: 400, headers: corsHeaders });
    }


    const prompt = `Based on the following text from a PDF, answer the user's question.
    
    PDF Content:
    "${pdfTextContent}"
    
    User Question:
    "${userMessage}"
    
    Provide a concise and direct answer.`;

//     const result = await model.generateContent({
//       contents: [{ role: "user", parts: [{ text: prompt }] }],
//     });
//     const response = await result.response;
//     const aiResponseText = response.text();

//     console.log("Gemini Response:", aiResponseText);

//     return NextResponse.json({ response: aiResponseText }, { status: 200, headers: corsHeaders });

//   } catch (error: unknown) {
//     console.error('Error processing chat:', error);
//     let errorMessage = 'Failed to get a response from AI.';
//     if (error instanceof Error) {
//       errorMessage = error.message;
//     }
//     return NextResponse.json({ error: `Failed to process chat: ${errorMessage}` }, { status: 500, headers: corsHeaders });
//   }
// }

 let aiResponseText: string;
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const response = await result.response;
      aiResponseText = response.text();

      console.log("Gemini Response:", aiResponseText);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) { 
      console.error('Error generating content with Gemini:', error);

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
      } else if (error.message && error.message.includes('API key not valid')) {
          
          return NextResponse.json(
            { error: 'The provided Google API Key is invalid or has insufficient permissions.' },
            { status: 401, headers: corsHeaders }
          );
      }
      
      return NextResponse.json(
        { error: `Failed to get a response from AI: ${error.message || 'Unknown API error.'}` },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({ response: aiResponseText }, { status: 200, headers: corsHeaders });

  } catch (error: unknown) { 
    console.error('An unexpected error occurred in chat route:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: `Failed to process chat: ${errorMessage}` }, { status: 500, headers: corsHeaders });
  }
}