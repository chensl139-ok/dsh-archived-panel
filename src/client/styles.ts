export const panelStyles = String.raw`
.dap-root{height:100%;min-height:0;overflow:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);padding:0 clamp(24px,4vw,48px) 48px;font-size:14px}
.dap-header{padding-top:28px}
html[data-platform='darwin'] .dap-header{padding-top:calc(28px + var(--dsh-frame-top-clearance, 0px))}
.dap-root *{box-sizing:border-box}
.dap-inner{width:100%;max-width:960px;margin:0 auto}
.dap-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:24px}
.dap-heading{min-width:0}
.dap-heading h1{font-size:20px;line-height:28px;font-weight:500;margin:0 0 4px;outline:none}
.dap-heading p{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}
.dap-count{flex:none;padding:5px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;color:var(--dsw-alias-label-secondary);font-size:12px;background:var(--dsw-alias-bg-layer-1)}
.dap-toolbar{display:grid;grid-template-columns:minmax(180px,1fr) minmax(150px,220px) auto;gap:10px;margin-bottom:12px}
.dap-input,.dap-select,.dap-button{min-height:36px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit}
.dap-input,.dap-select{width:100%;min-width:0;padding:7px 10px}
.dap-input::placeholder{color:var(--dsw-alias-label-secondary)}
.dap-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 12px;cursor:pointer;white-space:nowrap}
.dap-button:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2)}
.dap-button:disabled{opacity:.5;cursor:not-allowed}
.dap-primary{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);font-weight:600}
.dap-danger{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.dap-dialog{width:min(440px,calc(100vw - 32px));border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);padding:20px}
.dap-dialog::backdrop{background:color-mix(in srgb, var(--dsw-alias-bg-base) 45%, transparent)}
.dap-dialog h2{margin:0 0 10px;font-size:18px}
.dap-dialog p{margin:0 0 18px;line-height:1.6;overflow-wrap:anywhere}
.dap-dialog-actions{display:flex;justify-content:flex-end;gap:8px}
.dap-root :focus-visible{outline:var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));outline-offset:2px}
.dap-status{min-height:24px;margin:0 0 8px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.6}
.dap-alert{border:1px solid var(--dsw-alias-state-error-primary);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-state-error-primary);padding:10px 12px;margin:0 0 12px;line-height:1.6;overflow-wrap:anywhere}
.dap-list{list-style:none;padding:0;margin:0;display:grid;gap:2px}
.dap-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;padding:8px;border:0;border-radius:var(--dsw-radius-xl, 12px);background:transparent}
.dap-row:hover{background:var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-1))}
.dap-row[aria-busy=true]{opacity:.72}
.dap-copy{min-width:0}
.dap-copy h2{font-size:14px;line-height:1.45;font-weight:500;margin:0 0 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dap-meta{display:flex;align-items:center;flex-wrap:wrap;gap:5px 12px;color:var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));font-size:13px;line-height:1.5}
.dap-id{display:block;max-width:100%;margin-top:6px;color:var(--dsw-alias-label-secondary);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dap-warning{margin:7px 0 0;color:var(--dsw-alias-state-warn-primary);font-size:12px;line-height:1.5}
.dap-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}
.dap-access{max-width:190px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.5;text-align:right}
.dap-empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:64px 20px;border:1px dashed var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.dap-empty-icon{color:var(--dsw-alias-label-secondary);margin-bottom:14px}
.dap-empty h2{font-size:16px;margin:0 0 8px}
.dap-empty p{max-width:460px;color:var(--dsw-alias-label-secondary);line-height:1.6;margin:0 0 18px}
.dap-spinner{display:inline-block;width:12px;height:12px;border:1.5px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;vertical-align:-2px;margin-right:7px;animation:dap-spin .8s linear infinite}
@keyframes dap-spin{to{transform:rotate(360deg)}}
@media(max-width:767px){.dap-root{padding-left:20px;padding-right:20px}}
@media(max-width:720px){.dap-toolbar{grid-template-columns:minmax(0,1fr) minmax(140px,200px)}.dap-toolbar>.dap-button{grid-column:1/-1;justify-self:start}.dap-row{grid-template-columns:1fr;gap:12px}.dap-actions{justify-content:flex-start}.dap-access{text-align:left;max-width:none}}
@media(max-width:480px){.dap-root{padding-left:20px;padding-right:20px}.dap-header{display:block;margin-bottom:18px}.dap-count{display:inline-block;margin-top:12px}.dap-toolbar{grid-template-columns:1fr}.dap-toolbar>.dap-button{grid-column:auto;justify-self:stretch}.dap-actions{display:grid;grid-template-columns:1fr 1fr;width:100%}.dap-actions>.dap-danger{grid-column:1/-1}.dap-row{padding:14px}.dap-copy h2{white-space:normal;overflow-wrap:anywhere}}
@media(pointer:coarse){.dap-input,.dap-select{font-size:16px}.dap-button{min-height:40px}}
@media(prefers-reduced-motion:reduce){.dap-spinner{animation:none}}
`
