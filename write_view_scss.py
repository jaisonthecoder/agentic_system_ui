"""Write all view SCSS modules with Atelier design system tokens."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

def w(rel, content):
    path = os.path.join(BASE, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'  wrote {rel}')

HEADER = "@use '../../styles/variables' as *;\n@use '../../styles/mixins' as *;\n\n"
HEADER3 = "@use '../../../styles/variables' as *;\n@use '../../../styles/mixins' as *;\n\n"

# ── ChatView ────────────────────────────────────────────────────────────────────
w('src/components/Chat/ChatView.module.scss', HEADER + """
.wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: var(--bg); }

.header {
  display: flex; align-items: center; gap: 16px;
  padding: 20px 36px 18px;
  box-shadow: inset 0 -1px 0 var(--hairline);
  flex-shrink: 0; background: var(--bg-elev);
}

.agentIcon {
  width: 44px; height: 44px; border-radius: $radius-md;
  background: var(--bg-elev-2); border: 1px solid var(--hairline);
  display: grid; place-items: center;
  font-family: $font-display; font-style: italic; font-size: 18px;
  color: var(--accent); flex-shrink: 0;
}

.agentName { font-size: $text-xl; font-weight: 500; color: var(--text); letter-spacing: -0.01em; }
.agentDesc { font-size: $text-sm; color: var(--text-3); margin-top: 2px; }

.statusLabel {
  margin-left: auto; display: flex; align-items: center; gap: 6px;
  font-size: $text-xs; font-weight: 500; font-family: $font-mono;
}
.statusDot { width: 5px; height: 5px; border-radius: $radius-full; background: currentColor; }
.busy  { color: var(--warning); .statusDot { animation: pulse 1.4s infinite; } }
.ready { color: var(--success); }

.messages {
  flex: 1; overflow-y: auto; padding: 24px 36px;
  display: flex; flex-direction: column; gap: 20px;
  @include custom-scrollbar;
}

.message { display: flex; gap: 14px; animation: fadeIn 0.2s var(--ease-out); }

.user { flex-direction: row-reverse; }

.avatar {
  width: 36px; height: 36px; border-radius: $radius-md; flex-shrink: 0;
  background: var(--bg-elev-2); border: 1px solid var(--hairline);
  display: grid; place-items: center;
  font-family: $font-display; font-style: italic; font-size: 13px; color: var(--accent);
}

.msgBody { flex: 1; min-width: 0; max-width: 680px; }

.msgMeta {
  font-size: $text-xs; color: var(--text-3); margin-bottom: 6px;
  font-family: $font-mono;
}

.user .msgMeta { text-align: right; }

.bubble {
  padding: 14px 18px; border-radius: $radius-md;
  font-size: $text-base; line-height: 1.65; color: var(--text);
  border: 1px solid var(--hairline);
  background: var(--bg-elev);
  box-shadow: var(--shadow-sm);
}

.user .bubble {
  background: var(--bg-tint-2);
  border-color: var(--hairline-strong);
  border-radius: $radius-md $radius-md $radius-xs $radius-md;
}

.toolBlock {
  margin-top: 12px; border-radius: $radius-sm;
  background: var(--bg-elev-2); border: 1px solid var(--hairline);
  overflow: hidden; position: relative;
  &::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--accent); }
}
.toolHeader {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px 8px 16px;
  font-size: $text-xs; font-weight: 500;
}
.toolName { font-family: $font-mono; color: var(--accent); flex: 1; }
.toolDone { color: var(--success); font-family: $font-mono; }
.toolMeta { padding: 0 12px 10px 16px; font-size: $text-xs; color: var(--text-3); line-height: 1.6; font-family: $font-mono; }

