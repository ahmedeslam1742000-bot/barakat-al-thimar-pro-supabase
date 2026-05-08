import sys

filepath = 'src/pages/vouchers/VoucherWorkspace.jsx'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# 1. Add RealtimeManager and AnimationConfig imports after localforage
content = content.replace(
    "import localforage from 'localforage';",
    "import localforage from 'localforage';\nimport { useRealtimeManager } from '../../contexts/RealtimeManagerContext';\nimport { useAnimationConfig } from '../../hooks/useAnimationConfig';",
    1
)

# 2. Add subscribe after useSettings
content = content.replace(
    "  const { settings } = useSettings();",
    "  const { settings } = useSettings();\n  const { subscribe } = useRealtimeManager();",
    1
)

# 3. Replace the channels useEffect with RealtimeManager subscribe
old_block = "  useEffect(() => {\n    fetchInitialData();\n\n    const channels = ["
new_block = "  // \u2500\u2500\u2500 Global Realtime (single connection via RealtimeManagerProvider) \u2500\u2500\u2500\n  useEffect(() => {\n    fetchInitialData();\n    const unsubProducts = subscribe('products', '*', fetchInitialData);\n    const unsubTx = subscribe('transactions', '*', (payload) => {\n      if (payload.eventType === 'INSERT') {\n        if (payload.new.type !== KIND_CONFIG[kind].txType) return;\n        const d = payload.new;\n        const newTx = { ...d, itemId: d.item_id, voucherGroupId: d.batch_id, voucherCode: d.reference_number, lineNote: d.notes, supplier: d.beneficiary, rep: d.beneficiary, status: d.status || '\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629', line_note: d.notes || '', attachment: d.receipt_image || null };\n        setTransactions((prev) => [newTx, ...prev].slice(0, 300));\n      } else if (payload.eventType === 'UPDATE') {\n        const d = payload.new;\n        const updatedTx = { ...d, itemId: d.item_id, voucherGroupId: d.batch_id, voucherCode: d.reference_number, lineNote: d.notes, supplier: d.beneficiary, rep: d.beneficiary, status: d.status || '\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629', line_note: d.notes || '', attachment: d.receipt_image || null };\n        setTransactions((prev) => prev.map(t => t.id === d.id ? updatedTx : t));\n      } else if (payload.eventType === 'DELETE') {\n        setTransactions((prev) => prev.filter(t => t.id !== payload.old.id));\n      }\n    });\n    return () => { unsubProducts(); unsubTx(); };\n  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [kind]); /* \u0627\u0644\u062c\u0644\u0628 \u064a\u062a\u0645 \u0645\u0631\u0629 \u0648\u0627\u062d\u062f\u0629 \u0628\u062c\u0627\u0646\u0628 kind */\n\n  // [REMOVED OLD CHANNELS BLOCK - was: const channels = ["

if old_block in content:
    # Find the end of the entire useEffect block to remove it
    start_idx = content.find(old_block)
    # Find the closing line: "return () => { channels.forEach(c => supabase.removeChannel(c)); };"
    end_marker = "    return () => { channels.forEach(c => supabase.removeChannel(c)); };\n  }, [kind]);"
    end_idx = content.find(end_marker, start_idx)
    if end_idx != -1:
        end_idx += len(end_marker)
        content = content[:start_idx] + new_block + content[end_idx:]
        sys.stdout.buffer.write(b"CHANNELS REPLACED\n")
    else:
        sys.stdout.buffer.write(b"END MARKER NOT FOUND\n")
else:
    sys.stdout.buffer.write(b"OLD BLOCK NOT FOUND\n")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

sys.stdout.buffer.write(b"DONE\n")
