import { IService, Service } from "@/shared/core/service-container";
import axios, { AxiosInstance } from "axios";
import { config } from "@/config/environment";
import { prisma } from '@/shared/database/connection';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from "@/shared/utils/logger";

@Service('OpenSubtitlesService')
export class OpenSubtitlesService implements IService {
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl = 'https://api.opensubtitles.com/api/v1';
  private readonly apiKey = config.apis.opensubtitles.apiKey;
  private readonly downloadPath = path.join(process.cwd(), 'downloads');

  constructor() {    
    if (!this.apiKey) {
      logger.error('OPENSUBTITLES_API_KEY environment variable is required');
    }
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Api-Key': this.apiKey,
        'User-Agent': 'leetube',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    this.httpClient.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    this.httpClient.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        logger.error('Response interceptor error:', error.message);
        if (error.response) {
          logger.error('Error status:', error.response.status);
          logger.error('Error headers:', error.response.headers);
          logger.error('Error data:', typeof error.response.data === 'string' ? 'HTML response' : error.response.data);
        }
        return Promise.reject(error);
      }
    );

    this.ensureDownloadPath();
  }

  private async ensureDownloadPath(): Promise<void> {
    try {
      await fs.mkdir(this.downloadPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create download directory:', error);
    }
  }

  async fetchAndSaveSubtitles(tmdbId: number, language: string = 'en'): Promise<string | null> {
    try {

      if (!this.apiKey) {
        logger.error('API key is missing - cannot fetch subtitles');
        return null;
      }

      // Check if subtitle already exists in database
      if (tmdbId) {
        const existingSubtitle = await prisma.subtitle.findUnique({
          where: {
            movieId_language: {
              movieId: tmdbId.toString(),
              language: language
            }
          }
        });

        if (existingSubtitle && existingSubtitle.isDownloaded && existingSubtitle.filePath) {
          return existingSubtitle.filePath;
        }
      }
      
      // Add delay to avoid rate limiting
      // await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await this.httpClient.get('/subtitles', {
        params: {
          tmdb_id: tmdbId,
          languages: language,
          type: 'movie'
        },
        // timeout: 30000
      });
      
      if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {        
        // Get the first subtitle for simplicity
        const subtitle = response.data.data[0];
        
        if (subtitle.attributes && subtitle.attributes.files && subtitle.attributes.files.length > 0) {
          const file = subtitle.attributes.files[0];
          
          // Add delay before download request
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Request download
          const downloadResponse = await this.httpClient.post('/download', {
            file_id: file.file_id
          }, {
            timeout: 15000
          });
          
          if (downloadResponse.data && downloadResponse.data.link) {
            // Download the actual subtitle file
            const subtitleResponse = await axios.get(downloadResponse.data.link, {
              responseType: 'text',
              timeout: 20000
            });

            // Convert SRT to VTT during download
            const vttContent = this.convertSrtToVtt(subtitleResponse.data);

            // Save as VTT file
            const fileName = `${tmdbId}_${language}.vtt`;

            await fs.mkdir(path.join(this.downloadPath, `${tmdbId}`), { recursive: true });
            
            const filePath = path.join(this.downloadPath, `${tmdbId}`, fileName);
            
            await fs.writeFile(filePath, vttContent, 'utf-8');

            // Save subtitle info to database
            if (tmdbId) {
              try {
                const languageNames: { [key: string]: string } = {
                  'en': 'English',
                  'es': 'Spanish', 
                  'fr': 'French',
                  'de': 'German',
                  'ar': 'Arabic',
                };

                const stats = await fs.stat(filePath);

                await prisma.subtitle.upsert({
                  where: {
                    movieId_language: {
                      movieId: tmdbId.toString(),
                      language: language
                    }
                  },
                  update: {
                    filePath: filePath,
                    fileSize: stats.size,
                    format: 'vtt',
                    isDownloaded: true,
                    updatedAt: new Date()
                  },
                  create: {
                    movieId: tmdbId.toString(),
                    language: language,
                    languageName: languageNames[language] || language.toUpperCase(),
                    format: 'vtt',
                    filePath: filePath,
                    fileSize: stats.size,
                    isDownloaded: true,
                    isDefault: language === 'en'
                  }
                });
              } catch (dbError) {
                logger.error('Failed to save subtitle to database:', dbError);
                // Don't fail the whole operation if database save fails
              }
            }
            
            return filePath;
          }
        }
      }
      
      return null;
    } catch (error: any) {
      logger.error('Error in fetchAndSaveSubtitles:', error.message);

      if (error.response) {
        logger.error('Response status:', error.response.status);
        logger.error('Response headers:', error.response.headers);
        
        if (error.response.status === 429) {
          logger.error('Rate limit exceeded - need to implement backoff strategy');
        } else if (error.response.status === 401) {
          logger.error('Authentication failed - check API key');
        }
      } else if (error.code === 'ECONNABORTED') {
        logger.error('Request timeout - OpenSubtitles API not responding');
      }
      
      return null;
    }
  }

  async validateApiConfig(): Promise<{ isValid: boolean; message: string }> {
    try {
      if (!this.apiKey) {
        return {
          isValid: false,
          message: 'API key is missing - cannot validate configuration'
        };
      }
      // Try a simple endpoint first to check if API is accessible
      const response = await this.httpClient.get('/infos/user', {
        timeout: 10000 // 10 second timeout for validation
      });
      
      return {
        isValid: true,
        message: 'API configuration is valid'
      };
    } catch (error: any) {
      logger.error('API validation failed:', error.message);
      let errorMessage = `API validation failed: ${error.message}`;
      
      if (error.response) {
        logger.error('Response status:', error.response.status);
        logger.error('Response data type:', typeof error.response.data);
        
        if (error.response.status === 401) {
          errorMessage = 'Invalid API key - check your OpenSubtitles API key configuration';
        } else if (error.response.status === 429) {
          errorMessage = 'Rate limit exceeded - too many API requests';
        } else if (typeof error.response.data === 'string' && error.response.data.includes('html')) {
          errorMessage = 'API returned HTML instead of JSON - possible redirect issue or invalid endpoint';
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - OpenSubtitles API not responding';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Cannot connect to OpenSubtitles API - check internet connection';
      }
      
      return {
        isValid: false,
        message: errorMessage
      };
    }
  }

  async testApiConnectivity(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        logger.error('API key is missing - cannot test connectivity');
        return false;
      }      
      // Try the simplest possible request
      const response = await this.httpClient.get('/infos/formats', {
        timeout: 15000,
        maxRedirects: 0 // Disable redirects to catch redirect issues
      });
      return true;
    } catch (error: any) {
      logger.error('API connectivity test failed:', error.message);

      if (error.response && error.response.status >= 300 && error.response.status < 400) {
        logger.error('API is redirecting - possible authentication issue');
      }
      
      return false;
    }
  }

  async getSavedSubtitlePath(tmdbId: string, language: string): Promise<string | null> {
    const fileName = `${tmdbId}_${language}.vtt`;
    const filePath = path.join(this.downloadPath, tmdbId, fileName);
    // Check if file exists
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      return null;
    }
  }

  async hasSubtitle(tmdbId: string, language: string): Promise<boolean> {
    try {
      if (!this.apiKey) {
        logger.error('API key is missing - cannot check for subtitles');
        return false;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 800));

      const response = await this.httpClient.get('/subtitles', {
        params: {
          tmdb_id: parseInt(tmdbId),
          languages: language,
          type: 'movie'
        },
        timeout: 15000
      });
    
      const hasResults = response.data && Array.isArray(response.data.data) && response.data.data.length > 0;

      return hasResults;
    } catch (error: any) {
      logger.error('Error checking for subtitles:', error.message);
      
      if (error.response && error.response.status === 429) {
        logger.error('Rate limit exceeded while checking subtitles');
      }
      
      return false;
    }
  }

  /**
   * Convert SRT format to VTT format
   */
  private convertSrtToVtt(srtContent: string): string {
    let vttContent = 'WEBVTT\n\n';
    
    // Split by double newlines to get subtitle blocks
    const blocks = srtContent.split(/\n\s*\n/);
    
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length >= 3) {
        // Skip the sequence number (first line)
        const timeLine = lines[1];
        // Convert SRT time format to VTT (replace comma with dot)
        const vttTimeLine = timeLine.replace(/,/g, '.');
        
        // Get subtitle text (all lines after timing)
        const subtitleText = lines.slice(2).join('\n');
        
        vttContent += `${vttTimeLine}\n${subtitleText}\n\n`;
      }
    }
    
    return vttContent;
  }

  getSubtitlePath(tmdbId: number, language: string): string {
    const fileName = `${tmdbId}_${language}.vtt`;
    return path.join(this.downloadPath, `${tmdbId}`, fileName);
  }

  /**
   * Get subtitles from database for a movie
   */
  async getMovieSubtitles(movieId: string): Promise<any[]> {
    try {
      const subtitles = await prisma.subtitle.findMany({
        where: {
          movieId: movieId,
          isDownloaded: true
        },
        select: {
          id: true,
          language: true,
          languageName: true,
          format: true,
          filePath: true,
          fileSize: true,
          isDefault: true,
          createdAt: true
        },
        orderBy: [
          { isDefault: 'desc' }, // Default language first
          { language: 'asc' }
        ]
      });

      return subtitles;
    } catch (error) {
      logger.error('Failed to get subtitles from database:', error);
      return [];
    }
  }

  /**
   * Check if subtitle exists in database
   */
  async hasSubtitleInDatabase(movieId: string, language: string): Promise<boolean> {
    try {
      const subtitle = await prisma.subtitle.findUnique({
        where: {
          movieId_language: {
            movieId: movieId,
            language: language
          }
        }
      });

      return subtitle?.isDownloaded ?? false;
    } catch (error) {
      logger.error('Failed to check subtitle in database:', error);
      return false;
    }
  }

  /**
   * Download multiple languages for a movie
   */
  async downloadMovieSubtitles(tmdbId: number, languages: string[] = ['en', 'es', 'fr', 'de', 'ar']): Promise<{ language: string, filePath: string | null }[]> {
    const results = [];
    
    for (const language of languages) {      
      try {
        const filePath = await this.fetchAndSaveSubtitles(tmdbId, language);
        results.push({ language, filePath });
        
        // Add delay between downloads to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        logger.error(`Failed to download subtitle for language ${language}:`, error);
        results.push({ language, filePath: null });
      }
    }

    return results;
  }
}