.actionBtns { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.actionBtn {
  @include atelier-btn(secondary, sm);
  font-size: $text-xs;
}

.typingDots { display: flex; align-items: center; gap: 4px; padding: 4px 0; }
.dot {
  width: 5px; height: 5px; border-radius: $radius-full; background: var(--text-3);
  animation: bounce 1.2s infinite;
  &:nth-child(2) { animation-delay: 0.15s; }
  &:nth-child(3) { animation-delay: 0.3s; }
}

.inputArea {
  border-top: 1px solid var(--hairline); background: var(--bg-elev);
  padding: 14px 36px 20px; flex-shrink: 0;
}

.presets { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.presetBtn {
  @include atelier-btn(secondary, sm);
  font-size: $text-xs; font-weight: 400; color: var(--text-3);
  &:hover { color: var(--text); }
}

.inputRow {
  display: flex; gap: 10px; align-items: flex-end;
  background: var(--bg-elev-2); border: 1px solid var(--hairline);
  border-radius: $radius-full; padding: 4px 4px 4px 18px;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
}

.textarea {
  flex: 1; background: transparent; border: none; outline: none; resize: none;
  font-size: $text-base; color: var(--text); line-height: 1.5; padding: 8px 0;
  font-family: $font-sans;
  &::placeholder { color: var(--text-4); }
}

.sendBtn {
  @include atelier-btn(primary, sm);
  border-radius: $radius-full; flex-shrink: 0; height: 36px; width: 36px; padding: 0;
  font-size: 16px;
  &:disabled { opacity: 0.4; }
}
""")

# ── TasksView ───────────────────────────────────────────────────────────────────
w('src/components/Tasks/TasksView.module.scss', HEADER + """
.wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: var(--bg); }

.toolbar {
  display: flex; align-items: center; gap: 12px; padding: 18px 36px;
  box-shadow: inset 0 -1px 0 var(--hairline); flex-shrink: 0; background: var(--bg-elev);
}

.filterGroup { display: flex; gap: 6px; flex-wrap: wrap; }

.filterBtn {
  @include atelier-btn(secondary, sm);
  font-size: $text-xs; color: var(--text-3);
  &:hover { color: var(--text); }
}

.filterBtnActive {
  background: var(--bg-tint-2);
  color: var(--text);
  border-color: var(--hairline-strong);
  .filterDot { opacity: 1; }
}

.filterDot {
  width: 5px; height: 5px; border-radius: $radius-full;
  background: var(--accent); opacity: 0.4;
}

.addBtn { @include atelier-btn(primary, sm); margin-left: auto; }

.list { flex: 1; overflow-y: auto; @include custom-scrollbar; }

.taskRow {
  display: grid; grid-template-columns: 52px 1fr auto;
  align-items: center; gap: 20px; padding: var(--row-pad) 36px;
  box-shadow: inset 0 -1px 0 var(--hairline); cursor: pointer;
  transition: background 0.18s var(--ease-out);
  &:hover { background: var(--bg-tint); }
}

.taskNum {
  font-family: $font-display; font-style: italic; font-size: 22px;
  color: var(--text-4); transition: color 0.18s;
  .taskRow:hover & { color: var(--accent); }
}

.taskName {
  font-family: $font-display; font-style: italic; font-size: $text-2xl;
  color: var(--text); letter-spacing: -0.015em; margin-bottom: 4px;
}

.taskGoal { font-size: $text-base; color: var(--text-2); line-height: 1.45; margin-bottom: 6px; @include truncate; }

.taskMeta {
  display: flex; gap: 14px; font-size: $text-xs;
  color: var(--text-3); font-family: $font-mono;
}

.taskRight { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }

.pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: $radius-full; font-size: 11px; font-weight: 500;
  border: 1px solid transparent; white-space: nowrap;
}
.pillRunning  { background: color-mix(in oklab, var(--warning) 12%, transparent); border-color: color-mix(in oklab, var(--warning) 35%, transparent); color: var(--warning); }
.pillDone     { background: color-mix(in oklab, var(--success) 12%, transparent); border-color: color-mix(in oklab, var(--success) 35%, transparent); color: var(--success); }
.pillFailed   { background: color-mix(in oklab, var(--danger)  12%, transparent); border-color: color-mix(in oklab, var(--danger)  35%, transparent); color: var(--danger); }
.pillPending  { background: transparent; border-color: var(--hairline-strong); color: var(--text-3); }

.viewBtn { @include atelier-btn(secondary, sm); font-size: $text-xs; }

.empty {
  @include empty-state; padding: 64px 36px;
  font-family: $font-display; font-style: italic; font-size: $text-3xl; color: var(--text-4);
}

