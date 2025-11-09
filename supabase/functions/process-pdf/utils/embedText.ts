import { HuggingFaceInferenceEmbeddings } from "npm:@langchain/community/embeddings/hf";

/**
 * Embeds text chunks using Hugging Face Inference API.
 * @param {Array} allSplits - Array of LangChain documents
 * @returns {Promise<Array>} Array of { content, embedding }
 */
export async function embedChunks(allSplits) {
  console.log("⚙️ Initializing Hugging Face Inference Embeddings...");

  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: Deno.env.get("HUGGINGFACE_API_KEY"),
    model: "sentence-transformers/all-mpnet-base-v2",
  });

  console.log("✅ Model configured. Generating embeddings...");

  const texts = allSplits.map((doc) => doc.pageContent);

  const vectors = await embeddings.embedDocuments(texts);

  console.log("✅ Embeddings generated:", vectors.length);

  return vectors.map((embedding, i) => ({
    content: texts[i],
    embedding,
  }));
}
