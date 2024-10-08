import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, MoreVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Episode } from '@/types/podcast';

interface PodcastPlayerProps {
  episode: Episode;
  compact?: boolean;
}

const PodcastPlayer: React.FC<PodcastPlayerProps> = ({ episode, compact = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
      setCurrentTime(formatTime(audioRef.current.currentTime));
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime("00:00");
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      const newTime = (value[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(value[0]);
      setCurrentTime(formatTime(newTime));
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 10;
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 10;
    }
  };

  const handlePlaybackRateChange = (value: number) => {
    setPlaybackRate(value);
    if (audioRef.current) {
      audioRef.current.playbackRate = value;
    }
  };

  return (
    <div className="space-y-4">
      <audio ref={audioRef} src={episode.audioUrl} />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={skipBackward} 
            variant="outline" 
            size="icon"
            className="w-8 h-8 rounded-full"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button 
            onClick={togglePlayPause} 
            variant="outline" 
            size="icon"
            className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full`}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <Button 
            onClick={skipForward} 
            variant="outline" 
            size="icon"
            className="w-8 h-8 rounded-full"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        {!compact && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => handlePlaybackRateChange(0.5)}>0.5x</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handlePlaybackRateChange(0.75)}>0.75x</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handlePlaybackRateChange(1)}>1x</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handlePlaybackRateChange(1.25)}>1.25x</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handlePlaybackRateChange(1.5)}>1.5x</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handlePlaybackRateChange(2)}>2x</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium">{currentTime}</span>
        <Slider
          value={[progress]}
          onValueChange={handleSliderChange}
          max={100}
          step={0.1}
          className="w-full"
        />
        <span className="text-xs font-medium">{episode.duration}</span>
      </div>
    </div>
  );
};

export default PodcastPlayer;