.overlay { @include overlay; }
.modal {
  background: var(--bg-elev); border: 1px solid var(--hairline);
  border-radius: $radius-lg; padding: $sp-7; width: 100%; max-width: 480px;
  box-shadow: var(--shadow-lg); animation: sheetIn 0.3s var(--ease-spring);
}
.modalTitle {
  font-family: $font-display; font-style: italic; font-size: $text-3xl;
  color: var(--text); letter-spacing: -0.02em; margin-bottom: 20px;
}
.fieldLabel { @include eyebrow; display: block; margin-bottom: 6px; margin-top: 14px; }
.input  { @include form-input; margin-bottom: 0; }
.textarea { @include form-input; resize: vertical; min-height: 80px; }
.modalBtns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.btnSecondary { @include atelier-btn(secondary, md); }
.btnPrimary   { @include atelier-btn(primary, md); }
""")

# ── AgentsView ──────────────────────────────────────────────────────────────────
w('src/components/Agents/AgentsView.module.scss', HEADER + """
.wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: var(--bg); }

.header {
  display: flex; align-items: center; gap: 14px; padding: 18px 36px;
  box-shadow: inset 0 -1px 0 var(--hairline); flex-shrink: 0; background: var(--bg-elev);
}
.title { font-family: $font-display; font-style: italic; font-size: $text-2xl; color: var(--text); flex: 1; }
.addBtn { @include atelier-btn(primary, sm); }

.body { flex: 1; overflow-y: auto; padding: 28px 36px 48px; @include custom-scrollbar; }

/* Activity strip */
.activityStrip {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1px; background: var(--hairline);
  border: 1px solid var(--hairline); margin-bottom: 36px;
}
.activityCard {
  padding: 16px 18px; background: var(--bg-elev);
  display: flex; flex-direction: column; gap: 6px;
}
.activityTop { display: flex; align-items: center; gap: 8px; }
.activityDot {
  width: 6px; height: 6px; border-radius: $radius-full; background: currentColor; flex-shrink: 0;
}
.activityName { font-size: $text-base; font-weight: 500; flex: 1; }
.activityEta { font-size: 11px; color: var(--text-3); font-family: $font-mono; }
.activityAction { font-size: $text-sm; color: var(--text-2); }

.sectionLabel { @include eyebrow; margin-bottom: 14px; }

/* Agent rows */
.agentRow {
  display: grid; grid-template-columns: 44px 1fr auto auto;
  gap: 18px; align-items: center; padding: var(--row-pad) 8px;
  box-shadow: inset 0 -1px 0 var(--hairline);
  cursor: pointer; transition: background 0.18s var(--ease-out);
  &:hover { background: var(--bg-tint); }
}

.agentMark {
  width: 44px; height: 44px; border-radius: $radius-md;
  background: var(--bg-elev-2); border: 1px solid var(--hairline);
  display: grid; place-items: center;
  font-family: $font-display; font-style: italic; font-size: 16px;
  flex-shrink: 0; position: relative; overflow: hidden;
}

.agentName {
  font-family: $font-display; font-style: italic; font-size: $text-2xl;
  color: var(--text); letter-spacing: -0.015em;
}
.agentTag { font-size: $text-xs; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; margin-left: 6px; }
.agentDesc { font-size: $text-base; color: var(--text-2); margin-top: 2px; @include truncate; }

.agentStats {
  display: flex; gap: 14px; font-size: $text-xs;
  color: var(--text-3); font-family: $font-mono;
}

.agentBtns { display: flex; gap: 8px; }
.runBtn { @include atelier-btn(primary, sm); }
.cfgBtn { @include atelier-btn(secondary, sm); }

.empty {
  @include empty-state;
  font-family: $font-display; font-style: italic; font-size: $text-3xl; color: var(--text-4);
}

/* Modals */
.overlay { @include overlay; }
.modal {
  background: var(--bg-elev); border: 1px solid var(--hairline);
  border-radius: $radius-lg; padding: $sp-7; width: 100%; max-width: 520px;
  box-shadow: var(--shadow-lg); animation: sheetIn 0.3s var(--ease-spring);
  max-height: 90vh; overflow-y: auto; @include custom-scrollbar;
}
.modalTitle {
  font-family: $font-display; font-style: italic; font-size: $text-3xl;
  color: var(--text); letter-spacing: -0.02em; margin-bottom: 20px;
}
.fieldLabel { @include eyebrow; display: block; margin-bottom: 6px; margin-top: 14px; }
.input   { @include form-input; }
.textarea{ @include form-input; resize: vertical; min-height: 80px; }
.modalBtns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.btnSecondary { @include atelier-btn(secondary, md); }
.btnPrimary   { @include atelier-btn(primary, md); }

