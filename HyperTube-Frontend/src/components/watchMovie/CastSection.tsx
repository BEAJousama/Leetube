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
              className="group relative flex flex-row gap-2 bg-white/10 rounded-lg p-2 w-[135px] sm:w-[160px] items-center flex-shrink-0"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 mb-2" />
              <div className="flex flex-col items-start gap-1">
                <div className="w-16 h-4 bg-white/20 rounded" />
                <div className="w-12 h-3 bg-white/20 rounded" />
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
              className="group relative flex flex-row gap-2 bg-white/5 rounded-lg p-2 w-[135px] sm:w-[160px] text-center items-center text-nowrap text-ellipsis overflow-hidden flex-shrink-0 shadow-md shadow-black/20 cursor-pointer hover:bg-white/10 hover:scale-102 transition"
            >
              <img
                src={actor.image ? actor.image : avatarUrl}
                alt={actor.name}
                loading="lazy"
                className="w-10 h-10 rounded-full object-cover mb-2 ring-0 ring-secondary-100/90"
              />
              <div className="flex flex-col items-start">
                <p className="text-white text-sm line-clamp-1 overflow-hidden text-ellipsis">
                  {actor.name}
                </p>
                <p className="text-primary-100/70 text-sm line-clamp-1 overflow-hidden text-ellipsis">
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
