const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Sert index.html, CSS, JS, etc.
app.use(express.static('.'));

// Route pour le chat
app.post('/chat', (req, res) => {
  const userMessage = req.body.message;

  exec(`ollama run gpt-oss:20b "${userMessage}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      return res.json({ reply: "Erreur lors de l'appel à Ollama." });
    }
    res.json({ reply: stdout.trim() });
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));