/* Run history drawer */
.drawer {
  position: fixed; right: 0; top: 0; bottom: 0; width: 360px;
  background: var(--bg-elev); border-left: 1px solid var(--hairline);
  box-shadow: var(--shadow-lg); z-index: $z-drawer;
  display: flex; flex-direction: column; animation: slideInRight 0.28s var(--ease-spring);
}
.drawerHeader {
  padding: 20px 22px; box-shadow: inset 0 -1px 0 var(--hairline);
  display: flex; align-items: center; gap: 12px;
}
.drawerTitle { font-family: $font-display; font-style: italic; font-size: $text-2xl; color: var(--text); flex: 1; }
.drawerClose { @include atelier-btn(ghost, sm); width: 28px; height: 28px; padding: 0; border-radius: $radius-full; }
.drawerBody { flex: 1; overflow-y: auto; padding: 20px 22px; @include custom-scrollbar; }

.sectionCard { }
.runRow {
  display: grid; grid-template-columns: 1fr auto auto;
  gap: 10px; padding: 10px 0; box-shadow: inset 0 -1px 0 var(--hairline);
}
.runGoal { font-size: $text-sm; color: var(--text-2); @include truncate; }
.runStatus { font-size: $text-xs; font-family: $font-mono; }
.runMeta { font-size: $text-xs; color: var(--text-3); font-family: $font-mono; }

/* Pill */
.pill {
  display: inline-flex; align-items: center; padding: 3px 9px; border-radius: $radius-full;
  font-size: 11px; font-weight: 500; border: 1px solid transparent; white-space: nowrap;
}
.pillActive  { background: color-mix(in oklab, var(--success) 12%, transparent); border-color: color-mix(in oklab, var(--success) 35%, transparent); color: var(--success); }
.pillDanger  { background: color-mix(in oklab, var(--danger)  12%, transparent); border-color: color-mix(in oklab, var(--danger)  35%, transparent); color: var(--danger); }
.pillNeutral { background: transparent; border-color: var(--hairline-strong); color: var(--text-3); }
""")

# ── SkillsView ───────────────────────────────────────────────────────────────────
w('src/components/Skills/SkillsView.module.scss', HEADER + """
.wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: var(--bg); }
.toolbar {
  display: flex; align-items: center; gap: 14px; padding: 18px 36px;
  box-shadow: inset 0 -1px 0 var(--hairline); flex-shrink: 0; background: var(--bg-elev);
  flex-wrap: wrap;
}
.searchWrap { flex: 1; min-width: 200px; }
.search {
  @include form-input; border-radius: $radius-full; padding: 9px 16px 9px 40px;
}
.searchIcon { /* handled via wrapper */ }
.tabGroup { display: flex; gap: 0; }
.tab {
  padding: 8px 16px; font-size: $text-sm; font-weight: 500; color: var(--text-3);
  border: 1px solid var(--hairline-strong); background: transparent;
  cursor: pointer; transition: all 0.15s;
  &:first-child { border-radius: $radius-sm 0 0 $radius-sm; }
  &:last-child  { border-radius: 0 $radius-sm $radius-sm 0; margin-left: -1px; }
  &:hover { color: var(--text); }
}
.tabActive { background: var(--text); color: var(--bg); border-color: var(--text); }

.body { flex: 1; overflow-y: auto; padding: 28px 36px 48px; @include custom-scrollbar; }

.skillRow {
  display: grid; grid-template-columns: 8px 1fr auto auto auto;
  gap: 14px; align-items: center; padding: 12px 8px;
  box-shadow: inset 0 -1px 0 var(--hairline);
  transition: background 0.15s;
  &:hover { background: var(--bg-tint); }
}
.skillDot { width: 8px; height: 8px; border-radius: $radius-full; flex-shrink: 0; }
.skillName { font-family: $font-mono; font-size: $text-base; font-weight: 500; color: var(--text); }
.skillDesc { font-size: $text-sm; color: var(--text-3); margin-top: 2px; }
.skillPill {
  display: inline-flex; padding: 2px 8px; border-radius: $radius-full; font-size: 11px;
  border: 1px solid var(--hairline-strong); color: var(--text-3); white-space: nowrap;
}
.skillCalls { font-size: $text-xs; color: var(--text-3); font-family: $font-mono; text-align: right; }
.skillBtn { @include atelier-btn(ghost, sm); }

