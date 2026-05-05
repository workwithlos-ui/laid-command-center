// Simple markdown-to-HTML renderer for **bold**, *italic*, `code`, lists, and line breaks
export function renderMarkdown(text: string): string {
  if (!text) return '';

  let html = text
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks ```...```
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
    // Inline code `text`
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Bold **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Numbered lists (1. item)
    .replace(/^(\d+)\.\s+(.+)$/gm, '<li class="numbered"><span class="num">$1.</span> $2</li>')
    // Bullet lists (- item or * item at start of line after indent)
    .replace(/^[-*]\s+(.+)$/gm, '<li class="bullet">$1</li>')
    // Headers ## text
    .replace(/^#{2,4}\s+(.+)$/gm, '<h4 class="md-header">$1</h4>')
    // Horizontal rules
    .replace(/^---+/gm, '<hr class="md-hr" />')
    // Line breaks
    .replace(/\n/g, '<br />');

  // Wrap consecutive list items in <ol> or <ul>
  html = html.replace(/(<li class="numbered">.*?<\/li>)(<br \/>)?/g, '$1');
  html = html.replace(/(<li class="bullet">.*?<\/li>)(<br \/>)?/g, '$1');

  return html;
}
