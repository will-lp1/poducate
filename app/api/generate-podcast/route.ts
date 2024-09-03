import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { ElevenLabsClient } from "elevenlabs";

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const elevenlabs = process.env.ELEVEN_LABS_API_KEY
  ? new ElevenLabsClient({ apiKey: process.env.ELEVEN_LABS_API_KEY })
  : null;

function isOpenAIConfigured(client: OpenAI | null): client is OpenAI {
  return client !== null;
}

const TIMEOUT = 60000; // 60 seconds

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const { topic, subject, style, difficulty } = JSON.parse(rawBody);
    
    if (!isOpenAIConfigured(openai)) {
      throw new Error('OpenAI client is not initialized');
    }

    if (!elevenlabs) {
      throw new Error('ElevenLabs client is not initialized');
    }

    const [scriptCompletion, voiceSettings] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert podcast script writer that creates single host podcast scripts, about 5000 characters in length. Get straight to the point to optimise for learning. Little to no preamble or introduction. Just get into the topic."
          },
          {
            role: "user",
            content: `Create a podcast script about ${topic} in the style of ${style} at difficulty level ${difficulty}/10. Subject: ${subject} without any interruptions, speaker labels, or audio cues.`
          }
        ],
        max_tokens: 2000
      }),
      elevenlabs.getVoice("sPzOOqSRgtzdT8DPbJYh")
    ]);

    const script = scriptCompletion.choices[0].message.content;
    if (!script) {
      throw new Error('Failed to generate script');
    }

    const stream = new ReadableStream({
      async start(controller) {
        const audio = await elevenlabs.generate({
          voice: "sPzOOqSRgtzdT8DPbJYh",
          text: script,
          voice_settings: voiceSettings,
          stream: true
        });

        for await (const chunk of audio) {
          controller.enqueue(chunk);
        }
        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Error in podcast generation:', error);
    return NextResponse.json({ 
      error: 'Error in podcast generation', 
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}