.empty { @include empty-state; }

.addBtn { @include atelier-btn(primary, sm); margin-left: auto; }
""")

# ── SkillStoreView ───────────────────────────────────────────────────────────────
w('src/components/Skills/SkillStoreView.module.scss', HEADER + """
.wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: var(--bg); }
.toolbar {
  display: flex; align-items: center; gap: 14px; padding: 18px 36px;
  box-shadow: inset 0 -1px 0 var(--hairline); flex-shrink: 0; background: var(--bg-elev); flex-wrap: wrap;
}
.searchWrap { position: relative; flex: 1; min-width: 220px; }
.searchIcon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-3); font-size: 14px; }
.search { @include form-input; border-radius: $radius-full; padding: 9px 16px 9px 40px; }
.filterGroup { display: flex; gap: 6px; }
.filterBtn { @include atelier-btn(secondary, sm); font-size: $text-xs; color: var(--text-3); &:hover { color: var(--text); } }
.filterBtnActive { background: var(--bg-tint-2); color: var(--text); border-color: var(--hairline-strong); }

.body {
  flex: 1; overflow-y: auto; padding: 28px 36px 48px; @include custom-scrollbar;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--grid-gap);
  align-content: start;
}

.card {
  background: var(--bg-elev); border: 1px solid var(--hairline);
  border-radius: $radius-md; padding: var(--card-pad); position: relative; overflow: hidden;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-spring), transform 0.2s var(--ease-spring);
  cursor: pointer;
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
}

.cardAccent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }

.cardHead { display: flex; align-items: flex-start; gap: 12px; }
.cardMark {
  width: 42px; height: 42px; border-radius: $radius-md; flex-shrink: 0;
  background: var(--bg-elev-2); border: 1px solid var(--hairline);
  display: grid; place-items: center; font-family: $font-display; font-style: italic; font-size: 16px;
}
.cardNum { font-family: $font-display; font-style: italic; font-size: 13px; color: var(--text-4); }
.cardName { font-family: $font-display; font-style: italic; font-size: $text-2xl; color: var(--text); letter-spacing: -0.015em; margin-top: 2px; }
.cardTagline { font-size: $text-sm; color: var(--text-2); line-height: 1.5; flex: 1; }
.cardFooter {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 12px; box-shadow: inset 0 1px 0 var(--hairline); margin-top: auto;
}
.cardMeta { font-size: 11px; color: var(--text-3); font-family: $font-mono; }
.cardPrice { font-size: $text-base; font-weight: 500; color: var(--text); }
.cardPriceFree { color: var(--success); }

.installBtn { @include atelier-btn(primary, sm); }
.installedPill {
  display: inline-flex; align-items: center; padding: 3px 9px; border-radius: $radius-full;
  font-size: 11px; font-weight: 500; background: color-mix(in oklab, var(--success) 12%, transparent);
  border: 1px solid color-mix(in oklab, var(--success) 35%, transparent); color: var(--success);
}

.empty { @include empty-state; }
""")

# ── DashboardView ──────────────────────────────────────────────────────────────
w('src/components/Dashboard/DashboardView.module.scss', HEADER + """
.wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: var(--bg); }

.header {
  display: flex; align-items: center; gap: 14px; padding: 18px 36px;
  box-shadow: inset 0 -1px 0 var(--hairline); flex-shrink: 0; background: var(--bg-elev);
}
.titleGroup { flex: 1; }
.title { font-family: $font-display; font-style: italic; font-size: $text-2xl; color: var(--text); }
.desc { font-size: $text-sm; color: var(--text-3); margin-top: 2px; }
.btnSecondary { @include atelier-btn(secondary, sm); }

.body { flex: 1; overflow-y: auto; padding: 28px 36px 48px; @include custom-scrollbar; }

