import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { ElevenLabsClient } from "elevenlabs";

console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
console.log('ELEVEN_LABS_API_KEY:', process.env.ELEVEN_LABS_API_KEY ? 'Set' : 'Not set');

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
    console.log('Received request to generate podcast');
    
    // Log the raw request body
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);
    
    // Parse the JSON body
    const { topic, subject, style, difficulty } = JSON.parse(rawBody);
    console.log('Parsed request data:', { topic, subject, style, difficulty });
    
    console.log('Generating script with OpenAI');
    if (!isOpenAIConfigured(openai)) {
      throw new Error('OpenAI client is not initialized');
    }
    const completion = await openai.chat.completions.create({
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
      max_tokens: 1600
    });

    const script = completion.choices[0].message.content;
    console.log('Generated script:', script);

    if (!script) {
      throw new Error('Failed to generate script');
    }
    console.log('Generating audio with ElevenLabs');
    if (!elevenlabs) {
      throw new Error('ElevenLabs client is not initialized');
    }
    const audio = await elevenlabs.generate({
      voice: "sPzOOqSRgtzdT8DPbJYh",
      text: script,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    });

    console.log('Converting audio to base64');
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const audioBase64 = buffer.toString('base64');

    console.log('Sending response');
    return NextResponse.json({
      audioData: `data:audio/mpeg;base64,${audioBase64}`,
      script: script
    });
  } catch (error) {
    console.error('Error in podcast generation:', error);
    return NextResponse.json({ 
      error: 'Failed to generate podcast', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}