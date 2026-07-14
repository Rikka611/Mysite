# CSP + config + feedback fixes
import re

csp = """<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; connect-src 'self' https://naivizrdefonlelndzqr.supabase.co; img-src 'self' data:; style-src 'self' 'unsafe-inline'; object-src 'none';">"""

old = '<meta charset="UTF-8">\n<meta name="viewport"'
new = '<meta charset="UTF-8">\n' + csp + '\n<meta name="viewport"'

# 1. CSP in linli
f = open('D:/claude/Mysite/linli/index.html', 'r', encoding='utf-8')
c = f.read()
f.close()
c = c.replace(old, new)
open('D:/claude/Mysite/linli/index.html', 'w', encoding='utf-8').write(c)

# 2. CSP in admin
f = open('D:/claude/Mysite/linli-admin/index.html', 'r', encoding='utf-8')
c = f.read()
f.close()
c = c.replace(old, new)
open('D:/claude/Mysite/linli-admin/index.html', 'w', encoding='utf-8').write(c)

# 3. config.template.js placeholders
c = 'window.__LINLI_CONFIG__ = {\n  SB_URL: "{{SB_URL}}",\n  SB_KEY: "{{SB_KEY}}",\n}\n'
open('D:/claude/Mysite/shared/js/config.template.js', 'w', encoding='utf-8').write(c)

# 4. linli feedback fp -> visitor_token
f = open('D:/claude/Mysite/linli/index.html', 'r', encoding='utf-8')
c = f.read()
f.close()
c = c.replace("sessionStorage.getItem('sid')", "window.getVisitorToken()")
c = c.replace("Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('sid',f)", "")
open('D:/claude/Mysite/linli/index.html', 'w', encoding='utf-8').write(c)

print('OK')
