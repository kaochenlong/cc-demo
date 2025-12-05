import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: process.env.QDRANT_END_POINT,
  apiKey: process.env.QDRANT_API_KEY,
});

export default client;
