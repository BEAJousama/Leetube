interface Torrent {
  quality?: string;
  magnet?: string;
  seeds?: number;
  peers?: number;
  size?: string;
  hash?: string;
}

interface Subtitle {
  id?: string;
  language?: string;
  language_code?: string;
  rating?: number;
  hi?: boolean;
  url?: string;
}

interface Sources {
  torrents?: Torrent[];
  bestTorrent?: Torrent | null;
  subtitles?: Subtitle[];
  trailer?: string;
  hasStreaming?: boolean;
}

interface Movie {
  id: string;
  tmdbId?: number;
  imdbId?: string;
  title: string;
  originalTitle?: string;
  description?: string;
  releaseYear?: number;
  runtime?: number;
  genres?: string[];
  director?: string;
  directorImage?: string;
  cast?: string[];
  poster?: string;
  backdrop?: string;
  trailerUrl?: string;
  trailer?: string;
  rating?: number;
  voteCount?: number;
  popularity?: number;
  language?: string;
  status?: string;
  tagline?: string;
  budget?: number;
  revenue?: number;
  homepage?: string;
  sources?: Sources;
  tags?: string[];
  rated?: string;
  progress?: number;
  inLibrary?: boolean;
  inFavorite?: boolean;
  userRating?: number; // internal per-user rating (1-5 stars)
  averageRating?: number; // internal average rating
  totalRatings?: number; // total number of internal ratings
  isWatched?: boolean;
}

export { Movie, Torrent, Subtitle, Sources };
