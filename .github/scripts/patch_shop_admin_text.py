from pathlib import Path

p = Path('shop.js')
s = p.read_text(encoding='utf-8')

old = ".shop-admin-grid input,.shop-admin-grid textarea{width:100%;margin-top:4px;border:2px solid #b99760;border-radius:11px;padding:9px;background:#fff}.shop-admin-grid textarea{min-height:70px;resize:vertical}"
new = ".shop-admin-grid input,.shop-admin-grid textarea{width:100%;margin-top:4px;border:2px solid #b99760;border-radius:11px;padding:9px;background:#fff;color:#2d2116;-webkit-text-fill-color:#2d2116;caret-color:#2d2116}.shop-admin-grid input::placeholder,.shop-admin-grid textarea::placeholder{color:#7a6652;-webkit-text-fill-color:#7a6652;opacity:1}.shop-admin-grid textarea{min-height:70px;resize:vertical}"

if new in s:
    print('Shop admin text colors already fixed')
    raise SystemExit(0)

if old not in s:
    raise SystemExit('Could not find shop admin input style')

s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('Fixed visible text in shop admin product fields')
