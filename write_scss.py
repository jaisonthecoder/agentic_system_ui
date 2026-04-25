"""Write all Atelier SCSS module files without bash special-char issues."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

def w(rel, content):
    path = os.path.join(BASE, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  wrote {rel}')

# ─── Sidebar ──────────────────────────────────────────────────────────────────
w('src/components/Layout/Sidebar.module.scss', """
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.sidebar {
  width: 232px;
  min-width: 232px;
  background: var(--bg-elev);
  border-right: 1px solid var(--hairline);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  padding: 26px 22px;
  gap: 4px;
  flex-shrink: 0;
  @include custom-scrollbar;
  @media (max-width: 880px) { display: none; }
}

.wordmarkWrap { margin-bottom: 28px; }
.wordmark { display: flex; align-items: center; gap: 9px; }
.wordmarkIcon { position: relative; width: 20px; height: 20px; flex-shrink: 0; }
.wordmarkRing { position: absolute; inset: 0; border-radius: $radius-xs; border: 1.5px solid var(--text); }
.wordmarkDot {
  position: absolute; left: 50%; top: 50%; width: 8px; height: 8px;
  border-radius: $radius-full; background: var(--accent); transform: translate(-50%, -50%);
}
.wordmarkText {
  font-family: $font-display; font-style: italic; font-size: 18px;
  letter-spacing: -0.02em; line-height: 1; color: var(--text);
}

.sectionLabel { @include eyebrow; padding: 0 4px; margin-bottom: 6px; margin-top: 4px; }

.navItem {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 4px; width: 100%; text-align: left;
  font-size: $text-md; font-weight: 400; color: var(--text-3);
  text-decoration: none; position: relative;
  transition: color 0.15s var(--ease-out);
  border: none; background: none; cursor: pointer;
  &:hover { color: var(--text); }
}

.navItemActive {
  color: var(--text);
  .navNum { color: var(--accent); }
  &::before {
    content: ''; position: absolute; left: -22px; top: 50%;
    width: 2px; height: 14px; background: var(--accent);
    transform: translateY(-50%); border-radius: 0 1px 1px 0;
  }
}

.navNum {
  font-family: $font-display; font-style: italic; font-size: 12px;
  color: var(--text-4); min-width: 20px; transition: color 0.15s; line-height: 1;
}
.navLabel { flex: 1; line-height: 1; }
.navBadge { font-size: 11px; font-weight: 500; color: var(--text-4); font-family: $font-mono; }

.divider { height: 1px; background: var(--hairline); margin: 14px 0; }

.buildCta {
  text-align: left; padding: 10px 4px;
  font-family: $font-display; font-style: italic; font-size: 18px;
  letter-spacing: -0.01em; line-height: 1.15; color: var(--text);
  cursor: pointer; border: none; background: none;
  transition: color 0.15s;
  &:hover { color: var(--accent); }
}

.buildDesc { font-size: $text-xs; color: var(--text-3); padding: 4px 4px 0; line-height: 1.5; }

.quickSection { margin-top: 8px; display: flex; flex-direction: column; gap: 2px; }

.quickItem {
  display: flex; align-items: center; gap: 10px; padding: 7px 4px;
  font-size: $text-sm; color: var(--text-3); cursor: pointer;
  border: none; background: none; text-align: left; transition: color 0.15s;
  &:hover { color: var(--text); }
}

.quickDot {
  width: 5px; height: 5px; border-radius: $radius-full;
  background: var(--accent); flex-shrink: 0; opacity: 0.6;
}

.footer {
  margin-top: auto; padding-top: 18px; border-top: 1px solid var(--hairline);
  display: flex; align-items: center; gap: 10px;
}

.userMark {
  width: 32px; height: 32px; border-radius: $radius-md;
  background: var(--bg-elev-2); border: 1px solid var(--hairline);
  display: grid; place-items: center;
  font-family: $font-display; font-style: italic; font-size: 13px;
  color: var(--accent); flex-shrink: 0;
}

.userInfo { min-width: 0; }
.userName { font-size: $text-base; font-weight: 500; color: var(--text); @include truncate; }
.userRole { font-size: $text-xs; color: var(--text-3); margin-top: 1px; }
""".strip())

# ─── TopBar ───────────────────────────────────────────────────────────────────
w('src/components/Layout/TopBar.module.scss', """
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.topbar {
  position: sticky;
  top: 0;
  z-index: $z-topbar;
  backdrop-filter: var(--nav-blur);
  -webkit-backdrop-filter: var(--nav-blur);
  background: var(--nav-bg);
  box-shadow: inset 0 -1px 0 var(--hairline);
  flex-shrink: 0;
}

.inner {
  padding: 18px 36px 20px;
  display: flex;
  align-items: flex-end;
  gap: 24px;
}

.titleGroup { flex: 1; min-width: 0; }

.eyebrow { @include eyebrow; margin-bottom: 8px; }

.title {
  font-family: $font-display;
  font-style: italic;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--text);
}

.lede {
  font-size: $text-md;
  color: var(--text-3);
  margin-top: 10px;
  max-width: 480px;
  line-height: 1.5;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  margin-left: auto;
  padding-bottom: 2px;
}

.urlBadge {
  padding: 4px 10px;
  background: var(--bg-elev-2);
  border: 1px solid var(--hairline);
  border-radius: $radius-sm;
  font-family: $font-mono;
  font-size: $text-xs;
  color: var(--text-3);
  max-width: 160px;
  @include truncate;
}

.statusPill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: $radius-full;
  font-size: $text-xs;
  font-weight: 500;
  border: 1px solid transparent;
  white-space: nowrap;
}
.statusOnline    { background: color-mix(in oklab, var(--success) 12%, transparent); border-color: color-mix(in oklab, var(--success) 30%, transparent); color: var(--success); }
.statusOffline   { background: color-mix(in oklab, var(--danger)  12%, transparent); border-color: color-mix(in oklab, var(--danger)  30%, transparent); color: var(--danger); }
.statusConnecting{ background: color-mix(in oklab, var(--warning) 12%, transparent); border-color: color-mix(in oklab, var(--warning) 30%, transparent); color: var(--warning); }

.statusDot {
  width: 5px; height: 5px; border-radius: $radius-full;
  background: currentColor; animation: pulse 2s infinite; flex-shrink: 0;
}

.themeToggle {
  width: 34px; height: 34px; border-radius: $radius-full;
  border: 1px solid var(--hairline-strong); color: var(--text-2);
  display: grid; place-items: center; font-size: 15px;
  transition: border-color 0.15s, color 0.15s;
  &:hover { color: var(--text); border-color: var(--accent); }
}

.avatar {
  width: 34px; height: 34px; border-radius: $radius-md;
  background: var(--bg-elev-2); border: 1px solid var(--hairline);
  display: grid; place-items: center;
  font-family: $font-display; font-style: italic; font-size: 13px;
  color: var(--accent);
}
""".strip())

print('All SCSS files written.')
