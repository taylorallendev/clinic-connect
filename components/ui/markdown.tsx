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
          // Headers
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

          // Basic text elements
          p: ({ node, ...props }) => (
            <p className="text-foreground my-2" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="text-foreground font-bold" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="text-foreground italic" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-muted pl-4 italic text-foreground my-4"
              {...props}
            />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul className="text-foreground list-disc pl-6 my-4" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="text-foreground list-decimal pl-6 my-4" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-foreground my-1" {...props} />
          ),

          // Table elements
          table: ({ node, ...props }) => (
            <table
              className="text-foreground border-collapse my-4 w-full"
              {...props}
            />
          ),
          thead: ({ node, ...props }) => (
            <thead className="text-foreground bg-muted" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="text-foreground" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="text-foreground border-b border-muted" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="text-foreground p-2 text-left font-bold"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="text-foreground p-2" {...props} />
          ),

          // Links
          a: ({ node, ...props }) => (
            <a className="text-primary hover:underline" {...props} />
          ),

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="border-muted my-6" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
