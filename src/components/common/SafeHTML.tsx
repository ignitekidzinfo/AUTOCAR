import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHTMLProps {
  html: string;
  className?: string;
  options?: DOMPurify.Config;
}

/**
 * A component that safely renders HTML content
 * Uses DOMPurify to sanitize HTML and prevent XSS attacks
 */
const SafeHTML: React.FC<SafeHTMLProps> = ({ html, className, options = {} }) => {
  // Configure default sanitization options
  const defaultOptions: DOMPurify.Config = {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'eval'],
    USE_PROFILES: { html: true },
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    ...options,
  };

  // Sanitize the HTML
  const sanitizedHTML = DOMPurify.sanitize(html, defaultOptions);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }} 
    />
  );
};

export default SafeHTML; 