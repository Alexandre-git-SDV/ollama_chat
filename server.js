import express from 'express';
import bodyParser from 'body-parser';
import { exec } from 'child_process';

const app = express();
app.use(bodyParser.json());
const PORT = 3000;

app.post('/chat', (req, res) => {
  const userMessage = req.body.message;

  // On utilise Ollama CLI pour obtenir la réponse
  exec(`ollama run gpt-oss:20b "${userMessage}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      return res.json({ reply: "Erreur lors de l'appel à Ollama." });
    }
    res.json({ reply: stdout.trim() });
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));