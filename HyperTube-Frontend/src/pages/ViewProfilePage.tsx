import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { User } from "@/types/Users";
import { motion } from "framer-motion";
import { CalendarDays, AtSign, Languages } from "lucide-react";
import usePageMetadata from "@/hooks/UsePageHeadTitle";
import { UsersAPI } from "@/api/UsersApi";

const shimmer =
  "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200";

function initialsOf(u: Pick<User, "firstName" | "lastName" | "username">) {
  const f = (u.firstName || "").charAt(0);
  const l = (u.lastName || "").charAt(0);
  const base = `${f}${l}`.trim();
  return base || (u.username ? u.username.charAt(0).toUpperCase() : "?");
}

const ViewProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageMetadata(user?.username ? `@${user.username}` : "Profile");

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    (async () => {
      try {
        const u = await UsersAPI.fetchUserByUsername(username);
        setUser(u);
        setError(null);
      } catch (e: any) {
        setError((e && e.message) || "User not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  const bannerStyle: React.CSSProperties = useMemo(() => {
    const src = user?.picture;
    if (src) {
      return {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.7)), url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return {
      background:
        "radial-gradient(1200px 400px at 10% 0%, rgba(59,130,246,.25), transparent 60%), radial-gradient(1000px 500px at 90% 10%, rgba(168,85,247,.2), transparent 60%), linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.65))",
    };
  }, [user?.picture]);

  if (loading) {
    return (
      <div className="min-h-[60vh]">
        <div
          className="h-56 w-full relative overflow-hidden"
          style={bannerStyle}
        >
          <div className="absolute inset-0 opacity-30" />
        </div>
        <div className="max-w-5xl mx-auto px-6 -mt-12">
          <div className="flex items-end space-x-6">
            <div className={`w-28 h-28 rounded-full ${shimmer}`} />
            <div className="flex-1">
              <div className={`h-6 w-48 rounded ${shimmer}`} />
              <div className={`mt-2 h-4 w-32 rounded ${shimmer}`} />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className={`h-20 rounded-xl ${shimmer}`} />
            <div className={`h-20 rounded-xl ${shimmer}`} />
            <div className={`h-20 rounded-xl ${shimmer}`} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">{error}</div>
          <div className="text-sm text-gray-500 mb-4">
            The profile might be private or not available yet.
          </div>
          <Link
            to="/home"
            className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pb-12">
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-56 w-full relative"
        style={bannerStyle}
      >
        <div className="absolute inset-0" />
      </motion.div>

      {/* Header card */}
      <div className="max-w-5xl mx-auto px-6 -mt-12 relative">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-5 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {user.picture ? (
                <motion.img
                  whileHover={{ scale: 1.03 }}
                  src={user.picture}
                  alt={user.username}
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-white/20"
                />
              ) : (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 grid place-items-center text-white text-2xl font-semibold ring-4 ring-white/20"
                  aria-label={user.username}
                >
                  {initialsOf(user)}
                </motion.div>
              )}

              <div>
                <div className="text-2xl font-semibold">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-300 flex items-center gap-2">
                  <AtSign size={16} />
                  <span>{user.username}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Username */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">
              Username
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <AtSign size={16} />
              <span className="font-medium">{user.username}</span>
            </div>
          </div>

          {/* Member since */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">
              Member since
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <CalendarDays size={16} />
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Preferred language (if any) */}
          {user.preferredLanguage && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Language
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <Languages size={16} />
                <span className="uppercase">{user.preferredLanguage}</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ViewProfilePage;
