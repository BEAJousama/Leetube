import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface CastSectionProps {
  cast?: any[];
  loading?: boolean;
}

const CastSection = ({ cast, loading = false }: CastSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4 bg-white/5 p-4 rounded-lg shadow-md shadow-black/20 animate-pulse">
        <div className="w-2/3 h-6 bg-white/10 rounded mb-4" />
        <div className="flex flex-wrap gap-2 max-w-screen">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="group relative flex flex-row gap-3 bg-white/10 rounded-lg p-2 w-[160px] sm:w-[200px] items-center flex-shrink-0"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex-shrink-0" />
              <div className="flex flex-col items-start gap-1.5 flex-1 min-w-0">
                <div className="w-full h-4 bg-white/20 rounded" />
                <div className="w-3/4 h-3 bg-white/20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!cast || cast.length === 0) return null;
  const searchActorMovies = (name: string) => {
    navigate(`/search?q=${name}&by=cast`);
  };

  return (
    <div className="space-y-4 bg-white/5 p-4 rounded-lg shadow-md shadow-black/20">
      <h2 className="text-2xl font-semibold text-white mb-4">
        {t("MoviePage.cast")}
      </h2>
      <div className="flex flex-wrap gap-2 max-w-screen">
        {cast.map((actor, index) => {
          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            actor.name,
          )}&background=08d9d690&color=ffffff&size=128&bold=true`;
          return (
            <div
              onClick={() => searchActorMovies(actor.name)}
              key={index}
              className="group relative flex flex-row gap-3 bg-white/5 rounded-lg p-2 w-[160px] sm:w-[200px] items-center flex-shrink-0 shadow-md shadow-black/20 cursor-pointer hover:bg-white/10 hover:scale-[1.02] transition-all"
            >
              <img
                src={actor.image ? actor.image : avatarUrl}
                alt={actor.name}
                loading="lazy"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-0 group-hover:ring-2 ring-primary-100/50 transition-all"
              />
              <div className="flex flex-col items-start flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate w-full text-left">
                  {actor.name}
                </p>
                <p className="text-primary-100/70 text-xs truncate w-full text-left mt-0.5">
                  {actor.character}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CastSection;
