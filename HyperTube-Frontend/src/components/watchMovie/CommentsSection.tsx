import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  type AddCommentRequest,
  type EditCommentRequest,
} from "@/api/CommentApi";
import {
  useAddComment,
  useDeleteComment,
  useEditComment,
  useComments,
} from "@/hooks/UseCommentsQuery";
import { type Comment } from "@/types/Comment";
import {
  MessageCircle,
  Send,
  Edit3,
  Trash2,
  User,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Helper: Format time ago
function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// Subcomponent: Add Comment Form
function AddCommentForm({
  user,
  message,
  setMessage,
  addComment,
  isPending,
  t,
  handleKeyPress,
}: any) {
  if (!user) return null;
  return (
    <div className="bg-white/5  shadow-md rounded-lg p-4 mb-6 w-[90%] mx-auto">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-transparent flex-shrink-0">
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-4 h-4 text-white/70" />
            </div>
          )}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => handleKeyPress(e, addComment)}
            placeholder={t("MoviePage.writeYourComment")}
            className="flex-1  border-b border-white/20 rounded-t w-[60%] px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-0 focus:ring-white/30 focus:border-white/30"
          />
          <button
            onClick={addComment}
            disabled={!message.trim() || isPending}
            className="px-4 py-2 bg-white/10 hover:bg-secondary-100/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-100 text-sm rounded transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Comments List
