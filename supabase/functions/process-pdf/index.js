import { loadDocument } from "./utils/loadDocument.js";
import { splitDocs } from "./utils/splitText.js";
import { embedChunks } from "./utils/embedText.js";
export async function handler(req) {
  try {
    const { filePath } = await req.json();

    // Step 1: Load document
    const docs = await loadDocument(filePath);

    // Step 2: Split into chunks
    const allSplits = await splitDocs(docs);

    
    // Step 3: Embed
    const embeddedDocs = await embedChunks(allSplits)
    console.log("✅ total embedded chunks:", embeddedDocs.length);

    // Step 4: Store in vector DB
    await supabase.from("pdf_embeddings").insert(
      embeddedDocs.map((chunk) => ({
        user_id: userId,
        pdf_id: pdfId,
        chunk_text: chunk.content,
        embedding: chunk.embedding,
        metadata: { filePath },
      }))
    );


    return new Response(
      JSON.stringify({
        success: true,
        message: "PDF processed successfully",
        totalChunks: allSplits.length,
        totalEmbeddings: embeddedDocs.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
