"use client";

import "highlight.js/styles/atom-one-dark.min.css";
import "./markdown.css";

import React from "react";

import { createMarkdownRenderer } from "./utils";

export default function Markdown({ content }: { content: string }) {
  const md = createMarkdownRenderer();
  const renderedMarkdown = md.render(content);

  return (
    <div
      className="markdown max-w-full"
      dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
    />
  );
}
