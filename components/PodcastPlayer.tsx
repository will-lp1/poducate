import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Rewind, FastForward } from 'lucide-react'
import { Episode } from '@/types/podcast'

export default function PodcastPlayer({ 
  episode, 
  isPlaying, 
  setIsPlaying, 
  progress, 
  setProgress,
  compact = false
}: { 
  episode: Episode,
  isPlaying: boolean,
  setIsPlaying: (isPlaying: boolean) => void,
  progress: number,
  setProgress: (progress: number) => void,
  compact?: boolean
}) {
  const [currentTime, setCurrentTime] = useState("00:00")
  const progressRef = useRef(progress)

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined
    if (isPlaying) {
      const durationInSeconds = parseInt(episode.duration) * 60
      interval = setInterval(() => {
        const newProgress = progressRef.current + (100 / durationInSeconds)
        if (newProgress >= 100) {
          clearInterval(interval)
          setIsPlaying(false)
          setProgress(100)
        } else {
          setProgress(newProgress)
        }
        progressRef.current = newProgress
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, episode.duration, setIsPlaying, setProgress])

  useEffect(() => {
    progressRef.current = progress
    const totalSeconds = Math.floor((parseInt(episode.duration) * 60 * progress) / 100)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    setCurrentTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
  }, [progress, episode.duration])

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSkipBack = () => {
    const newProgress = Math.max(0, progress - (10 / parseInt(episode.duration) / 60 * 100))
    setProgress(newProgress)
  }

  const handleSkipForward = () => {
    const newProgress = Math.min(100, progress + (30 / parseInt(episode.duration) / 60 * 100))
    setProgress(newProgress)
  }

  return (
    <div className={`bg-white ${compact ? 'p-4' : 'p-6'} rounded-2xl ${compact ? '' : 'shadow-md'} w-full`}>
      {!compact && <h3 className="text-xl font-semibold mb-4 truncate text-center">{episode.title}</h3>}
      <div className="flex flex-col items-center w-full">
        <div className="flex items-center justify-between w-full mb-4">
          <Button onClick={handleSkipBack} variant="ghost" size={compact ? "sm" : "icon"} className="rounded-full">
            <Rewind className={`${compact ? "h-4 w-4" : "h-6 w-6"} text-black`} />
          </Button>
          <Button 
            onClick={togglePlayPause} 
            variant="outline" 
            size={compact ? "sm" : "lg"} 
            className={`${compact ? "w-12 h-12" : "w-20 h-20"} rounded-full border-2 border-black hover:bg-gray-100 flex items-center justify-center`}
          >
            {isPlaying ? 
              <Pause className={`${compact ? "h-6 w-6" : "h-10 w-10"} text-black`} /> : 
              <Play className={`${compact ? "h-6 w-6 ml-0.5" : "h-10 w-10 ml-1"} text-black`} />
            }
          </Button>
          <Button onClick={handleSkipForward} variant="ghost" size={compact ? "sm" : "icon"} className="rounded-full">
            <FastForward className={`${compact ? "h-4 w-4" : "h-6 w-6"} text-black`} />
          </Button>
        </div>
        <Slider
          value={[progress]}
          max={100}
          step={0.1}
          className="w-full mb-2"
          onValueChange={(value) => setProgress(value[0])}
        />
        <div className="flex justify-between w-full text-sm text-gray-500">
          <span>{currentTime}</span>
          <span>{episode.duration}</span>
        </div>
      </div>
    </div>
  )
}
