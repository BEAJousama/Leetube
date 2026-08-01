import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Globe, Film, Star, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MoviesAPI } from "@/api/MoviesApi";
import MovieCard from "@/components/MovieCard";
import type { Movie } from "@/types/Movie";
import MovieCategories from "@/types/constants/MovieCategories";
import { AppRoutes } from "@/api/Routes";

export default function LandingPage() {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch trending movies for hero backdrop and poster showcase
    const fetchMovies = async () => {
      try {
        const movies = await MoviesAPI.fetchTrendingMovies();
        if (movies && movies.length > 0) {
          setTrendingMovies(movies);
        }
      } catch (error) {
        console.error("Failed to fetch trending movies for landing page:", error);
      }
    };
    
    fetchMovies();
  }, []);

  // Auto-cycle hero background every 7 seconds
  useEffect(() => {
    if (trendingMovies.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(5, trendingMovies.length));
    }, 7000);
    return () => clearInterval(interval);
  }, [trendingMovies]);

  const handleMovieClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(AppRoutes.LOGIN);
  };

  const heroMovie = trendingMovies[heroIndex] || null;

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans text-neutral-100 overflow-x-hidden relative">
      {/* 1. Top Nav (Public) */}
      <nav className="absolute top-0 left-0 w-full px-6 py-6 flex items-center justify-between z-50 bg-transparent">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
            <img src="/favicon.ico" alt="Logo" className="w-5 h-5" />
          </span>
          <span className="text-white/90 text-xl font-bold hidden sm:block tracking-wide">LeeTube</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={AppRoutes.LOGIN}
            className="text-sm font-medium text-white/80 hover:text-white hover:text-primary-100 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to={AppRoutes.REGISTER}
            className="text-sm font-semibold bg-primary-100 hover:bg-primary-100/90 text-background-100 px-6 py-2.5 rounded-full transition-colors duration-300"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Dynamic Cinematic Background */}
        <div className="absolute inset-0 bg-transparent z-0">
          <AnimatePresence mode="wait">
            {heroMovie?.backdrop ? (
              <motion.img
                key={heroMovie.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 0.4, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                src={heroMovie.backdrop.startsWith('http') ? heroMovie.backdrop : `https://image.tmdb.org/t/p/original${heroMovie.backdrop}`}
                alt="Hero background"
                className="w-full h-full object-cover absolute inset-0"
              />
            ) : (
              <motion.div 
                key="fallback"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full bg-gradient-to-br from-primary-100/10 to-secondary-100/10 absolute inset-0" 
              />
            )}
          </AnimatePresence>
          {/* Enhanced cinematic gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background-100 via-background-100/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background-100 via-background-100/70 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,217,214,0.05)_0%,transparent_70%)] mix-blend-screen pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-5xl w-full px-6 flex flex-col items-start gap-8 text-left mt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.05] backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-primary-100 animate-pulse" />
            <span className="text-xs font-medium text-white/70 tracking-widest uppercase">Now Available</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", damping: 20 }}
            className="text-6xl md:text-8xl font-bold text-white tracking-tighter leading-[1.05] max-w-3xl"
          >
            Stream the best movies, <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-100 via-primary-100/80 to-secondary-100">anywhere.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-2xl text-white/50 max-w-2xl font-light tracking-wide"
          >
            Enjoy thousands of high-quality movies with multi-language subtitles. Your ultimate cinematic experience awaits.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-5 mt-4 w-full sm:w-auto"
          >
            <Link
              to={AppRoutes.REGISTER}
              className="w-full sm:w-auto text-center font-bold bg-primary-100 hover:bg-primary-100/90 text-background-100 px-10 py-5 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 group"
            >
              <span>Get started for free</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              to={AppRoutes.LOGIN}
              className="w-full sm:w-auto text-center font-semibold bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-white px-10 py-5 rounded-full transition-colors duration-300 backdrop-blur-md"
            >
              I already have an account
            </Link>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-white/40 text-sm mt-2 font-light"
          >
            This project was created for <span className="text-primary-100/80 font-medium">1337 coding school / 42 network</span> educational purposes.
          </motion.p>
        </div>
      </header>

      {/* 3. Poster Showcase */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1 }}
        className="py-16 px-6 relative z-20 bg-gradient-to-b from-transparent to-background-100/50"
      >
        <div className="max-w-screen-2xl mx-auto overflow-hidden">
          <div className="flex items-center gap-3 mb-4 px-6">
            <h2 className="text-3xl font-bold text-white tracking-tight">Trending Now</h2>
            <div className="h-px bg-gradient-to-r from-primary-100/50 to-transparent flex-1 ml-4" />
          </div>
          {trendingMovies.length > 0 ? (() => {
            const baseMovies = trendingMovies.length < 7 ? [...trendingMovies, ...trendingMovies, ...trendingMovies].slice(0, 7) : trendingMovies;
            
            return (
              <div className="relative w-full py-8 pause-on-hover overflow-hidden">
                <div className="flex gap-5 w-max animate-scroll-x hover:[animation-play-state:paused]">
                  
                  {/* First Set */}
                  <div className="flex gap-5">
                    {baseMovies.map((movie, idx) => (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        key={`set1-${movie.id}-${idx}`} 
                        className="w-[160px] sm:w-[200px] md:w-[240px] flex-shrink-0 cursor-pointer group" 
                        onClick={handleMovieClick} 
                        onClickCapture={handleMovieClick}
                      >
                        <div className="pointer-events-none">
                          <LandingMovieCard movie={movie} idx={idx} />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Second identical set for seamless looping */}
                  <div className="flex gap-5">
                    {baseMovies.map((movie, idx) => (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        key={`set2-${movie.id}-${idx}`} 
                        className="w-[160px] sm:w-[200px] md:w-[240px] flex-shrink-0 cursor-pointer group" 
                        onClick={handleMovieClick} 
                        onClickCapture={handleMovieClick}
                      >
                        <div className="pointer-events-none">
                          <LandingMovieCard movie={movie} idx={idx} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                </div>
              </div>
            );
          })() : (
            <div className="flex overflow-x-hidden gap-5 py-8 px-6">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="min-w-[200px] h-[300px] bg-white/5 animate-pulse rounded-2xl flex-shrink-0" />
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* 4. Features */}
      <section className="py-32 px-6 bg-transparent relative">
        {/* Ambient background glow for bento box */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary-100/5 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-screen-xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">Everything you need.</h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto font-light">A platform designed to give you the best cinematic experience without compromise.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
            <FeatureCard
              className="md:col-span-2"
              delay={0}
              icon={<Film className="w-7 h-7 text-primary-100" />}
              title="Massive Library"
              description="Browse thousands of trending and classic movies in high quality, updated daily to keep you entertained."
            />
            <FeatureCard
              className="md:col-span-1"
              delay={0.2}
              icon={<Globe className="w-7 h-7 text-primary-100" />}
              title="Multilingual"
              description="Watch movies with translated subtitles perfectly synced."
            />
            <FeatureCard
              className="md:col-span-1"
              delay={0.3}
              icon={<Star className="w-7 h-7 text-secondary-100" />}
              title="Curated Favorites"
              description="Build your personal watchlist and save your favorites."
            />
            <FeatureCard
              className="md:col-span-2"
              delay={0.4}
              icon={<Play className="w-7 h-7 text-primary-100" />}
              title="Instant Streaming"
              description="Start watching immediately without waiting for downloads to finish. Our adaptive streaming engine ensures no buffering."
            />
          </div>
        </div>
      </section>

      {/* 5. Genre Strip */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-16 px-6 overflow-hidden bg-transparent"
      >
        <div className="max-w-screen-2xl mx-auto text-center mb-10">
          <h3 className="text-sm font-bold tracking-[0.2em] text-white/40 uppercase">Explore Countless Genres</h3>
        </div>
        <div className="max-w-screen-2xl mx-auto relative overflow-hidden pause-on-hover py-4">
          <div className="flex gap-5 w-max animate-scroll-x hover:[animation-play-state:paused]">
            {/* First Set */}
            <div className="flex gap-5">
              {MovieCategories.slice(1).map((category) => (
                <div
                  key={`cat1-${category}`}
                  className="px-8 py-3.5 rounded-full bg-white/[0.02] backdrop-blur-md border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.1] hover:text-white text-white/60 font-medium whitespace-nowrap cursor-pointer transition-colors duration-300"
                  onClick={handleMovieClick}
                >
                  {category}
                </div>
              ))}
            </div>
            
            {/* Second identical set for seamless looping */}
            <div className="flex gap-5">
              {MovieCategories.slice(1).map((category) => (
                <div
                  key={`cat2-${category}`}
                  className="px-8 py-3.5 rounded-full bg-white/[0.02] backdrop-blur-md border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.1] hover:text-white text-white/60 font-medium whitespace-nowrap cursor-pointer transition-colors duration-300"
                  onClick={handleMovieClick}
                >
                  {category}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 6. CTA Band */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-32 px-6 text-center flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-background-100/90 relative"
      >
        {/* Glow effect behind CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary-100/20 blur-[100px] rounded-full pointer-events-none" />
        
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight relative z-10">Ready to start watching?</h2>
        <p className="text-lg text-neutral-100/70 mb-10 max-w-xl relative z-10 font-light">
          Join LeeTube today and unlock unlimited access to our entire streaming catalog, with no hidden fees.
        </p>
        <Link
          to={AppRoutes.REGISTER}
          className="font-bold text-lg bg-primary-100 hover:bg-primary-100/90 text-background-100 px-12 py-5 rounded-full transition-colors duration-300 relative z-10"
        >
          Create your free account
        </Link>
      </motion.section>

      {/* 7. Footer */}
      <footer className="py-12 px-6 border-t border-white/[0.05] relative z-10 flex flex-col items-center justify-center text-center">
        <p className="text-white/40 text-sm font-light mb-2">
          This project was created for <span className="text-primary-100/80 font-medium">1337 coding school / 42 network</span> educational purposes.
        </p>
        <p className="text-white/30 text-xs font-light">
          &copy; {new Date().getFullYear()} LeeTube. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay, className = "" }: { icon: React.ReactNode; title: string; description: string; delay: number; className?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: delay * 0.5, ease: "easeOut" }}
      whileHover={{ y: -5 }}
      className={`relative overflow-hidden bg-white/[0.02] border border-white/[0.05] p-8 rounded-[2rem] hover:bg-white/[0.05] hover:border-white/[0.1] hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all duration-300 group ${className}`}
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-auto border border-white/[0.05] shadow-sm">
          {icon}
        </div>
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{title}</h3>
          <p className="text-white/50 text-base leading-relaxed font-light">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function LandingMovieCard({ movie }: { movie: Movie; idx: number }) {
  return (
    <div className="w-full text-left bg-transparent p-0 rounded-2xl group">
      {/* Poster */}
      <div className="relative mb-3">
        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-900 shadow-lg group-hover:shadow-[0_0_20px_rgba(8,217,214,0.3)] transition-all duration-300 ring-1 ring-transparent group-hover:ring-primary-100/50">
          <img
            src={movie.poster ?? "/poster-placeholder.png"}
            alt={`Poster of ${movie.title}`}
            draggable={false}
            className="w-full h-full object-cover transition-transform duration-500 ease-out"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (!target.src.endsWith("/poster-placeholder.png")) {
                target.src = "/poster-placeholder.png";
              }
            }}
          />

          {/* Glassy hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="
          absolute inset-0 bg-white/10 backdrop-blur-[2px] rounded-2xl
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300 ease-in-out
          "
            />
            <div
              className="
          relative z-10 w-16 h-16 bg-secondary-100/90 backdrop-blur-xl
          rounded-full flex items-center justify-center shadow-lg
          border-2 border-primary-100
          opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100
          transition-all duration-300 ease-in-out
          "
              aria-hidden="true"
            >
              <Play className="w-7 h-7 text-white fill-primary-100/90" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="z-0 w-16 h-16 rounded-full border-2 border-secondary-100/70 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Movie Info */}
      <div className="px-1 mt-2">
        <h3
          className="font-bold text-lg text-white mb-1 truncate group-hover:text-primary-100 transition-colors duration-300"
          title={movie.title}
        >
          {movie.title}
        </h3>

        <div className="flex items-center gap-3 text-sm text-white/50">
          {movie.releaseYear && <span>{movie.releaseYear}</span>}
          <span className="select-none text-white/20">•</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary-100 text-primary-100" />
            <span className="text-white/80 font-medium">
              {Number.isFinite(Number(movie.rating))
                ? Number(movie.rating).toFixed(1)
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
