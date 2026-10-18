import './site-nav.css';

export default function SiteNav({active}: {active: 'dashboard' | 'heatmap'}) {
  return <nav className="site-nav" aria-label="Pito views">
    <span className="site-nav-brand">Pito <small>by If</small></span>
    <a href="./" aria-current={active === 'dashboard' ? 'page' : undefined}>If dashboard</a>
    <a href="demo.html#heatmap" aria-current={active === 'heatmap' ? 'page' : undefined}>Heatmap visualisation</a>
  </nav>;
}
