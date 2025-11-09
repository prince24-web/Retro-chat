import { RecursiveCharacterTextSplitter } from "npm:@langchain/textsplitters";

export async function splitDocs(docs) {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const allSplits = await textSplitter.splitDocuments(docs);

  console.log("✅ Text split into", allSplits.length, "chunks");
  return allSplits;
}
