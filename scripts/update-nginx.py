import re

conf_path = '/etc/nginx/sites-available/kamino.conf'

with open(conf_path, 'r') as f:
    content = f.read()

# Fix: replace alias+try_files with root approach
old_block = """    # Static projects
    location /p/ {
        alias /var/www/projects/static/;
        autoindex off;
        disable_symlinks on;
        try_files $uri $uri/ $uri/index.html =404;"""

new_block = """    # Static projects
    location /p/ {
        alias /var/www/projects/static/;
        autoindex off;
        disable_symlinks on;
        index index.html;
        try_files $uri $uri/index.html $uri/ =404;"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(conf_path, 'w') as f:
        f.write(content)
    print('Fixed: try_files order updated with index directive')
else:
    print('Block not found, checking alternative...')
    # Maybe need to check what's actually there
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'try_files' in line and '/p/' in content[max(0,content.rfind('\n',0,content.find(line))):content.find(line)]:
            print(f'  Found try_files at line {i+1}: {line.strip()}')