function CommentsList({
  currentComments,
  user,
  editingId,
  editContent,
  setEditContent,
  handleKeyPress,
  saveEdit,
  cancelEdit,
  startEdit,
  removeComment,
}: any) {
  return (
    <div className="space-y-1 flex flex-col justify-center items-center">
      {currentComments.map((comment: Comment) => (
        <div
          key={comment.id}
          className="bg-white/2 py-3 px-4 rounded-lg hover:bg-white/5 transition-colors self-center w-[90%] mx-auto"
        >
          {/* Comment Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link
                to={`/profile/${encodeURIComponent(comment.user.username)}`}
                className="group"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 ring-0 group-hover:ring-1 group-hover:ring-white/20 transition">
                  {comment.user?.picture ? (
                    <img
                      src={comment.user.picture}
                      alt={comment.user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-3 h-3 text-white/70" />
                    </div>
                  )}
                </div>
              </Link>
              <Link
                to={`/profile/${encodeURIComponent(comment.user.username)}`}
                className="font-medium text-white text-sm hover:text-primary-100 transition-colors"
              >
                {comment.user.username}
              </Link>
              <span className="text-white/40 text-xs">•</span>
              <time
                className="text-white/40 text-xs"
                dateTime={comment.createdAt}
              >
                {formatTimeAgo(comment.createdAt)}
              </time>
              {comment.isEdited && (
                <>
                  <span className="text-white/40 text-xs">•</span>
                  <span className="text-white/40 text-xs italic">edited</span>
                </>
              )}
            </div>
            {/* Action Buttons */}
            {user && user.id === comment.user.id && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(comment)}
                  className="p-1 text-white/40 hover:text-white/70 transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeComment(comment.id)}
                  className="p-1 text-white/40 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          {/* Comment Content */}
          {editingId === comment.id ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, saveEdit)}
                className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={saveEdit}
                  disabled={!editContent.trim()}
                  className="flex items-center gap-1 px-2 py-1 bg-primary-100/20 hover:bg-primary-100/40 disabled:opacity-50 text-primary-400 text-xs rounded transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-white/70 text-xs rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-white/80 text-sm leading-relaxed ml-8">
              {comment.content}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Subcomponent: Pagination
function Pagination({
  totalPages,
  currentPage,
  goToPreviousPage,
  goToNextPage,
  goToPage,
}: any) {
  if (totalPages <= 1) return null;

  const getPageItems = (total: number, current: number) => {
    // Always show all pages when <= 5
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // total > 5 -> use ellipsis strategy
    const items: Array<number | "dots"> = [];

    const addRange = (start: number, end: number) => {
      for (let i = start; i <= end; i++) items.push(i);
    };

    // Always show first page
    items.push(1);

    // Case: near the start (1,2,3)
    if (current <= 3) {
      addRange(2, 4);
      items.push("dots");
      items.push(total);
      return items;
    }

    // Case: near the end (last three)
    if (current >= total - 2) {
      items.push("dots");
      addRange(total - 3, total - 1);
      items.push(total);
      return items;
    }

    // Middle case
    items.push("dots");
    addRange(current - 1, current + 1);
    items.push("dots");
    items.push(total);

    return items;
  };

  const pageItems = getPageItems(totalPages, currentPage);

  return (
    <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-white/10">
      <button
        onClick={goToPreviousPage}
        disabled={currentPage === 1}
        className="p-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-1">
        {pageItems.map((item, idx) =>
          item === "dots" ? (
            <span
              key={`dots-${idx}`}
              className="px-2 text-white/40 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => goToPage(item as number)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                item === currentPage
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              aria-current={item === currentPage ? "page" : undefined}
            >
              {item}
            </button>
          ),
        )}
      </div>
      <button
        onClick={goToNextPage}
        disabled={currentPage === totalPages}
        className="p-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function CommentsSection({ movieId }: { movieId: number }) {
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 5;
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useComments(
    String(movieId),
    currentPage,
    commentsPerPage,
  );
  const storage = localStorage.getItem("auth-storage");
  const user = storage ? JSON.parse(storage).state.user : null;
  const addCommentMutation = useAddComment();
  const editCommentMutation = useEditComment();
  const deleteCommentMutation = useDeleteComment(movieId);

  // Get comments and pagination info from current page
  const currentComments = data?.comments || [];
  const totalComments = data?.total || 0;
  const totalPages = Math.ceil(totalComments / commentsPerPage);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handlers
  const addComment = () => {
    if (!message.trim()) return;
    addCommentMutation.mutate(
      {
        movieId: String(movieId),
        content: message.trim(),
      } as AddCommentRequest,
      {
        onSuccess: () => {
          refetch();
          setMessage("");
        },
      },
    );
  };

  const removeComment = (id: string) => {
    deleteCommentMutation.mutate(id, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = () => {
    if (!editContent.trim() || !editingId) return;
    editCommentMutation.mutate(
      {
        commentId: editingId,
        content: editContent.trim(),
      } as EditCommentRequest,
      {
        onSuccess: () => {
          refetch();
          setEditingId(null);
          setEditContent("");
        },
      },
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  return (
    <section className="w-full mx-auto mt-8 flex flex-col justify-center bg-white/5 p-6 rounded-lg shadow-black/20 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-md md:text-2xl font-bold text-white">
              {t("MoviePage.comments")}
            </h2>
            <p className="text-white/50 text-sm">
              {totalComments} {totalComments === 1 ? "comment" : "comments"}
            </p>
          </div>
        </div>
      </div>
      {/* Add Comment Form */}
      <AddCommentForm
        user={user}
        message={message}
        setMessage={setMessage}
        addComment={addComment}
        isPending={addCommentMutation.isPending}
        t={t}
        handleKeyPress={handleKeyPress}
      />
      {/* Comments List */}
      {isLoading ? (
        <div className="py-8 flex flex-col gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 items-start w-[90%] mx-auto">
              {/* Avatar skeleton */}
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
              <div className="flex-1">
                {/* Username and time skeleton */}
                <div className="flex gap-2 mb-2">
                  <div className="w-20 h-4 bg-white/10 rounded animate-pulse" />
                  <div className="w-10 h-3 bg-white/10 rounded animate-pulse" />
                </div>
                {/* Comment text skeleton */}
                <div className="w-full h-4 bg-white/10 rounded animate-pulse mb-1" />
                <div className="w-2/3 h-4 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
          {/* <p className="text-white/50 text-center">{t("MoviePage.loadingComments")}</p> */}
        </div>
      ) : isError ? (
        <div className="text-center py-8">
          <p className="text-red-400">{t("MoviePage.errorLoadingComments")}</p>
        </div>
      ) : totalComments === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-white/30 mx-auto mb-2" />
          <p className="text-white/50">No comments yet</p>
          <p className="text-white/30 text-sm">
            Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <>
          <CommentsList
            currentComments={currentComments}
            user={user}
            editingId={editingId}
            editContent={editContent}
            setEditContent={setEditContent}
            handleKeyPress={handleKeyPress}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            startEdit={startEdit}
            removeComment={removeComment}
          />
          {/* Pagination */}
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            goToPreviousPage={goToPreviousPage}
            goToNextPage={goToNextPage}
            goToPage={goToPage}
          />
        </>
      )}
    </section>
  );
}
