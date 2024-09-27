"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,  
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Home, Bookmark, Wand2, MessageCircle, Minimize2, Maximize2, Sparkles, ArrowRight, BookOpen, BrainCircuit, Trophy, Star, Zap, Headphones, Copy, Check, X, BookmarkPlus, ArrowLeft, ChevronDown, ChevronUp, Menu } from 'lucide-react'
import PodcastPlayer from "@/components/PodcastPlayer"
import { Episode } from "@/types/podcast"
import { Slider } from "@/components/ui/slider"
import PoducateGenerator from "@/components/poducategenerator"
import axios from 'axios';
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@radix-ui/react-radio-group"
import { Label } from "@radix-ui/react-label"
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import Image from 'next/image'

const subjects = [
  { name: "Technology", color: "bg-blue-500", icon: "🖥️", available: true },
  { name: "Science", color: "bg-green-500", icon: "🧬", available: true },
  { name: "History", color: "bg-yellow-500", icon: "📜", available: true },
  { name: "Arts", color: "bg-purple-500", icon: "🎨", available: true },
  { name: "Business", color: "bg-red-500", icon: "💼", available: true },
  { name: "Health", color: "bg-pink-500", icon: "🏥", available: true },
  { name: "Economics", color: "bg-emerald-500", icon: "📊", available: false },
  { name: "Geography", color: "bg-indigo-500", icon: "🌍", available: false },
  { name: "Literature", color: "bg-amber-500", icon: "📚", available: false },
]

const episodes = [
  { id: 1, title: "The Future of AI", duration: "45:00", subject: "Technology", transcript: "This is a sample transcript for The Future of AI episode..." },
  { id: 2, title: "Quantum Computing Explained", duration: "30:00", subject: "Science", transcript: "This is a sample transcript for Quantum Computing Explained episode..." },
  { id: 3, title: "The Rise and Fall of Ancient Rome", duration: "60:00", subject: "History", transcript: "This is a sample transcript for The Rise and Fall of Ancient Rome episode..." },
  { id: 4, title: "Modern Art Movements", duration: "40:00", subject: "Arts", transcript: "This is a sample transcript for Modern Art Movements episode..." },
  { id: 5, title: "Startup Funding Strategies", duration: "50:00", subject: "Business", transcript: "This is a sample transcript for Startup Funding Strategies episode..." },
  { id: 6, title: "Mental Health in the Digital Age", duration: "35:00", subject: "Health", transcript: "This is a sample transcript for Mental Health in the Digital Age episode..." },
  { id: 7, title: "Blockchain and Cryptocurrency", duration: "55:00", subject: "Technology", transcript: "This is a sample transcript for Blockchain and Cryptocurrency episode..." },
  { id: 8, title: "The Search for Exoplanets", duration: "40:00", subject: "Science", transcript: "This is a sample transcript for The Search for Exoplanets episode..." },
  { id: 9, title: "The French Revolution", duration: "65:00", subject: "History", transcript: "This is a sample transcript for The French Revolution episode..." },
  { id: 10, title: "Contemporary Dance Techniques", duration: "35:00", subject: "Arts", transcript: "This is a sample transcript for Contemporary Dance Techniques episode..." },
  { id: 11, title: "Digital Marketing Trends", duration: "45:00", subject: "Business", transcript: "This is a sample transcript for Digital Marketing Trends episode..." },
  { id: 12, title: "Nutrition and Longevity", duration: "50:00", subject: "Health", transcript: "This is a sample transcript for Nutrition and Longevity episode..." },
  { id: 13, title: "5G Networks and IoT", duration: "40:00", subject: "Technology", transcript: "This is a sample transcript for 5G Networks and IoT episode..." },
  { id: 14, title: "Gene Editing with CRISPR", duration: "55:00", subject: "Science", transcript: "This is a sample transcript for Gene Editing with CRISPR episode..." },
  { id: 15, title: "The Industrial Revolution", duration: "70:00", subject: "History", transcript: "This is a sample transcript for The Industrial Revolution episode..." },
  { id: 16, title: "Film Photography in the Digital Age", duration: "30:00", subject: "Arts", transcript: "This is a sample transcript for Film Photography in the Digital Age episode..." },
  { id: 17, title: "Sustainable Business Practices", duration: "45:00", subject: "Business", transcript: "This is a sample transcript for Sustainable Business Practices episode..." },
  { id: 18, title: "Sleep Science and Productivity", duration: "40:00", subject: "Health", transcript: "This is a sample transcript for Sleep Science and Productivity episode..." },
]

