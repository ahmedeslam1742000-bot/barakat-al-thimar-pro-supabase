import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Search files for pattern
root_dir = "./src"
regex_pat = re.compile(r'\.company\b')

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if '.company' in content:
                        print(f"File: {path}")
                        lines = content.split('\n')
                        for idx, line in enumerate(lines):
                            if '.company' in line:
                                print(f"  {idx+1}: {line.strip()}")
            except Exception as e:
                pass
