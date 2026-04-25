"""Append missing legacy class aliases to all view SCSS modules."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

def append(rel, content):
    path = os.path.join(BASE, rel)
    with open(path, 'a', encoding='utf-8') as f:
        f.write('\n' + content.strip() + '\n')
    print(f'  updated {rel}')

# ── TasksView — add missing classes ───────────────────────────────────────────
append('src/components/Tasks/TasksView.module.scss', """
// Legacy class aliases from TSX
.header {
  display: flex; align-items: center; gap: 14px; padding: 18px 36px;
  box-shadow: inset 0 -1px 0 var(--hairline); flex-shrink: 0; background: var(--bg-elev);
}
.titleGroup { flex: 1; }
.title { font-family: $font-display; font-style: italic; font-size: $text-2xl; color: var(--text); }
.desc { font-size: $text-sm; color: var(--text-3); margin-top: 2px; }
.btnSecondary { @include atelier-btn(secondary, sm); }
.btnPrimary   { @include atelier-btn(primary, sm); }

.body { flex: 1; overflow-y: auto; padding: 24px 36px 48px; @include custom-scrollbar; }

.filters { display: flex; gap: 6px; margin-bottom: 18px; flex-wrap: wrap; }
.filterBtn {
  @include atelier-btn(secondary, sm); font-size: 12.5px; color: var(--text-3);
  &:hover { color: var(--text); }
}
.active {
  background: var(--bg-tint-2); color: var(--text);
  border-color: var(--hairline-strong);
}

.empty {
  @include empty-state; font-family: $font-display; font-style: italic;
  font-size: 24px; color: var(--text-4);
}
.emptyIcon { font-size: 36px; opacity: 0.5; margin-bottom: 8px; }

.list { display: flex; flex-direction: column; }

.card {
  display: grid; grid-template-columns: 44px 1fr auto;
  gap: 16px; align-items: center; padding: var(--row-pad) 8px;
  box-shadow: inset 0 -1px 0 var(--hairline);
  cursor: pointer; transition: background 0.18s var(--ease-out);
  &:hover { background: var(--bg-tint); }
}

.cardIcon {
  width: 44px; height: 44px; border-radius: $radius-md;
  display: grid; place-items: center; font-size: 20px; flex-shrink: 0;
}