type ChatMessage = {
  answered: boolean | undefined
  role: 'user' | 'assistant';
  content: string;
  isQuestion?: boolean;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
};

function BookmarkPage({ bookmarks, setCurrentEpisode, onExplain, onQuiz }: {
  bookmarks: Episode[],
  setCurrentEpisode: (episode: Episode) => void,
  onExplain: (episode: Episode) => void,
  onQuiz: (episode: Episode) => void
}) {
  const [filter, setFilter] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      (filter === "All" || bookmark.subject === filter) &&
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bookmarks</h2>
        <Input
          type="search"
          placeholder="Search bookmarks..."
          className="w-64"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Badge
          variant={filter === "All" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilter("All")}
        >
          All
        </Badge>
        {subjects.map((subject) => (
          <Badge
            key={subject.name}
            variant={filter === subject.name ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter(subject.name)}
          >
            {subject.name}
          </Badge>
        ))}
      </div>
      <ScrollArea className="h-[calc(100vh-200px)]">
        {filteredBookmarks.map((bookmark) => (
          <Card key={bookmark.id} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">{bookmark.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{bookmark.duration}</span>
                <div className="space-x-2">
                  <Button onClick={() => setCurrentEpisode(bookmark)}>Play</Button>
                  <Button variant="outline" onClick={() => onExplain(bookmark)}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Explain
                  </Button>
                  <Button variant="outline" onClick={() => onQuiz(bookmark)}>
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    Quiz
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>
  )
}

// Helper function to format time
const formatTime = (progress: number, duration: string) => {
  const [minutes, seconds] = duration.split(':').map(Number);
  const totalSeconds = minutes * 60 + seconds;
  const currentSeconds = Math.floor(totalSeconds * (progress / 100));
  const currentMinutes = Math.floor(currentSeconds / 60);
  const remainingSeconds = currentSeconds % 60;
  return `${currentMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [bookmarks, setBookmarks] = useState<Episode[]>([])
  const [showGenerator, setShowGenerator] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [showBookmarkPopup, setShowBookmarkPopup] = useState(false)
  const [copiedTranscript, setCopiedTranscript] = useState(false)
  const [savedBookmark, setSavedBookmark] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [chatAction, setChatAction] = useState<'explain' | 'quiz'>('explain')
  const [userPoints, setUserPoints] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  const [userBadges, setUserBadges] = useState<string[]>([])
  const [recentlyListened, setRecentlyListened] = useState<Episode[]>([])
  const [quizAccuracy, setQuizAccuracy] = useState<number>(0)
  const [totalQuestions, setTotalQuestions] = useState<number>(0)
  const [correctAnswers, setCorrectAnswers] = useState<number>(0)
  const [showIntroGuide, setShowIntroGuide] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRecentlyListenedExpanded, setIsRecentlyListenedExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [filteredEpisodes, setFilteredEpisodes] = useState<Episode[]>(episodes)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const supabase = createClientComponentClient()

  const router = useRouter()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    if (error) console.error('Error signing in:', error)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    } else {
      router.push('/auth')
    }
  }

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleEpisodeClick = (episode: Episode) => {
    setCurrentEpisode(episode)
    setIsLightboxOpen(true)
    setSelectedSubject(null)
    addToRecentlyListened(episode)
  }

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false)
    setSelectedSubject(null)
  }, [])

  const handleSaveBookmark = () => {
    if (currentEpisode && !bookmarks.some(bookmark => bookmark.id === currentEpisode?.id)) {
      setBookmarks([...bookmarks, currentEpisode]);
    }
    setSavedBookmark(true);
    setShowBookmarkPopup(true);
    setTimeout(() => {
      setSavedBookmark(false);
      setShowBookmarkPopup(false);
    }, 5000);  // 5 seconds delay
  }

  const goToBookmarks = () => {
    setActiveTab("bookmarks")
    closeLightbox()
    setShowBookmarkPopup(false)
  }

  const handleCopyTranscript = (transcript: string) => {
    navigator.clipboard.writeText(transcript).then(() => {
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 3000);
      console.log("The episode transcript has been copied to your clipboard.")
    })
  }

  const savePodcastToLibrary = async (title: string, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', currentEpisode?.subject || '');
    formData.append('audio', audioBlob, 'podcast.mp3');

    try {
      const response = await fetch('/api/podcasts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save podcast to library');
      }

      alert('Podcast saved to library successfully!');
    } catch (error) {
      console.error('Error saving podcast to library:', error);
      alert('Failed to save podcast to library. Please try again.');
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject)
    setIsLightboxOpen(true)
  }

  const closeSubjectDialog = () => {
    setSelectedSubject(null)
  }

  const handleQuizAnswer = (selectedAnswer: string, correctAnswer: string, explanation: string) => {
    const isCorrect = selectedAnswer === correctAnswer;
    setTotalQuestions(prev => prev + 1);
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      // Trigger confetti animation for correct answers
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    
    // Update accuracy immediately after each answer
    setQuizAccuracy(prevAccuracy => {
      const newCorrectAnswers = isCorrect ? correctAnswers + 1 : correctAnswers;
      const newTotalQuestions = totalQuestions + 1;
      return (newCorrectAnswers / newTotalQuestions) * 100;
    });

    const resultMessage: ChatMessage = {
      role: 'assistant', content: `${isCorrect ? '🎉 Correct!' : '❌ Incorrect.'} ${explanation}`,
      answered: undefined
    };
    setChatMessages(prev => [...prev, resultMessage]);

    // Add a delay before asking the next question
    setTimeout(() => {
      handleChatSubmit();
    }, 3000);
  };

  const handleChatSubmit = async (message = chatInput, action = chatAction) => {
    if (!currentEpisode) return;

    setIsAiTyping(true);

    try {
      const response = await axios.post('/api/podugenius', {
        message: action === 'quiz' ? 'Generate a quiz question' : message,
        transcript: currentEpisode.transcript,
        action: action,
        podcastTitle: currentEpisode.title
      });

      setIsAiTyping(false);

      if (action === 'quiz' && response.data.isQuestion) {
        const quizMessage: ChatMessage = {
          role: 'assistant',
          content: response.data.response,
          options: response.data.options,
          correctAnswer: response.data.correctAnswer,
          explanation: response.data.explanation,
          isQuestion: true,
          answered: undefined
        };
        setChatMessages(prev => [...prev, quizMessage]);
      } else {
        const aiResponse: ChatMessage = {
          role: 'assistant',
          content: response.data.response,
          answered: undefined
        };
        setChatMessages(prev => [...prev, aiResponse]);
      }

      setChatInput('');
    } catch (error) {
      console.error('Error sending message to Podugenius:', error);
      setIsAiTyping(false);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Oops! I had a little hiccup. Can you try asking me again?", answered: undefined }]);
    }
  };

  const addToRecentlyListened = (episode: Episode) => {
    setRecentlyListened(prev => {
      const filtered = prev.filter(ep => ep.id !== episode.id)
      return [episode, ...filtered].slice(0, 2)
    });
  };

  const handleBookmarkExplain = (episode: Episode) => {
    setCurrentEpisode(episode);
    setChatAction('explain');
    setChatMessages([
      {
        role: 'assistant',
        content: `Hi there! I'm ready to explain "${episode.title}". What would you like to know?`,
        answered: undefined
      }
    ]);
    setIsChatOpen(true);
  };

  const handleBookmarkQuiz = (episode: Episode) => {
    setCurrentEpisode(episode);
    setChatAction('quiz');
    setChatMessages([
      {
        role: 'assistant',
        content: `Let's start a quiz on "${episode.title}". I'll ask multiple-choice questions about the podcast.`,
        answered: undefined
      }
    ]);
    setIsChatOpen(true);
    // Trigger the first question immediately
    handleChatSubmit('Start the quiz', 'quiz');
  };

  const handleBackToEpisodes = () => {
    setCurrentEpisode(null);
    setSelectedSubject(currentEpisode?.subject || null);
  }

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenIntroGuide')
    if (hasSeenGuide) {
      setShowIntroGuide(false)
    }
  }, [])

  const closeIntroGuide = () => {
    setShowIntroGuide(false)
    localStorage.setItem('hasSeenIntroGuide', 'true')
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      setFilteredEpisodes(episodes)
      setSearchSuggestions([])
    } else {
      const filtered = episodes.filter(episode =>
        episode.title.toLowerCase().includes(query.toLowerCase()) ||
        episode.subject.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredEpisodes(filtered)

      const suggestions = Array.from(new Set(
        filtered.map(episode => episode.title)
          .concat(filtered.map(episode => episode.subject))
      )).slice(0, 5)
      setSearchSuggestions(suggestions)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Button onClick={signIn}>Sign In with Google</Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Mobile Header */}
        <header className="bg-white p-4 shadow-md flex justify-between items-center md:hidden">
          <Image
            src="/Vector.svg"
            alt="Dashboard Logo"
            width={100}
            height={30}
          />
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-16 left-0 right-0 bg-white shadow-md z-50 md:hidden"
            >
              <nav className="flex flex-col p-4">
                <Button
                  variant={activeTab === "home" ? "default" : "ghost"}
                  className="w-full justify-start mb-2"
                  onClick={() => {
                    setActiveTab("home");
                    setShowGenerator(false);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                <Button
                  variant={activeTab === "bookmarks" ? "default" : "ghost"}
                  className="w-full justify-start mb-2"
                  onClick={() => {
                    setActiveTab("bookmarks");
                    setShowGenerator(false);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Bookmarks
                </Button>
                <Button
                  variant={activeTab === "generator" ? "default" : "ghost"}
                  className="w-full justify-start mb-2"
                  onClick={() => {
                    setActiveTab("generator");
                    setShowGenerator(true);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generator
                </Button>
                <Button onClick={signOut} variant="outline" className="w-full mt-2">
                  Sign Out
                </Button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar (hidden on mobile) */}
          <aside className="w-64 bg-white p-4 shadow-md flex-col hidden md:flex">
            <div className="mb-6">
              <Image
                src="/Vector.svg"
                alt="Dashboard Logo"
                width={150}
                height={50}
                className="ml-0"
              />
            </div>
            <nav className="space-y-2 flex-grow mb-4">
              <Button
                variant={activeTab === "home" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab("home")
                  setShowGenerator(false)
                }}
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button
                variant={activeTab === "bookmarks" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab("bookmarks")
                  setShowGenerator(false)
                }}
              >
                <Bookmark className="mr-2 h-4 w-4" />
                Bookmarks
              </Button>
              <Button
                variant={activeTab === "generator" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab("generator")
                  setShowGenerator(true)
                }}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Generator
              </Button>
            </nav>
            <Button onClick={signOut} variant="outline">Sign Out</Button>

            {/* Sidebar player (visible only on desktop) */}
            <AnimatePresence>
              {currentEpisode && !isLightboxOpen && (
                <motion.div
                  layoutId="player-container"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="mt-auto bg-white p-4 border-t border-gray-200 shadow-lg"
                >
                  <motion.div layoutId="player-content" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-2 overflow-hidden">
                        <p className="text-sm font-semibold truncate">{currentEpisode.title}</p>
                        <p className="text-xs text-gray-500 truncate">{currentEpisode.subject}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsLightboxOpen(true)} 
                        className="flex-shrink-0"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <motion.div layoutId="player-controls">
                      <PodcastPlayer
                        episode={currentEpisode}
                        isPlaying={isPlaying}
                        setIsPlaying={setIsPlaying}
                        progress={progress}
                        setProgress={setProgress}
                        compact={true}
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-6 overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="home" className="mt-0 space-y-6">
                {/* Search bar */}
                <div className="max-w-md mx-auto relative">
                  <Input
                    type="search"
                    placeholder="Search podcasts..."
                    className="w-full"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {searchSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1">
                      {searchSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSearch(suggestion)}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Subject cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjects.map((subject) => (
                    <Card
                      key={subject.name}
                      className={`${subject.color} text-white cursor-pointer hover:opacity-90 transition-all duration-300 transform hover:scale-105`}
                      onClick={() => subject.available && handleSubjectClick(subject.name)}
                    >
                      <CardHeader>
                        <CardTitle className="text-2xl">{subject.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl">{subject.icon}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="bookmarks" className="mt-0">
                <BookmarkPage
                  bookmarks={bookmarks}
                  setCurrentEpisode={setCurrentEpisode}
                  onExplain={handleBookmarkExplain}
                  onQuiz={handleBookmarkQuiz}
                />
              </TabsContent>
              <TabsContent value="generator" className="mt-0">
                <div className="max-w-2xl mx-auto">
                  <PoducateGenerator setBookmarks={setBookmarks} />
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>

        {/* Mobile player (visible only on mobile) */}
        <AnimatePresence>
          {currentEpisode && !isLightboxOpen && (
            <motion.div
              layoutId="player-container-mobile"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-lg md:hidden"
            >
              <motion.div layoutId="player-content-mobile" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2 overflow-hidden">
                    <p className="text-sm font-semibold truncate">{currentEpisode.title}</p>
                    <p className="text-xs text-gray-500 truncate">{currentEpisode.subject}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsLightboxOpen(true)} 
                    className="flex-shrink-0"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                <motion.div layoutId="player-controls-mobile">
                  <PodcastPlayer
                    episode={currentEpisode}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    progress={progress}
                    setProgress={setProgress}
                    compact={true}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chatbot */}
      <div className="fixed bottom-4 right-4 z-30">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="w-96 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-[#3bffa1] to-[#9544ff] text-white rounded-t-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <CardTitle className="text-lg">Podugenius</CardTitle>
                  </div>
                  {chatAction === 'quiz' && totalQuestions > 0 && (
                    <div className="text-sm font-semibold bg-white bg-opacity-20 px-2 py-1 rounded-full">
                      Accuracy: {quizAccuracy.toFixed(1)}% ({correctAnswers}/{totalQuestions})
                    </div>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="text-white hover:text-gray-200">
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-4 flex flex-col h-[500px]">
                  <ScrollArea className="flex-grow mb-4 pr-4" ref={chatContainerRef}>
                    <div className="space-y-4">
                      {chatMessages.map((msg, index) => (
                        <div 
                          key={index} 
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          ref={index === chatMessages.length - 1 ? lastMessageRef : null}
                        >
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : msg.role === 'assistant'
                                ? msg.content.includes('Correct!')
                                  ? 'bg-green-100 border border-green-300'
                                  : msg.content.includes('Incorrect')
                                    ? 'bg-red-100 border border-red-300'
                                    : 'bg-gray-100 border border-gray-300'
                                : 'bg-gray-100 border border-gray-300'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            {msg.isQuestion && msg.options && (
                              <div className="mt-3 space-y-2">
                                {msg.options.map((option, optionIndex) => (
                                  <Button
                                    key={optionIndex}
                                    onClick={() => handleQuizAnswer(String(optionIndex), msg.correctAnswer || '', msg.explanation || '')}
                                    className="w-full text-left justify-start h-auto py-2 px-3"
                                    variant="outline"
                                    disabled={msg.answered}
                                  >
                                    <span className="font-semibold mr-2">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {isAiTyping && (
                        <div className="flex justify-start" ref={lastMessageRef}>
                          <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 border border-gray-300">
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                              className="flex items-center space-x-1"
                            >
                              <div className="w-2 h-2 bg-gray-500 rounded-full" />
                              <div className="w-2 h-2 bg-gray-500 rounded-full" />
                              <div className="w-2 h-2 bg-gray-500 rounded-full" />
                            </motion.div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  <div className="mt-auto">
                    <div 
                      className="flex items-center justify-between cursor-pointer mb-2"
                      onClick={() => setIsRecentlyListenedExpanded(!isRecentlyListenedExpanded)}
                    >
                      <h4 className="text-sm font-semibold">Recently Listened</h4>
                      <Button variant="ghost" size="sm">
                        {isRecentlyListenedExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <AnimatePresence>
                      {isRecentlyListenedExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          {recentlyListened.length > 0 ? (
                            recentlyListened.map((episode) => (
                              <div key={episode.id} className="flex justify-between items-center mb-2">
                                <span className="text-sm truncate mr-2">{episode.title}</span>
                                <div>
                                  <Button variant="outline" size="sm" className="mr-1" onClick={() => handleBookmarkExplain(episode)}>
                                    <BookOpen className="h-3 w-3" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleBookmarkQuiz(episode)}>
                                    <BrainCircuit className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4">
                              <Headphones className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">No episodes listened to yet.</p>
                              <p className="text-xs text-gray-400">Start listening to see your recent episodes here!</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask me anything!"
                      onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                      className="flex-1"
                    />
                    <Button onClick={(e) => handleChatSubmit()} disabled={isAiTyping}>
                      {isAiTyping ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <BrainCircuit className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        "Send"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        {!isChatOpen && (
          <Button onClick={() => setIsChatOpen(true)} className="rounded-full w-12 h-12 p-0 bg-gradient-to-r from-[#3bffa1] to-[#9544ff] hover:from-[#32d989] hover:to-[#7e3ad9]">
            <MessageCircle className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Episodes and Player Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-auto"
            >
              {selectedSubject ? (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">{selectedSubject} Episodes</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsLightboxOpen(false)}>
                      <Minimize2 className="h-6 w-6" />
                    </Button>
                  </div>
                  <ScrollArea className="h-[400px] mb-4">
                    {filteredEpisodes.filter(episode => episode.subject === selectedSubject).map((episode) => (
                      <div
                        key={episode.id}
                        className="flex justify-between items-center py-2 border-b cursor-pointer hover:bg-gray-100"
                        onClick={() => handleEpisodeClick(episode)}
                      >
                        <span>{episode.title}</span>
                        <span className="text-sm text-gray-500">{episode.duration}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              ) : currentEpisode ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" onClick={handleBackToEpisodes} className="mr-2">
                        <ArrowLeft className="h-6 w-6" />
                      </Button>
                      <div>
                        <h3 className="text-2xl font-bold">{currentEpisode.title}</h3>
                        <p className="text-sm text-gray-500">{currentEpisode.subject}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsLightboxOpen(false)}>
                      <Minimize2 className="h-6 w-6" />
                    </Button>
                  </div>
                  <div className="bg-gray-100 p-6 rounded-lg mb-6">
                    <PodcastPlayer 
                      episode={currentEpisode} 
                      isPlaying={isPlaying}
                      setIsPlaying={setIsPlaying}
                      progress={progress}
                      setProgress={setProgress}
                      compact={false}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Button 
                        onClick={handleSaveBookmark} 
                        variant="outline" 
                        className="w-full mr-2 relative"
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
                      <Button 
                        onClick={() => handleCopyTranscript(currentEpisode.transcript)} 
                        variant="outline" 
                        className="w-full ml-2 relative"
                        disabled={copiedTranscript}
                      >
                        <Copy className="mr-2 h-5 w-5" />
                        Copy Transcript
                        {copiedTranscript && (
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
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg max-h-40 overflow-y-auto">
                      <h4 className="text-lg font-semibold mb-2">Transcript Preview</h4>
                      <p className="text-sm text-gray-700">{currentEpisode.transcript.slice(0, 300)}...</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <span className="mr-4">Successfully saved.</span>
            <Button onClick={goToBookmarks} variant="outline" size="sm" className="flex items-center">
              Go to Library
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Introductory Guide Modal */}
      <AnimatePresence>
        {showIntroGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-4">Welcome to Your Podcast Dashboard!</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">🏠 Home</h3>
                  <p>Browse and discover podcasts across various subjects. Click on a subject card to explore episodes.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">🔖 Bookmarks</h3>
                  <p>Save your favorite episodes for easy access later. You can explain or quiz yourself on bookmarked content.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">✨ Generator</h3>
                  <p>Create custom podcast episodes on any topic you are interested in. Perfect for personalized learning!</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">🤖 Podugenius Chat</h3>
                  <p>Your AI assistant is always ready to explain concepts or quiz you on episode content. Look for the chat icon in the bottom right corner.</p>
                </div>
              </div>
              <Button 
                onClick={closeIntroGuide} 
                className="mt-6 w-full"
              >
                Get Started
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}