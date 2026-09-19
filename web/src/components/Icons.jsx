// Иконки — рукописные SVG, stroke 2, 24×24. Иконки категорий — по ключу категории.

const PATHS = {
  home: <><path d="M4 11.5 12 4l8 7.5" /><path d="M6.5 9.8V20h11V9.8" /><path d="M10 20v-5h4v5" /></>,
  list: <><path d="M4 7h3M4 12h3M4 17h3" /><path d="M10 7h10M10 12h10M10 17h10" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <><path d="M6 12h12" /></>,
  sparkle: <><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  camera: <><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.4-2h5.2L16 7h2.5A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" /><circle cx="12" cy="13" r="3.5" /></>,
  image: <><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m4 17 5-5 4 4 2-2 5 5" /></>,
  back: <><path d="m14 6-6 6 6 6" /></>,
  forward: <><path d="m10 6 6 6-6 6" /></>,
  trash: <><path d="M5 7h14" /><path d="M9 7V5h6v2" /><path d="M7 7l.8 12h8.4L17 7" /><path d="M10 11v5M14 11v5" /></>,
  check: <><path d="m5 12.5 4.5 4.5L19 8" /></>,
  alert: <><path d="M12 4 3 20h18z" /><path d="M12 10v4M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
  x: <><path d="m6 6 12 12M18 6 6 18" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></>,
  share: <><path d="M12 4v11" /><path d="m8 8 4-4 4 4" /><path d="M5 13v6h14v-6" /></>,
  cart: <><path d="M3 5h2l2.4 10h10.2L20 8H7" /><circle cx="9" cy="19" r="1.3" /><circle cx="16.5" cy="19" r="1.3" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  pill: <><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)" /><path d="m10.4 8.2 3.2 7.6" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1.2 1.2" /><path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1.2-1.2" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  wifiOff: <><path d="m3 3 18 18" /><path d="M8.5 16.5a5 5 0 0 1 7 0" /><path d="M5 13a10 10 0 0 1 4.4-2.6M14.6 10.4A10 10 0 0 1 19 13" /><path d="M2 9.5a14 14 0 0 1 5-3M17 6.5a14 14 0 0 1 5 3" /><path d="M12 20h.01" /></>,
}

const CATEGORY_PATHS = {
  fever: <><path d="M10 4a2 2 0 0 1 4 0v9.3a4 4 0 1 1-4 0z" /><path d="M12 9v6" /></>,
  cold: <><path d="M5 10h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" /><path d="M16 12h2a2 2 0 0 1 0 4h-2" /><path d="M8.5 3c0 1.6 1 1.6 1 3.2M12.5 3c0 1.6 1 1.6 1 3.2" /></>,
  stomach: <><path d="M9 3v3.5A3.5 3.5 0 0 0 12.5 10H14a5 5 0 0 1 0 10h-3.5A5.5 5.5 0 0 1 5 14.5V13" /><path d="M13 3v3" /></>,
  allergy: <><ellipse cx="12" cy="6.5" rx="2.5" ry="3.5" /><ellipse cx="12" cy="17.5" rx="2.5" ry="3.5" /><ellipse cx="6.5" cy="12" rx="3.5" ry="2.5" /><ellipse cx="17.5" cy="12" rx="3.5" ry="2.5" /><circle cx="12" cy="12" r="2" /></>,
  skin: <><rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)" /><path d="M11 11h.01M13 13h.01M13 11h.01M11 13h.01" /></>,
  heart: <><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /><path d="M6.5 12h3l1.5-3 2 6 1.5-3h3" /></>,
  kids: <><circle cx="12" cy="13" r="7" /><path d="M9.5 14.8c.8.9 1.6 1.4 2.5 1.4s1.7-.5 2.5-1.4" /><path d="M12 6c0-2 1.5-3 3-2.5" /><path d="M9.8 12h.01M14.2 12h.01" /></>,
  other: <><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)" /><path d="m10.4 8.2 3.2 7.6" /></>,
}

export function Icon({ name, size = 24, strokeWidth = 2, className = '', ...rest }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" className={className} {...rest}
    >
      {PATHS[name] || PATHS.info}
    </svg>
  )
}

export function CategoryIcon({ catKey, size = 28, strokeWidth = 1.9, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" className={className}
    >
      {CATEGORY_PATHS[catKey] || CATEGORY_PATHS.other}
    </svg>
  )
}
