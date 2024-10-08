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
import { Download, BookmarkPlus, Copy, Check, ArrowRight } from 'lucide-react'
import axios from 'axios'
import { Textarea } from "./ui/textarea"
import { AnimatePresence, motion } from "framer-motion"

const predefinedSubjects = ["Technology", "Science", "History", "Arts", "Business", "Health"]
const styles = ["Quick Bites", "Deep Dives", "Story Time", "Key Ideas Explained", "Casual Conversations", "Big Picture View", "Beginner's Guide"]

export default function PoducateGenerator({ 
  setBookmarks, 
  onGoToLibrary,
  onPodcastGenerated
}: { 
  setBookmarks: React.Dispatch<React.SetStateAction<Episode[]>>,
  onGoToLibrary: () => void,
  onPodcastGenerated: (episode: Episode) => void
}) {
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerProgress, setPlayerProgress] = useState(0);
  const [savedBookmark, setSavedBookmark] = useState(false);
  const [showBookmarkPopup, setShowBookmarkPopup] = useState(false);
  const [audioDuration, setAudioDuration] = useState("00:00");

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
      setProgressStage('Generating podcast (this may take a few minutes)')
      const response = await axios.post('/api/generate-podcast', {
        topic,
        subject: subjectToUse,
        style: selectedStyle,
        difficulty: selectedDifficulty,
        context
      }, {
        responseType: 'json',
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
          setProgress(percentCompleted);
        }
      })

      const { script, audioBuffer } = response.data;
      setTranscript(script);

      if (!audioBuffer) {
        throw new Error('No audio data received from the server');
      }

      const audioArrayBuffer = Uint8Array.from(atob(audioBuffer), c => c.charCodeAt(0)).buffer;
      const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/mpeg' });
      setAudioBlob(audioBlob);
      setAudioUrl(URL.createObjectURL(audioBlob));

      // Calculate audio duration
      setProgressStage('Finalizing')
      const duration = await calculateAudioDuration(audioBlob)
      setAudioDuration(duration);
      setProgress(100)

      const newPodcast: Episode = {
        id: Date.now(),
        title: `Generated Podcast: ${topic}`,
        duration: duration,
        subject: subjectToUse,
        transcript: script,
        audioUrl: URL.createObjectURL(audioBlob)
      }

      setShowPlayer(true)
      onPodcastGenerated(newPodcast) // Call this function with the new podcast
    } catch (error) {
      console.error('Error generating podcast:', error)
      if (axios.isAxiosError(error) && error.response) {
        alert(`Failed to generate podcast: ${error.response.data.message || error.message}`)
      } else {
        alert('Failed to generate podcast. Please try again.')
      }
    } finally {
      setLoading(false)
      setContextAdded(false)
    }
  }

  const copyTranscript = async () => {
    await navigator.clipboard.writeText(transcript)
    setTranscriptCopied(true)
    setTimeout(() => setTranscriptCopied(false), 2000)
  }

  const handleSaveBookmark = () => {
    if (audioBlob && audioUrl) {
      const newPodcast: Episode = {
        id: Date.now(),
        title: `Generated Podcast: ${topic}`,
        duration: '5:00', // You might want to calculate this dynamically
        subject: selectedSubject === "custom" ? customSubject : selectedSubject,
        transcript: transcript,
        audioUrl: audioUrl
      }
      setBookmarks(prev => {
        // Check if the podcast is already in bookmarks
        const isAlreadyBookmarked = prev.some(bookmark => bookmark.id === newPodcast.id);
        if (!isAlreadyBookmarked) {
          return [...prev, newPodcast];
        }
        return prev;
      });
      setSavedBookmark(true);
      setShowBookmarkPopup(true);
      setTimeout(() => {
        setSavedBookmark(false);
        setShowBookmarkPopup(false);
      }, 5000);  // 5 seconds delay
    }
  }

  const goToBookmarks = () => {
    onGoToLibrary();
    setShowBookmarkPopup(false);
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
            <p className="text-xs text-center text-gray-500">This is a quick test generation.</p>
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
                  duration: audioDuration,
                  subject: selectedSubject,
                  transcript: transcript,
                  audioUrl: audioUrl
                }}
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSaveBookmark} 
                  variant="outline" 
                  className="w-full relative"
                  disabled={savedBookmark}
                >
                  <BookmarkPlus className="mr-2 h-5 w-5" />
                  Save to Bookmarks
                  {savedBookmark && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-green-500 text-white rounded"
                    >
                      <Check className="h-5 w-5" />
                    </motion.div>
                  )}
                </Button>
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
                <Button onClick={copyTranscript} disabled={transcriptCopied}>
                  {transcriptCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {transcriptCopied ? 'Copied' : 'Copy Transcript'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookmark Saved Popup */}
        <AnimatePresence>
          {showBookmarkPopup && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50 flex items-center space-x-4"
            >
              <Check className="text-green-500 mr-2 h-5 w-5" />
              <span className="mr-4">Successfully saved to bookmarks.</span>
              <Button onClick={goToBookmarks} variant="outline" size="sm" className="flex items-center">
                Go to Library
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}