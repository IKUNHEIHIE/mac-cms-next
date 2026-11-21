export default function ThemeRem() {
  const script = `(function(){var d=document.documentElement;function r(){var w=d.clientWidth||window.innerWidth||375;d.style.fontSize=(Math.min(w,768)/10)+'px';}r();window.addEventListener('resize',r);window.addEventListener('pageshow',function(e){if(e.persisted)r();});})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}