"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "markdown-content prose dark:prose-invert max-w-none",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-foreground font-bold text-2xl my-4"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-foreground font-bold text-xl my-3" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-foreground font-bold text-lg my-2" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className="text-foreground font-bold text-base my-2"
              {...props}
            />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-foreground font-bold text-sm my-1" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-foreground font-bold text-xs my-1" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-primary hover:underline" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