.metricsRow {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1px; background: var(--hairline); border: 1px solid var(--hairline); margin-bottom: 36px;
}
.metricCard {
  padding: 22px 24px; background: var(--bg-elev);
  display: flex; flex-direction: column; gap: 4px;
}
.metricLabel { @include eyebrow; }
.metricValue {
  font-family: $font-display; font-style: italic;
  font-size: clamp(32px, 3.5vw, 48px); letter-spacing: -0.03em; line-height: 1; margin: 4px 0;
}
.metricSub { font-size: $text-xs; color: var(--text-3); }

.sectionTitle {
  font-family: $font-display; font-style: italic; font-size: $text-2xl;
  color: var(--text); letter-spacing: -0.02em; margin-bottom: 16px;
}

.llmSection { margin-bottom: 36px; }
.providerRow {
  display: grid; grid-template-columns: 36px 1fr auto auto;
  gap: 16px; align-items: center; padding: 14px 0;
  box-shadow: inset 0 -1px 0 var(--hairline);
}
.providerIcon { width: 36px; height: 36px; border-radius: $radius-sm; display: grid; place-items: center; font-size: 18px; background: var(--bg-elev-2); }
.providerName { font-size: $text-base; font-weight: 500; color: var(--text); }
.providerModel { font-size: $text-xs; color: var(--text-3); font-family: $font-mono; margin-top: 2px; }
.currentPill { display: inline-flex; padding: 3px 9px; border-radius: $radius-full; font-size: 11px; font-weight: 500; background: color-mix(in oklab, var(--success) 12%, transparent); border: 1px solid color-mix(in oklab, var(--success) 35%, transparent); color: var(--success); }
.switchBtn { @include atelier-btn(secondary, sm); }
.btnPrimary { @include atelier-btn(primary, sm); }

.tasksSection { margin-bottom: 36px; }
.taskRow {
  display: grid; grid-template-columns: 1fr auto;
  gap: 12px; padding: 12px 0; box-shadow: inset 0 -1px 0 var(--hairline); align-items: center;
}
.taskGoal { font-size: $text-base; color: var(--text-2); @include truncate; }
.taskStatus { font-size: 11px; font-family: $font-mono; }

.skillsSection { margin-bottom: 36px; }
.skillBar {
  display: grid; grid-template-columns: 120px 1fr auto;
  gap: 12px; align-items: center; padding: 10px 0;
  box-shadow: inset 0 -1px 0 var(--hairline);
}
.skillName { font-family: $font-mono; font-size: $text-sm; color: var(--text-2); @include truncate; }
.skillBarTrack { height: 3px; background: var(--hairline-strong); border-radius: $radius-full; }
.skillBarFill { height: 100%; background: var(--accent); border-radius: $radius-full; transition: width 0.4s var(--ease-spring); }
.skillCount { font-size: $text-xs; color: var(--text-3); font-family: $font-mono; }

.mcpSection { margin-bottom: 36px; }
.mcpRow {
  display: grid; grid-template-columns: 8px 1fr auto;
  gap: 12px; align-items: center; padding: 12px 0; box-shadow: inset 0 -1px 0 var(--hairline);
}
.mcpDot { width: 8px; height: 8px; border-radius: $radius-full; flex-shrink: 0; }
.mcpName { font-size: $text-base; color: var(--text-2); }
.mcpStatus { font-size: 11px; font-family: $font-mono; }

.llmProviders { display: flex; flex-direction: column; }
.select {
  @include form-input; padding: 8px 12px; font-family: $font-mono; font-size: $text-sm;
  border-radius: $radius-sm;
}
.switchMsg { padding: 10px 14px; border-radius: $radius-sm; font-size: $text-sm; margin-top: 12px; border: 1px solid transparent; }
.switchMsgOk  { background: color-mix(in oklab, var(--success) 10%, transparent); border-color: color-mix(in oklab, var(--success) 30%, transparent); color: var(--success); }
.switchMsgErr { background: color-mix(in oklab, var(--danger)  10%, transparent); border-color: color-mix(in oklab, var(--danger)  30%, transparent); color: var(--danger); }
""")

# ── ConnectorView ──────────────────────────────────────────────────────────────
w('src/components/Connectors/ConnectorView.module.scss', HEADER + """
.wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: var(--bg); }
.toolbar {
  display: flex; align-items: center; gap: 14px; padding: 18px 36px;
  box-shadow: inset 0 -1px 0 var(--hairline); flex-shrink: 0; background: var(--bg-elev); flex-wrap: wrap;
}
.tabGroup { display: flex; gap: 0; }
.tab {
  padding: 8px 16px; font-size: $text-sm; font-weight: 500; color: var(--text-3);
  border: 1px solid var(--hairline-strong); background: transparent; cursor: pointer;
  transition: all 0.15s;
  &:first-child { border-radius: $radius-sm 0 0 $radius-sm; }
  &:last-child  { border-radius: 0 $radius-sm $radius-sm 0; margin-left: -1px; }
  &:hover { color: var(--text); }
}
.tabActive { background: var(--text); color: var(--bg); border-color: var(--text); }
.addBtn { @include atelier-btn(primary, sm); margin-left: auto; }

