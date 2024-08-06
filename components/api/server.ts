import express from 'express';
import bodyParser from 'body-parser';
import { generateSpeech } from './huggingface';

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/generate-speech', async (req, res) => {
  const { topic, subject, style, difficulty } = req.body;
  try {
    const audioUrl = await generateSpeech(topic, subject, style, difficulty);
    res.json({ audioUrl });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
