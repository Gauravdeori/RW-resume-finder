import { useEffect, useState } from 'react';

/** Pages reachable from the top bar. Hash routes work on any static host (Vercel, Netlify) without rewrites. */
export type Route = 'search' | 'upload' | 'dashboard' | 'admin';

const ROUTES: Route[] = ['search', 'upload', 'dashboard', 'admin'];

function parse(hash: string): Route {
  const r = hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(r) ? r : 'search';
}

export const hrefFor = (r: Route) => `#/${r}`;

export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));

  useEffect(() => {
    const onHash = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (r: Route) => {
    if (parse(window.location.hash) === r) return;
    window.location.hash = hrefFor(r);
  };
  return [route, go];
}
