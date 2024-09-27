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

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const { topic, subject, style, difficulty, context } = JSON.parse(rawBody);
    
    if (!isOpenAIConfigured(openai)) {
      throw new Error('OpenAI client is not initialized');
    }

    if (!elevenlabs) {
      throw new Error('ElevenLabs client is not initialized');
    }

    let promptContent = `Create a podcast script about ${topic} in the style of ${style} at difficulty level ${difficulty}/10. Subject: ${subject}. The script should be approximately 750 words long, which typically results in a 5-minute podcast. Do not include any interruptions, speaker labels, or audio cues.`;
    
    if (context) {
      promptContent += ` Use the following context to inform the content: ${context}`;
    }

    const scriptCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert podcast script writer that creates single host podcast scripts. Aim for about 750 words to create a 5-minute podcast. Get straight to the point to optimize for learning. Minimal preamble or introduction. Focus on delivering valuable content about the topic."
        },
        {
          role: "user",
          content: promptContent
        }
      ],
      max_tokens: 1000
    });

    const script = scriptCompletion.choices[0].message.content;
    if (!script) {
      throw new Error('Failed to generate script');
    }

    try {
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
        },
      });
    } catch (elevenLabsError) {
      console.error('ElevenLabs API error:', elevenLabsError);
      return NextResponse.json({ 
        error: 'ElevenLabs API error', 
        message: 'Failed to generate audio. Please check your ElevenLabs API key.',
        script: script // Return the generated script even if audio generation fails
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in podcast generation:', error);
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if ('status' in error && typeof error.status === 'number') {
        statusCode = error.status;
      }
    }

    return NextResponse.json({ 
      error: 'Podcast generation error', 
      message: errorMessage,
    }, { status: statusCode });
  }
}