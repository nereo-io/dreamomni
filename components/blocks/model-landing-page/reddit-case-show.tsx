"use client";
import React from "react";

interface RedditPostProps {
  width: string;
  height: string;
  imageUrl: string;
  postId?: string;
}

interface RedditPost {
  id?: string;
  width: string;
  height: string;
  src: string;
}

interface RedditCasesSection {
  title: string;
  posts: RedditPost[];
}

interface RedditCaseShowProps {
  section: RedditCasesSection;
}

const RedditPost: React.FC<RedditPostProps> = ({
  width,
  height,
  imageUrl,
  postId,
}) => {
  return (
    <div className="mb-6 break-inside-avoid">
      <iframe
        src={imageUrl}
        width={width}
        height={height}
        className="w-full object-cover border-0 rounded-lg shadow-lg"
        loading="lazy"
        title={
          postId || `Reddit Post ${Math.random().toString(36).substr(2, 9)}`
        }
      />
    </div>
  );
};

export default function RedditCaseShow({ section }: RedditCaseShowProps) {
  return (
    <div className="w-full py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-8">{section.title}</h2>
        {/* 使用CSS columns实现瀑布流布局 */}
        <div className="columns-1 sm:columns-2 lg:columns-4 gap-6 column-fill-auto">
          {section.posts.map((post) => (
            <RedditPost
              key={post.id || `post-${Math.random().toString(36).substr(2, 9)}`}
              imageUrl={post.src}
              width={post.width}
              height={post.height}
              postId={post.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
