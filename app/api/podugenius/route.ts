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
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "The correct option",
        "explanation": "Explanation of the correct answer"
      }
      After the user selects an answer, provide feedback on whether it was correct and explain why.`;
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
          isQuestion: true,
          isCorrect: undefined
        });
      } catch (error) {
        // If it's not a question, it's probably feedback on the answer
        const isCorrect = response.toLowerCase().includes('correct');
        return NextResponse.json({ response, isCorrect, isQuestion: false });
      }
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in Podugenius API:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}