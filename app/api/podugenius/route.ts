import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function summarizeTranscript(transcript: string, maxLength: number = 1000): string {
  if (transcript.length <= maxLength) return transcript;
  return transcript.slice(0, maxLength) + "...";
}

export async function POST(req: Request) {
  try {
    const { message, transcript, action, podcastTitle } = await req.json();

    const summarizedTranscript = summarizeTranscript(transcript);

    let systemPrompt = '';
    if (action === 'explain') {
      systemPrompt = `You are an AI assistant named Podugenius, specialized in explaining podcasts. 
      Use the provided transcript summary to give detailed explanations about the podcast content. 
      The podcast title is "${podcastTitle}".
      Be informative, clear, and engaging in your responses.`;
    } else if (action === 'quiz') {
      systemPrompt = `You are an AI assistant named Podugenius, specialized in creating quizzes about podcasts. 
      Use the provided transcript summary to generate thoughtful multiple-choice questions that test understanding of the key concepts discussed in the podcast. 
      The podcast title is "${podcastTitle}".
      For each question, provide 4 options. Format your response as JSON with the following structure:
      {
        "question": "The question text",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": "The correct option (as a string, e.g., '0', '1', '2', or '3', representing the index of the correct option)",
        "explanation": "Explanation of the correct answer"
      }
      Do not mention anything about typing A, B, C, or D in your response. The user will click buttons to answer.`;
    } else {
      throw new Error('Invalid action specified');
    }

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcript summary: ${summarizedTranscript}\n\nUser message: ${message}` }
      ],
      max_tokens: 500
    });

    const response = chatCompletion.choices[0].message.content;
    if (response === null) {
      throw new Error('No response from OpenAI');
    }

    if (action === 'quiz') {
      try {
        const parsedResponse = JSON.parse(response);
        return NextResponse.json({
          response: parsedResponse.question,
          options: parsedResponse.options,
          correctAnswer: parsedResponse.correctAnswer,
          explanation: parsedResponse.explanation,
          isQuestion: true
        });
      } catch (error) {
        console.error('Error parsing quiz response:', error);
        return NextResponse.json({ error: 'Failed to generate quiz question.' }, { status: 500 });
      }
    }

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Error in Podugenius API:', error);
    
    let errorMessage = 'An error occurred while processing your request.';
    if (error.cause && error.cause.code === 'CERT_NOT_YET_VALID') {
      errorMessage = 'There seems to be an issue with the system time. Please check your computer\'s clock and try again.';
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}