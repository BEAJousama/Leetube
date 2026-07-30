import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hypertube API',
      version: '1.0.0',
      description: 'Netflix-like movie streaming platform API',
      contact: {
        name: 'Hypertube Team',
        email: 'support@hypertube.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.hypertube.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'jwt',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              example: 'Error details',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'user-123',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            username: {
              type: 'string',
              example: 'johndoe',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            avatar: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/avatar.jpg',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Movie: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'movie-123',
            },
            tmdbId: {
              type: 'number',
              example: 550,
            },
            imdbId: {
              type: 'string',
              nullable: true,
              example: 'tt0111161',
            },
            title: {
              type: 'string',
              example: 'The Shawshank Redemption',
            },
            originalTitle: {
              type: 'string',
              example: 'The Shawshank Redemption',
            },
            description: {
              type: 'string',
              example: 'Two imprisoned men bond over a number of years...',
            },
            releaseYear: {
              type: 'number',
              example: 1994,
            },
            runtime: {
              type: 'number',
              nullable: true,
              example: 142,
            },
            genres: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['Drama', 'Crime'],
            },
            director: {
              type: 'string',
              nullable: true,
              example: 'Frank Darabont',
            },
            cast: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'Tim Robbins'
                  },
                  character: {
                    type: 'string',
                    example: 'Andy Dufresne'
                  },
                  image: {
                    type: 'string',
                    nullable: true,
                    example: 'https://image.tmdb.org/t/p/w300/profile.jpg'
                  }
                }
              },
              example: [
                {
                  name: 'Tim Robbins',
                  character: 'Andy Dufresne',
                  image: 'https://image.tmdb.org/t/p/w300/profile.jpg'
                },
                {
                  name: 'Morgan Freeman',
                  character: 'Ellis Boyd \'Red\' Redding',
                  image: 'https://image.tmdb.org/t/p/w300/profile2.jpg'
                }
              ]
            },
            poster: {
              type: 'string',
              nullable: true,
              example: 'https://image.tmdb.org/t/p/w500/poster.jpg',
            },
            backdrop: {
              type: 'string',
              nullable: true,
              example: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
            },
            rating: {
              type: 'number',
              example: 9.3,
            },
            voteCount: {
              type: 'number',
              example: 2343110,
            },
            popularity: {
              type: 'number',
              example: 6.741,
            },
            language: {
              type: 'string',
              example: 'en',
            },
            status: {
              type: 'string',
              nullable: true,
              example: 'Released',
            },
            tagline: {
              type: 'string',
              nullable: true,
              example: 'Fear can hold you prisoner. Hope can set you free.',
            },
            budget: {
              type: 'number',
              nullable: true,
              example: 25000000,
            },
            revenue: {
              type: 'number',
              nullable: true,
              example: 28341469,
            },
            homepage: {
              type: 'string',
              nullable: true,
              example: 'https://www.warnerbros.com/movies/shawshank-redemption',
            },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'comment-123',
            },
            content: {
              type: 'string',
              example: 'Great movie!',
            },
            userId: {
              type: 'string',
              example: 'user-123',
            },
            movieId: {
              type: 'string',
              example: 'movie-123',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, '../modules/auth.routes.ts'),
    path.join(__dirname, '../modules/user.routes.ts'),
    path.join(__dirname, '../modules/movie.routes.ts'),
    path.join(__dirname, '../modules/comment.routes.ts'),
    path.join(__dirname, '../modules/torrent.routes.ts'),
  ],
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };
