import { Ollama } from 'ollama';

const ollamaClient = new Ollama({
  host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

export default ollamaClient;