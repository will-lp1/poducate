export interface Episode {
  id: number;
  title: string;
  duration: string;
  subject: string;
  transcript: string;
}

export interface Subject {
  name: string;
  color: string;
  icon: string;
  available: boolean;
}