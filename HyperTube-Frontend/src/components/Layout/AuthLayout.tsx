import { Outlet, Link } from "react-router-dom";
import NavigationTabs from "../ui/NavigationSection";
import ScrollToTop from "@/components/ScrollToTop";
import { useEffect, useState } from "react";
import { MoviesAPI } from "@/api/MoviesApi";
import type { Movie } from "@/types/Movie";
import { motion, AnimatePresence } from "framer-motion";

const AuthLayout = () => {
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const movies = await MoviesAPI.fetchTrendingMovies();
        if (movies && movies.length > 0) {
          setHeroMovie(movies[0]);
        }
      } catch (error) {
        console.error("Failed to fetch trending movies for auth background:", error);
      }
    };
    fetchMovies();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative font-sans overflow-hidden bg-background-100">
      <ScrollToTop behavior="smooth" />
      
      {/* Dynamic Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {heroMovie?.backdrop ? (
            <motion.img
              key={heroMovie.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.5, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              src={heroMovie.backdrop.startsWith('http') ? heroMovie.backdrop : `https://image.tmdb.org/t/p/original${heroMovie.backdrop}`}
              alt="Auth background"
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
        <div className="absolute inset-0 bg-gradient-to-t from-background-100 via-background-100/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background-100/50 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,217,214,0.05)_0%,transparent_70%)] mix-blend-screen pointer-events-none" />
      </div>

      {/* Nav/Logo Overlay */}
      <div className="absolute top-0 left-0 w-full px-6 py-6 flex items-center justify-between z-50">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors backdrop-blur-md">
            <img src="/favicon.ico" alt="Logo" className="w-5 h-5" />
          </span>
          <span className="text-white/90 text-xl font-bold tracking-wide group-hover:text-white transition-colors">LeeTube</span>
        </Link>
      </div>

      <div className="bg-background-100/60 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 w-[92%] sm:w-full max-w-md sm:max-w-lg mt-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/10 to-transparent pointer-events-none rounded-3xl" />
        <div className="relative z-10">
          <NavigationTabs />
          <Outlet />
        </div>
      </div>
    </main>
  );
};

export default AuthLayout;
