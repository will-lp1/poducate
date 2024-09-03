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

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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

    const [scriptCompletion] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert podcast script writer that creates single host podcast scripts, about 50 characters in length. Get straight to the point to optimise for learning. Little to no preamble or introduction. Just get into the topic."
          },
          {
            role: "user",
            content: `Create a podcast script about ${topic} in the style of ${style} at difficulty level ${difficulty}/10. Subject: ${subject} without any interruptions, speaker labels, or audio cues.`
          }
        ],
        max_tokens: 30
      })
    ]);

    const script = scriptCompletion.choices[0].message.content;
    if (!script) {
      throw new Error('Failed to generate script');
    }

    const audioStream = await elevenlabs.generate({
      voice: "sPzOOqSRgtzdT8DPbJYh",
      text: script,
      model_id: "eleven_turbo_v2",
      stream: true
    });

    const responseStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(JSON.stringify({ script }) + '\n');
        for await (const chunk of audioStream) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    return new NextResponse(responseStream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Error in podcast generation:', error);
    let errorMessage = 'Unknown error occurred';
    let errorDetails = '';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if ('status' in error && typeof error.status === 'number') {
        statusCode = error.status;
      }
    }

    if (statusCode === 401) {
      errorMessage = 'Authentication failed. Please check your ElevenLabs API key.';
    }

    return NextResponse.json({ 
      error: 'Podcast generation error', 
      message: errorMessage,
      details: errorDetails,
    }, { status: statusCode });
  }
}