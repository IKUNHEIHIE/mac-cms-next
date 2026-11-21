import sanitizeHtml from "sanitize-html";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img",
    "figure",
    "figcaption",
    "h1",
    "h2",
    "span",
    "div",
    "video",
    "source",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    video: ["src", "poster", "controls", "width", "height"],
    source: ["src", "type"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const next: Record<string, string> = { ...attribs, rel: "nofollow noopener noreferrer" };
      if (next.target !== "_blank") delete next.target;
      return { tagName, attribs: next };
    },
  },
};

export function safeHtml(html: string | null | undefined) {
  return sanitizeHtml(html || "", OPTIONS);
}
