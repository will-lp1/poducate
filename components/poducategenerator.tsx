"use client"

import React, { useState } from "react"
import { Input } from "./ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"

export default function PoducateGenerator() {
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedStyle, setSelectedStyle] = useState<string>("")
  const [selectedDifficulty, setSelectedDifficulty] = useState(5)
  const [audioUrl, setAudioUrl] = useState("")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [script, setScript] = useState("")
  const [transcript, setTranscript] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStage, setProgressStage] = useState('')
  const [transcriptCopied, setTranscriptCopied] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [progressMessages, setProgressMessages] = useState([
    'Channeling our inner Joe Rogan',
    'Crafting expert podcasts',
    'Diving deep into the topic',
    'Polishing the script',
    'Generating audio',
    'Almost there...',
  ])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const styles = [
    "Quick Bites",
    "Deep Dives",
    "Story Time",
    "Key Ideas Explained",
    "Casual Conversations",
    "Big Picture View",
    "Beginner's Guide",
  ]

  const handleStyleChange = (value: string) => {
    setSelectedStyle(value)
  }

  const handleDifficultyChange = (value: number[]) => {
    setSelectedDifficulty(value[0])
  }

  const updateProgressRandomly = () => {
    const randomIncrement = Math.random() * 5 + 1; // Random increment between 1 and 6
    setProgress(prevProgress => Math.min(prevProgress + randomIncrement, 99));
    setCurrentMessageIndex(prevIndex => (prevIndex + 1) % progressMessages.length);
    setProgressStage(progressMessages[currentMessageIndex]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setProgress(0)
    setProgressStage('Initializing')
    setShowPlayer(false)
    const formData = new FormData(event.currentTarget)
    const topic = formData.get('topic') as string

    const progressInterval = setInterval(updateProgressRandomly, 1000);

    try {
      console.log('Sending request to generate podcast');
      const response = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic, subject: selectedSubject, style: selectedStyle, difficulty: selectedDifficulty })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error details:', errorData);
        throw new Error(`${errorData.error}: ${errorData.message}\n${errorData.details}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let script = '';
      const audioChunks: Uint8Array[] = [];
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (isFirstChunk) {
          const textDecoder = new TextDecoder();
          const text = textDecoder.decode(value);
          const newlineIndex = text.indexOf('\n');
          if (newlineIndex !== -1) {
            const jsonPart = text.slice(0, newlineIndex);
            const data = JSON.parse(jsonPart);
            script = data.script;
            setScript(script);
            setTranscript(script);
            audioChunks.push(value.slice(newlineIndex + 1));
          }
          isFirstChunk = false;
        } else {
          audioChunks.push(value);
        }
      }

      const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
      setAudioBlob(audioBlob);
      setAudioUrl(URL.createObjectURL(audioBlob));

      // Set progress to 100% and show the player when audio is fully generated
      setProgress(100)
      setProgressStage('Podcast ready for your ears')
      setShowPlayer(true)
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error occurred'));
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        alert('Please check your API keys in the server configuration.');
      }
    } finally {
      clearInterval(progressInterval);
      setLoading(false)
    }
  }

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript)
      setTranscriptCopied(true)
      setTimeout(() => setTranscriptCopied(false), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy transcript:', err)
      alert('Failed to copy transcript. Please try again.')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg">
        <header className="p-6 sm:p-8 lg:p-10 bg-[#39FFA0] rounded-t-2xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">Poducate</h1>
        </header>
        <div className="p-6 sm:p-8 lg:p-10">
          <form className="flex flex-col items-start mb-6 gap-4 sm:gap-6 lg:gap-8" onSubmit={handleSubmit}>
            <div className="bg-gray-100 rounded-2xl p-6 sm:p-8 lg:p-10 w-full">
              <h3 className="text-lg font-medium mb-2 sm:text-xl lg:text-2xl text-black">Topic</h3>
              <div className="mt-4 sm:mt-6 lg:mt-8">
                <Input
                  type="text"
                  name="topic"
                  placeholder="e.g. The Industrial Revolution, Ionic Bonds"
                  className="w-full bg-white text-black p-4 rounded-2xl border border-gray-300 focus:border-[#39FFA0] focus:ring-[#39FFA0]"
                  maxLength={50}
                  required
                />
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl p-6 sm:p-8 lg:p-10 w-full">
              <h3 className="text-lg font-medium mb-2 sm:text-xl lg:text-2xl text-black">Specification</h3>
              <p className="sm:text-lg lg:text-xl text-black">Provide details about the podcast specifications.</p>
              <div className="mt-4 sm:mt-6 lg:mt-8">
                <Input
                  type="text"
                  placeholder="Enter specifics (e.g., exam board, subject)"
                  className="w-full bg-white text-black p-4 rounded-2xl border border-gray-300 focus:border-[#39FFA0] focus:ring-[#39FFA0]"
                  maxLength={50}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                />
              </div>
              <div className="mt-4 sm:mt-6 lg:mt-8">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-white text-black border border-gray-300 focus:border-[#39FFA0] focus:ring-[#39FFA0]"
                    >
                      {selectedStyle || "Select Podcast Style"}
                      <ChevronDownIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {styles.map((style) => (
                      <DropdownMenuItem key={style} onSelect={() => handleStyleChange(style)}>
                        {style}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-col w-full gap-4 sm:gap-6 lg:gap-8">
              <div className="flex flex-col items-start">
                <span className="mb-2 text-black sm:text-lg lg:text-xl">Difficulty:</span>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  defaultValue={[5]}
                  onValueChange={handleDifficultyChange}
                />
                <div className="flex justify-between text-sm text-black w-full mt-2">
                  <span className="sm:text-lg lg:text-xl">Curious Learner </span>
                  <span className="sm:text-lg lg:text-xl">Einstein </span>
                </div>
              </div>
              <div className="w-full">
                <Button type="submit" className="w-full bg-[#39FFA0] text-white hover:bg-[#39FFA0]/90 focus:ring-[#39FFA0] sm:text-lg lg:text-xl" disabled={loading}>
                  {loading ? `${progressStage}...` : "Generate Podcast"}
                </Button>
                {loading && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div className="bg-[#39FFA0] h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-sm text-center mt-1">{progressStage}</p>
                  </div>
                )}
              </div>
            </div>
          </form>
          <div className="bg-gray-100 rounded-2xl p-6 sm:p-8 lg:p-10">
            <h2 className="text-xl font-bold mb-4 sm:text-2xl lg:text-3xl text-black">Your Podcast</h2>
            {showPlayer && audioUrl && (
              <div className="flex items-center justify-between mb-4">
                <audio src={audioUrl} controls className="w-full" />
                {audioBlob && (
                  <Button
                    variant="outline"
                    className="bg-[#39FFA0] text-white hover:bg-[#39FFA0]/90 focus:ring-[#39FFA0] sm:text-lg lg:text-xl ml-4"
                    onClick={() => {
                      const url = URL.createObjectURL(audioBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'podcast.mp3';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                  >
                    <DownloadIcon className="h-6 w-4" />
                  </Button>
                )}
              </div>
            )}
            {transcript && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={copyTranscript}
                  disabled={transcriptCopied}
                >
                  {transcriptCopied ? (
                    <>
                      Copied <CheckIcon className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    "Copy Transcript"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}