.cardGoal {
  font-family: $font-display; font-style: italic; font-size: $text-2xl;
  color: var(--text); letter-spacing: -0.015em; margin-bottom: 4px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.cardMeta { font-size: $text-xs; color: var(--text-3); font-family: $font-mono; }

.badge {
  display: inline-flex; align-items: center; padding: 4px 10px;
  border-radius: $radius-full; font-size: 11px; font-weight: 500;
  border: 1px solid transparent; white-space: nowrap;
}

// Modal class aliases
.modalDesc { font-size: $text-base; color: var(--text-3); margin-bottom: 4px; line-height: 1.5; }
.select { @include form-input; }
.modalFooter { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
""")

# ── DashboardView — add all missing legacy classes ─────────────────────────────
append('src/components/Dashboard/DashboardView.module.scss', """
// Legacy classes from DashboardView TSX
.llmCard {
  background: var(--bg-elev); border: 1px solid var(--hairline);
  border-radius: $radius-md; overflow: hidden; margin-bottom: 28px;
}
.llmHeader {
  display: flex; align-items: center; gap: 10px; padding: 16px 20px;
  font-size: $text-base; font-weight: 500; color: var(--text);
  box-shadow: inset 0 -1px 0 var(--hairline);
}
.llmBadge {
  margin-left: auto; font-size: $text-xs; font-family: $font-mono;
  color: var(--text-3); padding: 3px 10px;
  background: var(--bg-elev-2); border-radius: $radius-full;
  border: 1px solid var(--hairline);
}
.llmBody { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.subLabel { @include eyebrow; margin-bottom: 10px; }
.providerGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
.providerBtn {
  @include atelier-btn(secondary, md); flex-direction: column; height: auto;
  padding: 14px 12px; gap: 6px; align-items: flex-start; border-radius: $radius-md;
  transition: all 0.15s var(--ease-out);
}
.active { border-color: var(--accent); background: var(--accent-soft); }
.providerIcon { font-size: 22px; }
.providerName { font-size: $text-sm; font-weight: 500; color: var(--text); }
.providerKey {
  font-size: 10px; padding: 2px 7px; border-radius: $radius-full; font-family: $font-mono;
}
.modelSelect { @include form-input; font-family: $font-mono; font-size: $text-sm; }
.switchRow { display: flex; align-items: center; gap: 12px; margin-top: 4px; }

.detailGrid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--grid-gap); margin-bottom: 28px;
}
.dCard {
  background: var(--bg-elev); border: 1px solid var(--hairline);
  border-radius: $radius-md; overflow: hidden;
}
.dCardHeader {
  padding: 14px 18px; box-shadow: inset 0 -1px 0 var(--hairline);
  font-family: $font-display; font-style: italic; font-size: $text-xl;
  color: var(--text); letter-spacing: -0.015em;
}
.dCardBody { padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; }

.activityItem { display: flex; align-items: flex-start; gap: 10px; }
.activityDot {
  width: 6px; height: 6px; border-radius: $radius-full;
  margin-top: 6px; flex-shrink: 0;
}
.activityText { font-size: $text-sm; color: var(--text-2); margin-bottom: 2px; @include truncate; }
.activityTime { font-size: $text-xs; color: var(--text-3); font-family: $font-mono; }

.barRow { margin-bottom: 4px; }
.barTop { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.barName { font-family: $font-mono; font-size: $text-sm; color: var(--text-2); }
.barBg { height: 3px; background: var(--hairline-strong); border-radius: $radius-full; }
.barFill { height: 100%; background: var(--accent); border-radius: $radius-full; transition: width 0.4s var(--ease-spring); }

.mcpGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1px; background: var(--hairline); border: 1px solid var(--hairline); margin-bottom: 28px; }
.mcpCard { padding: 16px; background: var(--bg-elev); display: flex; flex-direction: column; gap: 6px; }
.connected {}
.mcpBadge {
  display: inline-flex; align-items: center; padding: 3px 9px; border-radius: $radius-full;
  font-size: 11px; font-weight: 500; border: 1px solid transparent; align-self: flex-start;
}
.mcpName { font-family: $font-display; font-style: italic; font-size: $text-xl; color: var(--text); }
.mcpTools { font-size: $text-xs; color: var(--text-3); font-family: $font-mono; }

.llmProviders { display: flex; flex-direction: column; }
""")

# ── ConnectorView — add missing legacy classes ────────────────────────────────
append('src/components/Connectors/ConnectorView.module.scss', """
// Legacy classes from ConnectorView TSX
.header {
  display: flex; align-items: center; gap: 14px; padding: 18px 36px;
  box-shadow: inset 0 -1px 0 var(--hairline); flex-shrink: 0; background: var(--bg-elev);
}
.title { font-family: $font-display; font-style: italic; font-size: $text-2xl; color: var(--text); flex: 1; }

.body { flex: 1; overflow-y: auto; padding: 28px 36px 48px; @include custom-scrollbar; }

.typeRow { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.typeBtn {
  @include atelier-btn(secondary, md); justify-content: flex-start;
  padding: 14px 16px; height: auto; border-radius: $radius-md; text-align: left;
}
.active { background: var(--bg-tint-2); border-color: var(--accent); color: var(--accent); }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.label { @include eyebrow; }
.input { @include form-input; }
.hint { font-size: $text-xs; color: var(--text-3); margin-top: 4px; }
.modalBtns { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.cancelBtn { @include atelier-btn(secondary, md); }
.saveBtn   { @include atelier-btn(primary, md); }
.testRes {
  margin-top: 12px; padding: 10px 14px; border-radius: $radius-sm;
  font-size: $text-sm; border: 1px solid var(--hairline);
  background: var(--bg-elev-2); color: var(--text-2);
}
""")

# ── AgentsView — add remaining pill aliases ────────────────────────────────────
append('src/components/Agents/AgentsView.module.scss', """
// archetype-specific colour refs used by AgentsView TSX
.archTag { font-size: 11px; text-transform: uppercase; font-weight: 500; letter-spacing: 0.06em; }
.skillChips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.chip {
  padding: 2px 8px; border-radius: $radius-full; font-size: 10px;
  border: 1px solid var(--hairline-strong); color: var(--text-3);
}
// Grid view for cards
.grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--grid-gap); padding: 28px 36px; align-content: start;
}
.card {
  background: var(--bg-elev); border: 1px solid var(--hairline); border-radius: $radius-md;
  padding: var(--card-pad); display: flex; flex-direction: column; gap: 12px;
  cursor: pointer; position: relative; overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-spring), transform 0.2s var(--ease-spring);
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
}
.iconBox {
  width: 46px; height: 46px; border-radius: $radius-md;
  display: grid; place-items: center; font-size: 20px; flex-shrink: 0;
}
.cardName { font-family: $font-display; font-style: italic; font-size: $text-2xl; color: var(--text); }
.cardDesc { font-size: $text-sm; color: var(--text-2); line-height: 1.45; flex: 1; }
.cardFooter { display: flex; gap: 8px; margin-top: auto; padding-top: 12px; box-shadow: inset 0 1px 0 var(--hairline); }
.runBtn { @include atelier-btn(primary, sm); flex: 1; justify-content: center; }
.cfgBtn { @include atelier-btn(secondary, sm); }

.sectionCard { }
""")

print('All legacy class aliases written.')
