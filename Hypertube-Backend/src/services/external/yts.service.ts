import axios from 'axios';
import { Service } from "@/shared/core/service-container";
import { IService } from "@/shared/core/service-container";
import { logger } from '@/shared/utils/logger';

// Simplified YTS Types - only what we need
export interface YTSTorrent {
  url: string;
  hash: string;
  quality: string;
  type: string;
  seeds: number;
  peers: number;
  size: string;
  size_bytes: number;
  date_uploaded: string;
  date_uploaded_unix: number;
}

export interface YTSMovieDetails {
  id: number;
  imdb_code: string;
  title: string;
  title_long: string;
  year: number;
  rating: number;
  runtime: number;
  yt_trailer_code: string;
  torrents: YTSTorrent[];
}

export interface YTSApiResponse<T> {
  status: string;
  status_message: string;
  data: T;
}

export interface YTSMovieDetailsData {
  movie: YTSMovieDetails;
}

export interface MagnetLink {
  quality: string;
  magnet: string;
  seeds: number;
  peers: number;
  size: string;
  hash: string;
}

@Service()
export class YTSService implements IService {
  private readonly baseUrl = 'https://movies-api.accel.li/api/v2';
  
  constructor() {
    logger.info('YTS Service initialized for torrents');
  }

  /**
   * Get magnet links for a movie by IMDB ID
   */
  async getMagnetLinks(imdbId: string): Promise<MagnetLink[]> {
    try {
      const movie = await this.getMovieByImdbId(imdbId);
      
      if (!movie || !movie.torrents || movie.torrents.length === 0) {
        logger.info(`No torrents found for IMDB ID: ${imdbId}`);
        return [];
      }

      const magnetLinks = movie.torrents
        .map(torrent => ({
          quality: torrent.quality,
          magnet: this.generateMagnetLink(torrent.hash, movie.title_long),
          seeds: torrent.seeds,
          peers: torrent.peers,
          size: torrent.size,
          hash: torrent.hash
        }))
        .sort((a, b) => {
          const qualityOrder = ['2160p', '1080p', '720p', '480p'];
          const aQualityIndex = qualityOrder.findIndex(q => a.quality.includes(q));
          const bQualityIndex = qualityOrder.findIndex(q => b.quality.includes(q));
          
          if (aQualityIndex !== bQualityIndex) {
            return (aQualityIndex === -1 ? 999 : aQualityIndex) - (bQualityIndex === -1 ? 999 : bQualityIndex);
          }
          
          return b.seeds - a.seeds; // Higher seeds first
        });

      logger.info(`Generated ${magnetLinks.length} magnet links for IMDB ID: ${imdbId}`);
      return magnetLinks;
    } catch (error: any) {
      logger.error(`Error getting magnet links for IMDB ID ${imdbId}:`, error.message);
      return [];
    }
  }

  /**
   * Get best quality magnet link (highest quality with good seeds)
   */
  async getBestMagnetLink(imdbId: string): Promise<MagnetLink | null> {
    try {
      const magnetLinks = await this.getMagnetLinks(imdbId);
      
      if (magnetLinks.length === 0) {
        return null;
      }

      // Return best quality with at least 5 seeds, or just the best available
      const bestLink = magnetLinks.find(link => link.seeds >= 5) || magnetLinks[0];
      
      logger.info(`Selected best magnet link for ${imdbId}: ${bestLink.quality} with ${bestLink.seeds} seeds`);
      return bestLink;
    } catch (error: any) {
      logger.error(`Error getting best magnet link for IMDB ID ${imdbId}:`, error.message);
      return null;
    }
  }

  /**
   * Get YouTube trailer code for a movie by IMDB ID
   */
  async getTrailer(imdbId: string): Promise<string | null> {
    try {
      const movie = await this.getMovieByImdbId(imdbId);
      
      if (!movie || !movie.yt_trailer_code) {
        logger.info(`No trailer found for IMDB ID: ${imdbId}`);
        return null;
      }

      logger.info(`Found trailer for IMDB ID ${imdbId}: ${movie.yt_trailer_code}`);
      return movie.yt_trailer_code;
    } catch (error: any) {
      logger.error(`Error getting trailer for IMDB ID ${imdbId}:`, error.message);
      return null;
    }
  }

