
interface EmbeddedChunk {
  text: string;
  embedding: number[];
}

class DataStore {
  private pdfText: string = ''; 
  private pdfChunks: EmbeddedChunk[] = [];
  private pdfName: string | null = null;

  setPdfText(text: string) {
    this.pdfText = text;
    console.log("PDF text updated in store.");
  }

  getPdfText(): string {
    return this.pdfText;
  }

  setPdfChunks(chunks: EmbeddedChunk[]) {
    this.pdfChunks = chunks;
    console.log(`Stored ${chunks.length} PDF chunks with embeddings.`);
  }

  getPdfChunks(): EmbeddedChunk[] {
    return this.pdfChunks;
  }

  setPdfName(name: string | null) {
    this.pdfName = name;
    console.log(`PDF name updated in store: ${name}`);
  }

  getPdfName(): string | null {
    return this.pdfName;
  }
}

export const dataStore = new DataStore();