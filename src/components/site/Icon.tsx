export default function Icon({ code, className = "" }: { code: number; className?: string }) {
  return <i className={`iconfont ${className}`.trim()}>{String.fromCharCode(code)}</i>;
}