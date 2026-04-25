"""Fix all broken design issues: SkillsView, ConnectorView, scrollbars."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

def w(rel, content):
    path = os.path.join(BASE, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f'  wrote {rel}')

# ── SkillsView.module.scss — complete rewrite matching actual TSX class names ─
w('src/components/Skills/SkillsView.module.scss', """
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

// SkillsView — matches all class names used in SkillsView.tsx exactly

.wrap {
  display: flex; flex-direction: column; height: 100%;
  overflow: hidden; background: var(--bg);
}

// ── Header bar ──────────────────────────────────────────────────────────────
.header {
  display: flex; align-items: center; gap: 14px; padding: 18px 36px;
  box-shadow: inset 0 -1px 0 var(--hairline); flex-shrink: 0; background: var(--bg-elev);
  flex-wrap: wrap;
}
.titleGroup { flex: 1; min-width: 0; }
.title {
  font-family: $font-display; font-style: italic; font-size: $text-2xl;
  color: var(--text); letter-spacing: -0.02em;
}
.desc { font-size: $text-sm; color: var(--text-3); margin-top: 2px; }

.headerBtns { display: flex; gap: 6px; }
.viewBtn {
  @include atelier-btn(secondary, sm);
  font-size: $text-xs; color: var(--text-3);
  &:hover { color: var(--text); }
}
.active {
  background: var(--bg-tint-2); color: var(--text);
  border-color: var(--hairline-strong);
}

// ── Scrollable body ──────────────────────────────────────────────────────────
.body {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 0 0 48px;
  @include custom-scrollbar;
}

// ── Empty / loading state ────────────────────────────────────────────────────
.empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; min-height: 200px;
  color: var(--text-4); padding: 48px 36px;
}
.emptyIcon { font-size: 36px; opacity: 0.5; }

// ── Group accordion ──────────────────────────────────────────────────────────
.groupWrap {
  border-bottom: 1px solid var(--hairline);
}

.groupHeader {
  display: flex; align-items: center; gap: 12px; padding: 16px 36px;
  cursor: pointer; user-select: none;
  transition: background 0.15s var(--ease-out);
  &:hover { background: var(--bg-tint); }
  &.open { background: var(--bg-elev-2); }
}

.groupIcon {
  font-size: 20px; flex-shrink: 0;
}
.groupLabel {
  font-family: $font-display; font-style: italic; font-size: $text-2xl;
  color: var(--text); letter-spacing: -0.015em; flex: 1; min-width: 0;
}
.groupMeta {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.connBadge {
  display: inline-flex; padding: 2px 8px; border-radius: $radius-full;
  font-size: 11px; border: 1px solid var(--hairline-strong);
  color: var(--text-3); font-family: $font-mono; white-space: nowrap;
}
.catTag {
  display: inline-flex; padding: 3px 9px; border-radius: $radius-full;
  font-size: 11px; font-weight: 500; white-space: nowrap;
}
.groupCount {
  font-size: $text-xs; color: var(--text-3); font-family: $font-mono;
  white-space: nowrap;
}
.chevron {
  font-size: 10px; color: var(--text-4); transition: transform 0.2s var(--ease-spring);
  &.open { transform: rotate(90deg); }
}

// ── Group body ───────────────────────────────────────────────────────────────
.groupBody {
  padding: 0 36px 12px; background: var(--bg-elev-2);
  animation: fadeIn 0.15s var(--ease-out);
}

// ── Skill row (inside accordion) ─────────────────────────────────────────────
.skillRow {
  display: grid; grid-template-columns: 36px 1fr;
  gap: 12px; align-items: flex-start; padding: 12px 0;
  box-shadow: inset 0 -1px 0 var(--hairline);
  transition: background 0.15s;
  &:last-child { box-shadow: none; }
}
.skIcon {
  width: 36px; height: 36px; border-radius: $radius-sm;
  background: var(--bg-elev); border: 1px solid var(--hairline);
  display: grid; place-items: center; font-size: 16px; flex-shrink: 0;
}
.skName {
  font-family: $font-mono; font-size: $text-base; font-weight: 500;
  color: var(--text); margin-bottom: 2px;
}
.skDesc {
  font-size: $text-sm; color: var(--text-3); line-height: 1.45; margin-bottom: 6px;
}
.skMeta {
  display: flex; flex-wrap: wrap; gap: 4px;
}
.srcTag {
  display: inline-flex; padding: 2px 8px; border-radius: $radius-full;
  font-size: 11px; font-weight: 500; border: 1px solid var(--hairline-strong);
  color: var(--text-3); white-space: nowrap; font-family: $font-mono;
}
.paramTag {
  display: inline-flex; padding: 2px 8px; border-radius: $radius-full;
  font-size: 10px; border: 1px solid var(--hairline);
  color: var(--text-4); white-space: nowrap; font-family: $font-mono;
}

// ── Flat grid view ───────────────────────────────────────────────────────────
.grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--grid-gap); padding: 28px 36px;
  align-content: start;
}
.flatCard {
  background: var(--bg-elev); border: 1px solid var(--hairline);
  border-radius: $radius-md; padding: 18px; display: flex; flex-direction: column;
  gap: 6px; box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-spring), transform 0.2s var(--ease-spring);
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
}
.flatIcon {
  font-size: 24px; margin-bottom: 2px;
}
.flatName {
  font-family: $font-mono; font-size: $text-base; font-weight: 500; color: var(--text);
}
.flatDesc {
  font-size: $text-sm; color: var(--text-3); line-height: 1.45; flex: 1;
}
.flatMeta {
  display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;
}
""")

# ── ConnectorView.module.scss — complete rewrite matching actual TSX class names
w('src/components/Connectors/ConnectorView.module.scss', """
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

