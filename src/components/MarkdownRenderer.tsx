import React from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Configure marked options for security and functionality
  marked.setOptions({
    breaks: true, // Convert line breaks to <br>
    gfm: true, // GitHub Flavored Markdown
    headerIds: true, // Add IDs to headers for navigation
    mangle: false, // Don't mangle email addresses
  });

  // Convert markdown to HTML
  const htmlContent = marked(content);

  return (
    <div 
      className={`prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-code:text-primary prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-ul:text-muted-foreground prose-ol:text-muted-foreground prose-li:text-muted-foreground prose-hr:border-border max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownRenderer;
