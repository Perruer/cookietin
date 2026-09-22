/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
/** Inline SVG icons (stroke = currentColor), so no icon font or network. */
import type { ComponentChildren } from "preact";

const Svg = (props: { children: ComponentChildren; fill?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={props.fill ? "currentColor" : "none"} stroke={props.fill ? "none" : "currentColor"}
    stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    {props.children}
  </svg>
);

export const TrashIcon = () => (
  <Svg>
    <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </Svg>
);

export const LockIcon = () => (
  <Svg>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const UnlockIcon = () => (
  <Svg>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 7.5-2" />
  </Svg>
);

export const PlusIcon = () => (
  <Svg>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const SaveIcon = () => (
  <Svg>
    <path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
    <path d="M8 4v5h7V4M8 20v-6h8v6" />
  </Svg>
);

export const CopyIcon = () => (
  <Svg>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Svg>
);

export const DownloadIcon = () => (
  <Svg>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Svg>
);

export const UploadIcon = () => (
  <Svg>
    <path d="M12 16V5M7 10l5-5 5 5M5 20h14" />
  </Svg>
);

export const RefreshIcon = () => (
  <Svg>
    <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />
  </Svg>
);

export const GearIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Svg>
);

export const HeartIcon = () => (
  <Svg>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </Svg>
);

export const SearchIcon = () => (
  <Svg>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4.5-4.5" />
  </Svg>
);

export const WindowIcon = () => (
  <Svg>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18" />
  </Svg>
);

export const BroomIcon = () => (
  <Svg>
    <path d="M14 4l6 6M13 11l-7 7a2 2 0 0 1-3-3l7-7M9 9l6 6M16 13l3 7h-9" />
  </Svg>
);

export const DuplicateIcon = () => (
  <Svg>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M14 11v6M11 14h6" />
  </Svg>
);

export const ContainerIcon = () => (
  <Svg>
    <path d="M4 8l8-4 8 4-8 4zM4 8v8l8 4 8-4V8M12 12v8" />
  </Svg>
);

export const CloseIcon = () => (
  <Svg>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

/** A frame inside a page: a cookie stored for an embedding site. */
export const EmbedIcon = () => (
  <Svg>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <rect x="11" y="10" width="7" height="6" rx="1" />
  </Svg>
);

/** CookieTin mark: a round tin with a cookie on the lid. */
export const TinMark = ({ size = 24 }: { size?: number }) => (
  <img src="/icons/icon.svg" width={size} height={size} alt="" />
);
