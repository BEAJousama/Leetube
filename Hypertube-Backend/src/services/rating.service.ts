import { prisma } from '@/shared/database/connection';
import { Service, IService } from '@/shared/core/service-container';
import { 
  CreateRatingDto, 
  RatingResponseDto 
} from '@/shared/types/dtos';
import { logger } from '@/shared/utils/logger';

@Service()
export class RatingService implements IService {

  constructor() {
    // Initialization if needed
    logger.info('Rating Service initialized');
  }

  async createOrUpdateRating(userId: string, ratingData: CreateRatingDto): Promise<RatingResponseDto> {
    // Import MovieService to handle UserMovie interaction
    const { getService } = await import('@/shared/core/service-container');
    const movieService = getService<any>('MovieService');
    
    // Ensure UserMovie record exists when rating is created
    await movieService.handleMovieRatingInteraction(userId, ratingData.movieId);

    // Check if rating already exists
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId: ratingData.movieId
        }
      }
    });

    let rating;
    if (existingRating) {
      // Update existing rating
      rating = await prisma.rating.update({
        where: { id: existingRating.id },
        data: { 
          rating: ratingData.rating, 
          updatedAt: new Date() 
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              createdAt: true
            }
          },
          movie: {
            select: {
              id: true,
              title: true,
              description: true,
              year: true,
              genre: true,
              imdbId: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });
    } else {
      // Create new rating
      rating = await prisma.rating.create({
        data: {
          userId,
          movieId: ratingData.movieId,
          rating: ratingData.rating
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              createdAt: true
            }
          },
          movie: {
            select: {
              id: true,
              title: true,
              description: true,
              year: true,
              genre: true,
              imdbId: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });
    }

    return this.mapRatingToDto(rating);
  }

  async getUserMovieRating(userId: string, movieId: string): Promise<RatingResponseDto | null> {
    const rating = await prisma.rating.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            createdAt: true
          }
        },
        movie: {
          select: {
            id: true,
            title: true,
            description: true,
            year: true,
            genre: true,
            imdbId: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    return rating ? this.mapRatingToDto(rating) : null;
  }

  async getMovieRatings(movieId: string): Promise<RatingResponseDto[]> {
    const ratings = await prisma.rating.findMany({
      where: { movieId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            createdAt: true
          }
        },
        movie: {
          select: {
            id: true,
            title: true,
            description: true,
            year: true,
            genre: true,
            imdbId: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return ratings.map(rating => this.mapRatingToDto(rating));
  }

  async deleteRating(id: string, userId: string): Promise<boolean> {
    try {
      const rating = await prisma.rating.findUnique({
        where: { id }
      });

      if (!rating || rating.userId !== userId) {
        return false;
      }

      await prisma.rating.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async clearRating(userId: string, movieId: string): Promise<boolean> {
    try {
      const rating = await prisma.rating.findUnique({
        where: {
          userId_movieId: {
            userId,
            movieId
          }
        }
      });

      if (!rating) {
        return false;
      }

      await prisma.rating.delete({
        where: { id: rating.id }
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  private mapRatingToDto(rating: any): RatingResponseDto {
    return {
      id: rating.id,
      rating: rating.rating,
      userId: rating.userId,
      movieId: rating.movieId,
      user: {
        id: rating.user.id,
        username: rating.user.username,
        firstName: rating.user.firstName,
        lastName: rating.user.lastName,
        createdAt: rating.user.createdAt
      },
      movie: {
        id: rating.movie.id,
        title: rating.movie.title,
        description: rating.movie.description || '',
        releaseYear: rating.movie.year || 0,
        genre: rating.movie.genre ? rating.movie.genre.split(', ') : [],
        imdbId: rating.movie.imdbId,
        tmdbId: rating.movie.tmdbId?.toString(),
        createdAt: rating.movie.createdAt,
        updatedAt: rating.movie.updatedAt
      },
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt
    };
  }
}