.body { flex: 1; overflow-y: auto; padding: 28px 36px 48px; @include custom-scrollbar; }

/* Connected list */
.connectorRow {
  display: grid; grid-template-columns: 44px 1fr auto auto auto;
  gap: 16px; align-items: center; padding: var(--row-pad) 8px;
  box-shadow: inset 0 -1px 0 var(--hairline);
  transition: background 0.15s; cursor: pointer;
  &:hover { background: var(--bg-tint); }
}
.connMark {
  width: 44px; height: 44px; border-radius: $radius-md;
  background: var(--bg-elev-2); border: 1px solid var(--hairline);
  display: grid; place-items: center; font-size: 20px;
}
.connName { font-size: $text-xl; color: var(--text); font-weight: 500; }
.connDesc { font-size: $text-sm; color: var(--text-3); margin-top: 2px; }
.connStatus { font-size: 11px; font-family: $font-mono; }
.testBtn { @include atelier-btn(secondary, sm); }
.deleteBtn { @include atelier-btn(danger, sm); }

.statusPill {
  display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px;
  border-radius: $radius-full; font-size: 11px; font-weight: 500; border: 1px solid transparent;
}
.statusConnected { background: color-mix(in oklab, var(--success) 12%, transparent); border-color: color-mix(in oklab, var(--success) 35%, transparent); color: var(--success); }
.statusError     { background: color-mix(in oklab, var(--danger) 12%, transparent); border-color: color-mix(in oklab, var(--danger) 35%, transparent); color: var(--danger); }
.statusUnknown   { background: transparent; border-color: var(--hairline-strong); color: var(--text-3); }

/* Template grid — tile mosaic */
.templateGrid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1px; background: var(--hairline); border: 1px solid var(--hairline);
}
.templateCard {
  padding: 22px; background: var(--bg-elev); display: flex; flex-direction: column;
  gap: 12px; min-height: 180px; cursor: pointer; position: relative;
  transition: background 0.15s;
  &:hover { background: var(--bg-elev-2); }
}
.templateAccent { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; }
.templateNum { font-family: $font-display; font-style: italic; font-size: 18px; color: var(--text-4); }
.templateIcon { font-size: 28px; }
.templateName { font-family: $font-display; font-style: italic; font-size: $text-2xl; color: var(--text); margin-top: auto; }
.templateDesc { font-size: $text-sm; color: var(--text-3); line-height: 1.5; }
.connectBtn { @include atelier-btn(secondary, sm); align-self: flex-start; margin-top: 4px; }

.empty { @include empty-state; }

/* Create modal */
.overlay { @include overlay; }
.modal {
  background: var(--bg-elev); border: 1px solid var(--hairline);
  border-radius: $radius-lg; padding: $sp-7; width: 100%; max-width: 480px;
  box-shadow: var(--shadow-lg); animation: sheetIn 0.3s var(--ease-spring);
}
.modalTitle { font-family: $font-display; font-style: italic; font-size: $text-3xl; color: var(--text); margin-bottom: 20px; }
.fieldLabel { @include eyebrow; display: block; margin-bottom: 6px; margin-top: 14px; }
.input   { @include form-input; }
.textarea{ @include form-input; resize: vertical; min-height: 60px; }
.select  { @include form-input; }
.modalBtns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.btnCancel  { @include atelier-btn(secondary, md); }
.btnPrimary { @include atelier-btn(primary, md); }
""")

print('All view SCSS modules written.')