// ConnectorView — matches all class names used in ConnectorView.tsx exactly

.wrap {
  display: flex; flex-direction: column; height: 100%;
  overflow: hidden; background: var(--bg);
}

// ── Header ───────────────────────────────────────────────────────────────────
.header {
  display: flex; align-items: center; gap: 14px; padding: 18px 36px;
  box-shadow: inset 0 -1px 0 var(--hairline); flex-shrink: 0; background: var(--bg-elev);
}
.title {
  font-family: $font-display; font-style: italic; font-size: $text-2xl;
  color: var(--text); letter-spacing: -0.02em; flex: 1;
}
.addBtn { @include atelier-btn(primary, sm); }

// ── Scrollable body ──────────────────────────────────────────────────────────
.body {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 28px 36px 48px;
  @include custom-scrollbar;
}

// ── Template section label ───────────────────────────────────────────────────
.tplLabel {
  @include eyebrow;
  display: block; margin-bottom: 14px;
}

// ── Template grid (Quick Connect tile mosaic) ────────────────────────────────
.tplGrid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1px; background: var(--hairline); border: 1px solid var(--hairline);
  margin-bottom: 36px;
}
.tplCard {
  padding: 20px; background: var(--bg-elev);
  display: flex; flex-direction: column; gap: 6px; min-height: 140px;
  cursor: pointer; position: relative; overflow: hidden;
  transition: background 0.15s var(--ease-out);
  &:hover { background: var(--bg-elev-2); }
}
.tplIcon { font-size: 28px; flex-shrink: 0; }
.tplName {
  font-family: $font-display; font-style: italic; font-size: $text-xl;
  color: var(--text); letter-spacing: -0.015em; margin-top: auto;
}
.tplDesc {
  font-family: $font-mono; font-size: $text-xs; color: var(--text-4);
}
.tplSkills {
  font-size: 11px; color: var(--text-3);
  padding: 2px 8px; border-radius: $radius-full;
  border: 1px solid var(--hairline); align-self: flex-start; font-family: $font-mono;
}

// ── Empty state ──────────────────────────────────────────────────────────────
.empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 10px; min-height: 200px; color: var(--text-4);
}
.emptyIcon { font-size: 36px; opacity: 0.5; }

