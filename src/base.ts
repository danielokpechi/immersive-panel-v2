// Site root with a trailing slash ('/' locally, '/immersive-panel-v2/arsenal/' on
// GitHub Pages). Use it for public/ files and iframe srcs, which Next does not
// prefix with basePath on its own.
export const BASE = (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/';
