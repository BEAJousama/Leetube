import React from "react";

type Props = {
  tags: string[];
};

function TagsBar({ tags }: Props) {
  if (!tags?.length) return null;
  return (
    <div className="absolute top-6 left-6 flex gap-2 flex-wrap z-50">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-sm text-white shadow-sm"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export default React.memo(TagsBar);
