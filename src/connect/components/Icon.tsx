const P: Record<string, string> = {
  chat: '<path d="M4 4h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H9l-3 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M16 8h4a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2v3l-3-3h-4a1 1 0 0 1-1-1v-1"/>',
  expand: '<path d="M4 9V4h5"/><path d="M4 4l6 6"/><path d="M20 9V4h-5"/><path d="M20 4l-6 6"/><path d="M4 15v5h5"/><path d="M4 20l6-6"/><path d="M20 15v5h-5"/><path d="M20 20l-6-6"/>',
  collapse: '<path d="M14 4v6h6"/><path d="M14 10l7-7"/><path d="M10 20v-6H4"/><path d="M10 14l-7 7"/>',
  send: '<path d="M4 4l17 8-17 8 3-8z"/><path d="M7 12h8"/>',
  share: '<path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  left: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
  right: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  x: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  upright: '<path d="M7 17L17 7"/><path d="M8 7h9v9"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  userplus: '<circle cx="9" cy="8" r="4"/><path d="M2 21c1-4 3.6-6 7-6s6 2 7 6"/><path d="M19 8v6"/><path d="M16 11h6"/>',
  dots: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  belloff: '<path d="M6 8a6 6 0 0 1 9.3-5"/><path d="M18 8c0 7 3 9 3 9H9"/><path d="M6 8c0 7-3 9-3 9h3"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/><path d="M3 3l18 18"/>',
  leave: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.8c1.8.7 3 2.5 3.5 5.2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 8v5"/><path d="M12 16h.01"/>',
  pin: '<path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z"/><path d="M12 14v7"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  read: '<path d="M3 12.5l4.5 4.5L17 7.5"/><path d="M10 15l2 2 9.5-9.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mappin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  repeat: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
}

export function Icon({ name, size = 18, stroke = 1.8, color = 'currentColor', className }: { name: keyof typeof P | string; size?: number; stroke?: number; color?: string; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[name] ?? '' }} />
  )
}

export function Spark({ size = 16, color = 'var(--gold)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill={color} d="M10 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" />
      <path fill={color} d="M18.5 2c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5z" />
    </svg>
  )
}

export function Badge16() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="var(--gold)" d="M12 2l2.4 2.1 3.2-.4.9 3.1 2.9 1.4-1 3 1 3-2.9 1.4-.9 3.1-3.2-.4L12 22l-2.4-2.1-3.2.4-.9-3.1-2.9-1.4 1-3-1-3 2.9-1.4.9-3.1 3.2.4z" />
      <circle cx="12" cy="12" r="3.2" fill="var(--card)" />
    </svg>
  )
}
