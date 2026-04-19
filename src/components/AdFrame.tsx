import { useRef, useEffect } from 'react';

export default function AdFrame({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || !html) return;
    
    // Clear previous
    containerRef.current.innerHTML = '';
    
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.minHeight = '120px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    // Allow scripts and same origin execution
    iframe.sandbox.add('allow-scripts', 'allow-popups', 'allow-popups-to-escape-sandbox', 'allow-same-origin', 'allow-forms');
    
    containerRef.current.appendChild(iframe);
    
    if (iframe.contentWindow) {
      const doc = iframe.contentWindow.document;
      doc.open();
      // Ensure protocol-relative URLs (//) resolve to https:// instead of about:// or blob://
      const safeHtml = html
         .replace(/src=['"]\/\/([^'"]+)['"]/g, 'src="https://$1"')
         .replace(/href=['"]\/\/([^'"]+)['"]/g, 'href="https://$1"');
         
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <base href="https://google.com" />
            <style>
              body { margin: 0; padding: 0; overflow: hidden; display: flex; justify-content: center; align-items: center; background: transparent; }
            </style>
          </head>
          <body>${safeHtml}</body>
        </html>
      `);
      doc.close();
      
      // Attempt to auto-resize iframe based on content after a slight delay
      setTimeout(() => {
        try {
          if (iframe.contentWindow && iframe.contentWindow.document.body) {
             const height = iframe.contentWindow.document.body.scrollHeight;
             if (height > 50) {
                 iframe.style.height = height + 'px';
             }
          }
        } catch (e) {
          // Ignore cross-origin errors
          iframe.style.height = '250px'; // default fallback for typical adsterra banners
        }
      }, 1000);
    }
  }, [html]);

  return <div ref={containerRef} className="w-full flex justify-center items-center" />;
}
