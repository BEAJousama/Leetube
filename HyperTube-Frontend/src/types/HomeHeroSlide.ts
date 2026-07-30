export default interface HomeHeroSlide {
  title: string;
  duration: string;
  image: string;
  genres: string[];
  trailerUrl: string | null;
  id: string;
  inFavorite?: boolean;
}