// ── Connected connectors list ────────────────────────────────────────────────
.list {
  display: flex; flex-direction: column;
  border: 1px solid var(--hairline); border-radius: $radius-md; overflow: hidden;
}
.card {
  padding: 16px 20px; background: var(--bg-elev);
  border-bottom: 1px solid var(--hairline);
  transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: var(--bg-tint); }
}
.cardRow {
  display: grid; grid-template-columns: 10px 1fr auto;
  gap: 14px; align-items: center;
}
.statusDot {
  width: 10px; height: 10px; border-radius: $radius-full; flex-shrink: 0;
}
.info { min-width: 0; }
.cName {
  font-size: $text-xl; font-weight: 500; color: var(--text);
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.badge {
  font-size: 11px; padding: 2px 8px; border-radius: $radius-full;
  background: var(--bg-elev-2); border: 1px solid var(--hairline-strong);
  color: var(--text-3); font-family: $font-mono;
}
.cUrl {
  font-size: $text-sm; color: var(--text-3); font-family: $font-mono;
  margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cardBtns {
  display: flex; gap: 6px; flex-shrink: 0;
}
.cardBtn {
  @include atelier-btn(secondary, sm);
  font-size: $text-xs;
  &.danger { @include atelier-btn(danger, sm); font-size: $text-xs; }
}
.danger { @include atelier-btn(danger, sm); font-size: $text-xs; }

.skillPill {
  display: inline-flex; padding: 2px 8px; border-radius: $radius-full;
  font-size: 11px; border: 1px solid var(--hairline); color: var(--text-3);
  font-family: $font-mono; margin: 6px 4px 0 0;
}
.testResult {
  margin-top: 8px; font-size: $text-sm; font-family: $font-mono;
}

// ── Add Connector Modal ──────────────────────────────────────────────────────
.overlay { @include overlay; }
.modal {
  background: var(--bg-elev); border: 1px solid var(--hairline);
  border-radius: $radius-lg; padding: $sp-8; width: 100%; max-width: 500px;
  box-shadow: var(--shadow-lg); animation: sheetIn 0.3s var(--ease-spring);
  max-height: 90vh; overflow-y: auto; @include custom-scrollbar;
}
.modalTitle {
  font-family: $font-display; font-style: italic; font-size: $text-3xl;
  color: var(--text); letter-spacing: -0.02em; margin-bottom: 20px;
}

// Type selector row
.typeRow {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px;
}
.typeBtn {
  padding: 12px 8px; border-radius: $radius-md; border: 1px solid var(--hairline-strong);
  background: var(--bg-elev-2); color: var(--text-3); cursor: pointer;
  font-size: $text-xs; text-align: center; line-height: 1.5;
  transition: all 0.15s var(--ease-out);
  &:hover { border-color: var(--accent); color: var(--text); }
}
.active {
  border-color: var(--accent); background: var(--accent-soft); color: var(--accent);
}

// Form fields
.field { margin-bottom: 14px; }
.label { @include eyebrow; display: block; margin-bottom: 6px; }
.input { @include form-input; }
.hint { font-size: $text-xs; color: var(--text-3); margin-top: 5px; line-height: 1.5; }

// Modal buttons
.modalBtns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.cancelBtn  { @include atelier-btn(secondary, md); }
.saveBtn    { @include atelier-btn(primary, md); }
.testRes {
  margin-top: 12px; padding: 10px 14px; border-radius: $radius-sm;
  font-size: $text-sm; border: 1px solid var(--hairline); background: var(--bg-elev-2);
}
""")

# ── Also fix all other view body scrollbars (min-height: 0 is critical) ───────
# Tasks
tasks_path = os.path.join(BASE, 'src/components/Tasks/TasksView.module.scss')
with open(tasks_path, 'r', encoding='utf-8') as f:
    content = f.read()
# Fix .body to include min-height: 0
content = content.replace(
    '.body { flex: 1; overflow-y: auto; padding: 24px 36px 48px; @include custom-scrollbar; }',
    '.body { flex: 1; min-height: 0; overflow-y: auto; padding: 24px 36px 48px; @include custom-scrollbar; }'
)
content = content.replace(
    '.body { flex: 1; overflow-y: auto;',
    '.body { flex: 1; min-height: 0; overflow-y: auto;'
)
with open(tasks_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('  patched TasksView body scrollbar')

# Dashboard
dash_path = os.path.join(BASE, 'src/components/Dashboard/DashboardView.module.scss')
with open(dash_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace(
    '.body { flex: 1; overflow-y: auto;',
    '.body { flex: 1; min-height: 0; overflow-y: auto;'
)
with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('  patched DashboardView body scrollbar')

# Agents
agents_path = os.path.join(BASE, 'src/components/Agents/AgentsView.module.scss')
with open(agents_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace(
    '.body { flex: 1; overflow-y: auto;',
    '.body { flex: 1; min-height: 0; overflow-y: auto;'
)
# Fix grid (agent cards) to scroll
content = content.replace(
    '.grid { display: grid;',
    '.grid { flex: 1; min-height: 0; overflow-y: auto; display: grid;'
)
with open(agents_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('  patched AgentsView body scrollbar')

# Chat
chat_path = os.path.join(BASE, 'src/components/Chat/ChatView.module.scss')
with open(chat_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace(
    '.messages {\n  flex: 1; overflow-y: auto;',
    '.messages {\n  flex: 1; min-height: 0; overflow-y: auto;'
)
with open(chat_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('  patched ChatView messages scrollbar')

print('All fixes written.')
