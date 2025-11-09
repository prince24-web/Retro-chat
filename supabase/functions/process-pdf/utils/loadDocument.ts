import { PDFLoader } from "npm:@langchain/community/document_loaders/fs/pdf";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a typed Supabase client
const supabaseUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("NEXT_SUPABASE_SERVICE_ROLE_KEY")!;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Loads and parses a PDF document from Supabase Storage into LangChain documents.
 * @param path - The file path of the PDF in your Supabase bucket.
 * @returns An array of LangChain Document objects representing each page.
 */
export async function loadDocument(path: string) {
  // Download the PDF file from Supabase storage
  const { data: fileData, error } = await supabase.storage
    .from("pdf_files") // Replace with your actual bucket name
    .download(path);

  if (error || !fileData) throw error ?? new Error("Failed to download PDF from Supabase.");

  // Convert file data into a Blob
  const fileBlob = new Blob([await fileData.arrayBuffer()], { type: "application/pdf" });

  // Load the document using LangChain's PDFLoader
  const loader = new PDFLoader(fileBlob);
  const docs = await loader.load();

  console.log(`✅ PDF loaded: ${docs.length} pages`);
  return docs;
}
