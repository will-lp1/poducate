"use client"

import React, { useState } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Progress } from "./ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Episode } from "@/types/podcast"
import PodcastPlayer from "./PodcastPlayer"
import { Download, BookmarkPlus, Copy, Check } from 'lucide-react'
import axios from 'axios'
import { Textarea } from "./ui/textarea"

const predefinedSubjects = ["Technology", "Science", "History", "Arts", "Business", "Health"]
const styles = ["Quick Bites", "Deep Dives", "Story Time", "Key Ideas Explained", "Casual Conversations", "Big Picture View", "Beginner's Guide"]

export default function PoducateGenerator({ setBookmarks }: { setBookmarks: React.Dispatch<React.SetStateAction<Episode[]>> }) {
  const [topic, setTopic] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedStyle, setSelectedStyle] = useState<string>("")
  const [selectedDifficulty, setSelectedDifficulty] = useState(5)
  const [audioUrl, setAudioUrl] = useState("")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStage, setProgressStage] = useState('')
  const [transcriptCopied, setTranscriptCopied] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)
  const [customSubject, setCustomSubject] = useState("")
  const [context, setContext] = useState("")
  const [contextAdded, setContextAdded] = useState(false)

  const calculateAudioDuration = (audioBlob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        audioContext.decodeAudioData(arrayBuffer, (buffer) => {
          const durationInSeconds = buffer.duration;
          const minutes = Math.floor(durationInSeconds / 60);
          const seconds = Math.floor(durationInSeconds % 60);
          resolve(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        });
      };
      reader.readAsArrayBuffer(audioBlob);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const subjectToUse = selectedSubject === "custom" ? customSubject : selectedSubject
    setLoading(true)
    setProgress(0)
    setProgressStage('Initializing')
    setShowPlayer(false)

    try {
      setProgressStage('Generating podcast')
      const response = await axios.post('/api/generate-podcast', {
        topic,
        subject: subjectToUse,
        style: selectedStyle,
        difficulty: selectedDifficulty,
        context // Add the context to the API call
      }, {
        responseType: 'arraybuffer',
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
          setProgress(percentCompleted);
        }
      })

      const responseData = new TextDecoder().decode(response.data);
      const [scriptJson, ...audioChunks] = responseData.split('\n');
      const { script } = JSON.parse(scriptJson);
      setTranscript(script);

      const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
      setAudioBlob(audioBlob);
      setAudioUrl(URL.createObjectURL(audioBlob));

      // Calculate audio duration
      setProgressStage('Finalizing')
      const duration = await calculateAudioDuration(audioBlob)
      setProgress(100)

      const newPodcast: Episode = {
        id: Date.now(),
        title: `Generated Podcast: ${topic}`,
        duration: duration,
        subject: subjectToUse,
        transcript: script
      }

      setShowPlayer(true)
    } catch (error) {
      console.error('Error generating podcast:', error)
      alert('Failed to generate podcast. Please try again.')
    } finally {
      setLoading(false)
      setContextAdded(false) // Reset context added state after generation
    }
  }

  const copyTranscript = async () => {
    await navigator.clipboard.writeText(transcript)
    setTranscriptCopied(true)
    setTimeout(() => setTranscriptCopied(false), 2000)
  }

  const handleSaveBookmark = () => {
    if (audioBlob) {
      const newPodcast: Episode = {
        id: Date.now(),
        title: `Generated Podcast: ${topic}`,
        duration: '5:00',
        subject: selectedSubject,
        transcript: transcript,
      }
      setBookmarks(prev => [...prev, newPodcast])
      alert('Podcast saved to bookmarks successfully!')
    }
  }

  const handleContextPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    setContext(pastedText)
    setContextAdded(true)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Generate a Podcast</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-medium">Topic</label>
            <Input
              id="topic"
              placeholder="e.g. The Industrial Revolution, Ionic Bonds"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select or add a subject" />
              </SelectTrigger>
              <SelectContent>
                {predefinedSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
                <SelectItem value="custom">Custom Subject</SelectItem>
              </SelectContent>
            </Select>
            {selectedSubject === "custom" && (
              <Input
                placeholder="Add subject and exam board, e.g. Edexcel GCSE Business Studies"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="mt-2"
                required
              />
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="style" className="text-sm font-medium">Style</label>
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {styles.map((style) => (
                  <SelectItem key={style} value={style}>{style}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="difficulty" className="text-sm font-medium">Difficulty</label>
            <Slider
              id="difficulty"
              min={1}
              max={10}
              step={1}
              value={[selectedDifficulty]}
              onValueChange={(value) => setSelectedDifficulty(value[0])}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Beginner</span>
              <span>Expert</span>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="context" className="text-sm font-medium">Context (Optional)</label>
            <div className="relative">
              <Textarea
                id="context"
                placeholder="Right-click and paste or use Ctrl+V (Cmd+V on Mac) to add context..."
                value={contextAdded ? "" : context}
                onChange={(e) => setContext(e.target.value)}
                onPaste={handleContextPaste}
                rows={4}
                className={contextAdded ? 'bg-gray-100' : ''}
                readOnly={contextAdded}
              />
              {contextAdded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Check className="text-green-500 w-6 h-6" />
                  <span className="ml-2">Context added</span>
                </div>
              )}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Podcast'}
          </Button>
        </form>

        {loading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center">{progressStage}</p>
          </div>
        )}

        {showPlayer && audioUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Podcast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PodcastPlayer
                episode={{
                  id: Date.now(),
                  title: `Generated Podcast: ${topic}`,
                  duration: '5:00',
                  subject: selectedSubject,
                  transcript: transcript
                }}
                isPlaying={false}
                setIsPlaying={() => {}}
                progress={0}
                setProgress={() => {}}
              />
              <div className="flex space-x-2">
                <Button onClick={() => {
                  if (audioBlob) {
                    const url = URL.createObjectURL(audioBlob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `Generated_Podcast_${topic}.mp3`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                  }
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button onClick={handleSaveBookmark}>
                  <BookmarkPlus className="mr-2 h-4 w-4" />
                  Save to Bookmarks
                </Button>
                <Button onClick={copyTranscript} disabled={transcriptCopied}>
                  {transcriptCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {transcriptCopied ? 'Copied' : 'Copy Transcript'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}