  /**
   * Get complete streaming data for a movie (torrents + subtitles + trailer)
   */
  async getStreamingData(imdbId: string): Promise<{
    torrents: MagnetLink[];
    bestTorrent: MagnetLink | null;
    trailer: string | null;
    hasStreaming: boolean;
  }> {
    try {
      const [torrents, trailer] = await Promise.all([
        this.getMagnetLinks(imdbId),
        this.getTrailer(imdbId)
      ]);

      // Select best torrent based on seeders then quality then leachers
     const bestTorrent = torrents.length > 0 ? (() => {
        const qualityOrder = ['720p', '1080p', '2160p'];
        
        // Helper function to get a quality's rank (lower is better)
        const getQualityIndex = (quality: string) => {
          const index = qualityOrder.findIndex(q => quality.includes(q));
          return index === -1 ? qualityOrder.length : index;
        };
        
        // Find the maximum combined availability (seeds + peers)
        const maxAvailability = Math.max(...torrents.map(t => t.seeds + t.peers));
        
        // Find torrents with significantly high availability (within 10% of max)
        const threshold = maxAvailability * 0.9;
        const highAvailabilityTorrents = torrents.filter(t => (t.seeds + t.peers) >= threshold);
        
        // If we have a clear winner in availability, use it
        if (highAvailabilityTorrents.length === 1) {
          return highAvailabilityTorrents[0];
        }
        
        // Otherwise, use our hierarchical comparison on all torrents
        return torrents.reduce((best, current) => {
          // First compare by seeds (higher is better)
          if (current.seeds > best.seeds) {
            return current;
          } else if (current.seeds < best.seeds) {
            return best;
          }
          
          // If seeds are equal, compare by peers (lower is better)
          if (current.peers < best.peers) {
            return current;
          } else if (current.peers > best.peers) {
            return best;
          }
          
          // If seeds and peers are equal, compare by quality (lower index is better)
          const bestQualityIndex = getQualityIndex(best.quality);
          const currentQualityIndex = getQualityIndex(current.quality);
          
          if (currentQualityIndex < bestQualityIndex) {
            return current;
          } else if (currentQualityIndex > bestQualityIndex) {
            return best;
          }
          
          // If all criteria are equal, they are effectively the same
          return best;
        });
      })() : null;

      return {
        torrents,
        bestTorrent,
        trailer,
        hasStreaming: torrents.length > 0
      };
    } catch (error: any) {
      logger.error(`Error getting streaming data for IMDB ID ${imdbId}:`, error.message);
      return {
        torrents: [],
        bestTorrent: null,
        trailer: null,
        hasStreaming: false
      };
    }
  }

  /**
   * Private method to get movie details from YTS API
   */
  private async getMovieByImdbId(imdbId: string): Promise<YTSMovieDetails | null> {
    try {
      const response = await axios.get<YTSApiResponse<YTSMovieDetailsData>>(`${this.baseUrl}/movie_details.json`, {
        headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "application/json, text/javascript, /; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://yts.lt/"
        },
        params: {
          imdb_id: imdbId,
          with_images: false,
          with_cast: false
        },
        timeout: 10000
      });

      if (response.data.status === 'ok' && response.data.data.movie) {
        return response.data.data.movie;
      }

      return null;
    } catch (error: any) {
      logger.error(`YTS API error for IMDB ID ${imdbId}:`, error.message);
      return null;
    }
  }

  /**
   * Generate magnet link from hash and title
   */
  private generateMagnetLink(hash: string, title: string): string {
    // A list of reliable public trackers. This list should be updated periodically.
    const trackers = [
      'udp://tracker.opentrackr.org:1337/announce',
      'udp://9.rarbg.to:2710/announce',
      'udp://tracker.torrent.eu.org:451/announce',
      'udp://tracker.moeking.me:6969/announce',
      'udp://exodus.desync.com:6969/announce',
      'udp://tracker.theoks.net:6969/announce',
      'udp://open.stealth.si:80/announce',
      'udp://tracker.tiny-vps.com:6969/announce',
      'http://tracker.bt4g.com:2095/announce',
      'http://tracker.openbittorrent.com:80/announce',
      'https://tracker.torrent.eu.org:451/announce'
    ];

    // Properly encode each tracker for the URI
    const trackerString = trackers.map(tracker => `&tr=${encodeURIComponent(tracker)}`).join('');
    
    // Construct the final magnet link
    return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(title)}${trackerString}`;
  } 
}