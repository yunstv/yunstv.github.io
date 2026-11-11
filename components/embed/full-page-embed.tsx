/**
 * Full-viewport iframe for standalone HTML pages in /public, rendered below
 * the shared SiteHeader. The `.site-embed` class switches the site shell into
 * a fixed-height, non-scrolling layout (see globals.css).
 */
export function FullPageEmbed({ src, title }: { src: string; title: string }) {
  return (
    <iframe
      className="site-embed"
      src={src}
      title={title}
      allow="fullscreen; autoplay"
      allowFullScreen
    />
  )
}
