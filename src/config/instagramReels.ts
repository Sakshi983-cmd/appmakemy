/**
 * Instagram Reels configuration for the homepage 3x3 grid.
 *
 * You have 2 options — pick ONE:
 *
 * OPTION A (recommended for production):
 *   Paste a 3rd-party social-feed widget embed (Elfsight, Curator.io, Behold.so, EmbedSocial, etc.)
 *   into `WIDGET_EMBED_HTML`. When this is non-empty, the whole 3x3 grid is replaced
 *   by that widget (the widget renders its own grid).
 *
 *   Example (Elfsight):
 *     WIDGET_EMBED_HTML: `<div class="elfsight-app-XXXX-XXXX" data-elfsight-app-lazy></div>
 *                         <script src="https://static.elfsight.com/platform/platform.js" async></script>`
 *
 * OPTION B (manual — quick start):
 *   Leave WIDGET_EMBED_HTML empty and paste up to 9 Instagram Reel/Post URLs in REEL_URLS.
 *   Each will render as a native Instagram embed iframe.
 *
 *   To get a reel URL: open the reel on instagram.com → copy the URL from the address bar.
 *   Example: "https://www.instagram.com/reel/CxxxxxxxXxx/"
 */

export const INSTAGRAM_PROFILE_URL = "https://instagram.com/makemyapp.co";
export const INSTAGRAM_HANDLE = "@makemyapp.co";

export const WIDGET_EMBED_HTML = ``;

export const REEL_URLS: string[] = [
  "https://www.instagram.com/reel/DRXGWXtgYZz/",
  "https://www.instagram.com/reel/DSCjKjBgW4U/",
];
