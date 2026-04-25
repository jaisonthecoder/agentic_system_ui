"""Rewrite AgentsView.module.scss — fix card layout + full tabbed modal classes."""
import os
BASE = os.path.dirname(os.path.abspath(__file__))

path = os.path.join(BASE, 'src/components/Agents/AgentsView.module.scss')
with open(path, 'w', encoding='utf-8') as f:
    f.write("""
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

// AgentsView — grid card layout + tabbed config modal

// ── Page wrapper ─────────────────────────────────────────────────────────────
.wrap {
  display: flex; flex-direction: column; height: 100%;
  overflow: hidden; background: var(--bg);
}

// ── Header bar ───────────────────────────────────────────────────────────────
.header {
  display: flex; align-items: center; gap: 14px; padding: 18px 36px;
  box-shadow: inset 0 -1px 0 var(--hairline); flex-shrink: 0; background: var(--bg-elev);
}
.title {
  font-family: $font-display; font-style: italic; font-size: $text-2xl;
  color: var(--text); letter-spacing: -0.02em; flex: 1;
}
.addBtn { @include atelier-btn(primary, sm); }

// ── Agent cards grid — IS the scroll container ────────────────────────────────
.grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--grid-gap);
  padding: 28px 36px 48px;
  align-content: start;
  @include custom-scrollbar;
}

// ── Agent card ────────────────────────────────────────────────────────────────
.card {
  background: var(--bg-elev);
  border: 1px solid var(--hairline);
  border-radius: $radius-md;
  padding: var(--card-pad);
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  // no overflow:hidden — that was clipping content
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-spring), transform 0.2s var(--ease-spring);
  color: var(--text); // explicit so card text is never invisible
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
}

.iconBox {
  width: 46px; height: 46px; border-radius: $radius-md;
  display: grid; place-items: center; font-size: 20px; flex-shrink: 0;
}

.cardName {
  font-family: $font-display; font-style: italic; font-size: $text-xl;
  color: var(--text); letter-spacing: -0.015em;
  margin-bottom: 2px;
}
.archTag {
  font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase; opacity: 0.9;
}
.cardDesc {
  font-size: $text-sm; color: var(--text-2); line-height: 1.5; flex: 1;
}
.skillChips { display: flex; flex-wrap: wrap; gap: 4px; }
.chip {
  padding: 2px 8px; border-radius: $radius-full; font-size: 10px;
  border: 1px solid var(--hairline-strong); color: var(--text-3);
  font-family: $font-mono;
}
.cardFooter {
  display: flex; gap: 8px; margin-top: auto; padding-top: 10px;
  box-shadow: inset 0 1px 0 var(--hairline);
}
.runBtn { @include atelier-btn(primary, sm); flex: 1; justify-content: center; }
.cfgBtn { @include atelier-btn(secondary, sm); }

// ── Empty/loading state ───────────────────────────────────────────────────────
.empty {
  @include empty-state;
  grid-column: 1 / -1; // span all grid columns
}
.emptyIcon { font-size: 36px; opacity: 0.4; margin-bottom: 6px; }

// ── Run history drawer ────────────────────────────────────────────────────────
.drawer {
  position: fixed; right: 0; top: 0; bottom: 0; width: 360px;
  background: var(--bg-elev); border-left: 1px solid var(--hairline);
  box-shadow: var(--shadow-lg); z-index: $z-drawer;
  display: flex; flex-direction: column;
  animation: slideInRight 0.28s var(--ease-spring);
}
.drawerHeader {
  padding: 20px 22px; box-shadow: inset 0 -1px 0 var(--hairline);
  display: flex; align-items: center; gap: 12px; flex-shrink: 0;
}
.drawerTitle {
  font-family: $font-display; font-style: italic; font-size: $text-xl;
  color: var(--text); flex: 1;
}
.drawerClose {
  @include atelier-btn(ghost, sm); width: 28px; height: 28px;
  padding: 0; border-radius: $radius-full; font-size: 12px;
}
.drawerBody {
  flex: 1; min-height: 0; overflow-y: auto; padding: 20px 22px;
  @include custom-scrollbar;
}
.sectionLabel { @include eyebrow; margin-bottom: 10px; }
.sectionCard {}
.runRow {
  display: grid; grid-template-columns: 1fr auto auto;
  gap: 10px; padding: 10px 0; box-shadow: inset 0 -1px 0 var(--hairline);
}
.runGoal { font-size: $text-sm; color: var(--text-2); @include truncate; }
.runStatus { font-size: $text-xs; font-family: $font-mono; }
.runMeta { font-size: $text-xs; color: var(--text-3); font-family: $font-mono; }

// ── Modal — shared ────────────────────────────────────────────────────────────
.overlay { @include overlay; }
.modal {
  background: var(--bg-elev); border: 1px solid var(--hairline);
  border-radius: $radius-lg; width: 100%; max-width: 560px;
  box-shadow: var(--shadow-lg); animation: sheetIn 0.28s var(--ease-spring);
  display: flex; flex-direction: column;
  max-height: 92vh;
}

// Config modal header
.modalHdr {
  display: flex; align-items: center; gap: 14px; padding: 20px 24px;
  box-shadow: inset 0 -1px 0 var(--hairline); flex-shrink: 0;
}
.modalIcon {
  width: 42px; height: 42px; border-radius: $radius-md;
  display: grid; place-items: center; font-size: 20px; flex-shrink: 0;
}
.modalTitle {
  font-family: $font-display; font-style: italic; font-size: $text-2xl;
  color: var(--text); letter-spacing: -0.02em; line-height: 1;
}
.modalSub { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 3px; }
.modalClose {
  @include atelier-btn(ghost, sm); width: 28px; height: 28px;
  padding: 0; border-radius: $radius-full; margin-left: auto; font-size: 13px;
}

// Tab bar
.tabs {
  display: flex; border-bottom: 1px solid var(--hairline);
  flex-shrink: 0; padding: 0 24px;
}
.tab {
  padding: 12px 16px; font-size: $text-sm; font-weight: 500; color: var(--text-3);
  border: none; background: none; cursor: pointer;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
  &:hover { color: var(--text); }
}
.tabActive { color: var(--text); border-bottom-color: var(--accent); }

// Tab body — scrollable
.tabBody {
  flex: 1; min-height: 0; overflow-y: auto; padding: 20px 24px;
  display: flex; flex-direction: column;
  @include custom-scrollbar;
}

// Form elements inside modal
.fieldLabel { @include eyebrow; display: block; margin-bottom: 6px; margin-top: 14px; }
.input   { @include form-input; }
.textarea{ @include form-input; resize: vertical; min-height: 100px; }
.row2    { display: flex; gap: 10px; }
.iconField { flex: 0 0 64px; }

// Skills tab
.selectedSkillsBar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.clearBtn {
  @include atelier-btn(ghost, sm); font-size: $text-xs; color: var(--danger);
  height: auto; padding: 2px 8px;
  &:hover { color: var(--danger); background: color-mix(in oklab, var(--danger) 10%, transparent); }
}

.skillList {
  flex: 1; min-height: 0;
  border: 1px solid var(--hairline); border-radius: $radius-md; overflow-y: auto;
  @include custom-scrollbar;
}
.skillItem {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  border-bottom: 1px solid var(--hairline); cursor: pointer;
  transition: background 0.12s; color: var(--text);
  &:last-child { border-bottom: none; }
  &:hover { background: var(--bg-tint); }
}
.skillItemOn { background: var(--accent-soft); }
.skillCheckbox {
  width: 16px; height: 16px; border-radius: $radius-xs;
  accent-color: var(--accent); flex-shrink: 0; cursor: pointer;
}
.skillItemIcon { font-size: 16px; flex-shrink: 0; }
.skillItemBody { flex: 1; min-width: 0; }
.skillItemName {
  display: block; font-family: $font-mono; font-size: $text-sm;
  font-weight: 500; color: var(--text);
}
.skillItemDesc {
  display: block; font-size: $text-xs; color: var(--text-3);
  margin-top: 1px; @include truncate;
}
.skillItemTag {
  font-size: 10px; font-family: $font-mono; padding: 2px 7px;
  border-radius: $radius-full; border: 1px solid var(--hairline-strong);
  color: var(--text-4); white-space: nowrap;
}
.skillEmpty {
  padding: 24px; text-align: center; color: var(--text-3); font-size: $text-sm;
}

// Advanced tab
.advSection {
  background: var(--bg-elev-2); border: 1px solid var(--hairline);
  border-radius: $radius-md; padding: 16px 18px; margin-bottom: 14px;
}
.advSectionTitle {
  @include eyebrow; margin-bottom: 10px;
}
.advHint {
  font-size: $text-xs; color: var(--text-3); margin-top: 8px; line-height: 1.5;
}

// Modal footer
.modalBtns {
  display: flex; gap: 8px; justify-content: flex-end;
  padding: 16px 24px; box-shadow: inset 0 1px 0 var(--hairline); flex-shrink: 0;
}
.btnSecondary { @include atelier-btn(secondary, md); }
.btnPrimary   { @include atelier-btn(primary, md); }

// Create modal also uses .modal/.overlay + these same field classes
// Shared with create modal inline styles via style= props (no separate class needed)

// Pill badges (drawer usage)
.pill {
  display: inline-flex; align-items: center; padding: 3px 9px;
  border-radius: $radius-full; font-size: 11px; font-weight: 500;
  border: 1px solid transparent; white-space: nowrap;
}
.pillActive  { background: color-mix(in oklab, var(--success) 12%, transparent); border-color: color-mix(in oklab, var(--success) 35%, transparent); color: var(--success); }
.pillDanger  { background: color-mix(in oklab, var(--danger)  12%, transparent); border-color: color-mix(in oklab, var(--danger)  35%, transparent); color: var(--danger); }
.pillNeutral { background: transparent; border-color: var(--hairline-strong); color: var(--text-3); }
""".strip() + '\n')

print('AgentsView.module.scss written.')
