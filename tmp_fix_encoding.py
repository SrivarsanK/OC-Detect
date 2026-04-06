import sys

with open('notebooks/train.py', 'rb') as f:
    content = f.read().decode('utf-8', errors='ignore')

# Replace CP1252-hostile characters with ASCII
content = content.replace('│', '|')
content = content.replace('⚡', '*')
content = content.replace('⭐', '*')
content = content.replace('🎯', '->')
content = content.replace('⚠️', '(!)')
content = content.replace('✅', '[OK]')
content = content.replace('⚙️', '[CFG]')
content = content.replace('📜', '[LOG]')
content = content.replace('🔧', '[FIX]')
content = content.replace('🚀', '[GO]')
content = content.replace('─', '-')
content = content.replace('⚡', '*')
content = content.replace('Γöé', '|') # Handle the mangled traceback version too
content = content.replace('â”‚', '|') # Handle another potential encoding
content = content.replace('âš ï¸', '(!)')
content = content.replace('â­', '*')

with open('notebooks/train.py', 'w', encoding='ascii', errors='ignore') as f:
    f.write(content)

print("ASCII-fied notebooks/train.py")
