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

    let promptContent = `Create an educational podcast script about ${topic} in the style of ${style} at difficulty level ${difficulty}/10. Subject: ${subject}. The script should be approximately 3000 characters long. 

    Structure the podcast as follows:
    1. Introduction: Briefly introduce the topic and why it's important.
    2. Main Content: Divide the topic into 3-4 key points or subtopics. Explain each one clearly, using examples or analogies where appropriate.
    3. Summary: Recap the main points discussed.
    4. Breif conclusion and mention of Podugenius quiz to test knowledge

    Use a conversational tone and avoid technical jargon unless necessary. If using technical terms, briefly explain them. Do not include any interruptions, speaker labels, or audio cues.`;
    
    if (context) {
      promptContent += ` Incorporate the following context into the script where relevant: ${context}`;
    }

    const scriptCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k", // Using a model with higher context length
      messages: [
        {
          role: "system",
          content: "You are an expert educational podcast script writer that creates informative, engaging, and well-structured single-host podcast scripts. Your goal is to educate listeners on various topics in an accessible and interesting way. Aim for about 3000 characters to create a comprehensive yet concise educational podcast."
        },
        {
          role: "user",
          content: promptContent
        }
      ],
      max_tokens: 2000 // Increased token limit to accommodate longer script
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

      // Collect all chunks into a single buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunks);

      // Check if the audio buffer is valid
      if (audioBuffer.length === 0) {
        throw new Error('Generated audio buffer is empty');
      }

      return new NextResponse(
        JSON.stringify({ script, audioBuffer: audioBuffer.toString('base64') }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (elevenLabsError) {
      console.error('ElevenLabs API error:', elevenLabsError);
      return NextResponse.json({ 
        error: 'ElevenLabs API error', 
        message: 'Failed to generate audio. Please check your ElevenLabs API key.',
        details: elevenLabsError instanceof Error ? elevenLabsError.message : String(elevenLabsError),
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