with open('D:/claude/Mysite/linli-category-test.html','r',encoding='utf-8') as f:
    html = f.read()

# 1. Add category tab
html = html.replace('data-tab="search">🔍 搜索</button>',
    'data-tab="search">🔍 搜索</button>\n  <button class="tab" data-tab="category">📂 分类</button>')

# 2. Add catBar div
html = html.replace('</div>\n\n<div class="search-bar hidden" id="searchBar">',
    '</div>\n<div id="catBar" style="display:none;justify-content:center;flex-wrap:wrap;gap:6px;margin-bottom:24px;position:relative;z-index:1"></div>\n<div class="search-bar hidden" id="searchBar">')

# 3. CSS for catBar buttons
html = html.replace('.tab.active{background:linear-gradient(90deg,#38bdf8,#818cf8);color:#fff;box-shadow:0 4px 16px rgba(56,189,248,0.35)}',
    '.tab.active{background:linear-gradient(90deg,#38bdf8,#818cf8);color:#fff;box-shadow:0 4px 16px rgba(56,189,248,0.35)}\n#catBar .tab,#majorPick .tab{padding:4px 10px;font-size:0.72rem}')

# 4. Major tag blue
html = html.replace('.row .tag{font-size:0.65rem;padding:2px 8px;border-radius:50px;background:var(--tag-bg);color:var(--tag-text)}',
    '.row .tag{font-size:0.65rem;padding:2px 8px;border-radius:50px;background:var(--tag-bg);color:var(--tag-text)}.row .tag.major{background:rgba(56,189,248,0.15);color:var(--accent);font-weight:500}')

# 5. CATS data + functions
cat_js = '''
const CATS=[{id:"vocaloid",n:"术力口",k:["v家","术力口","vocaloid"]},{id:"anime",n:"番剧OP/ED",k:["动漫","番剧","oped","anime"]},{id:"genshin",n:"原神",k:["原神","genshin"]},{id:"honkai",n:"崩坏系列",k:["崩坏","崩铁","崩坏3","honkai"]},{id:"zzz",n:"绝区零",k:["绝区零","zzz"]},{id:"acg",n:"其他ACG音乐",k:["游戏","acg","舞萌","东方","ff14"]},{id:"other",n:"其他",k:[]}];
function classify(tags){var t=(tags||"").toLowerCase();for(var i=0;i<CATS.length;i++){var c=CATS[i];if(!c.k.length)continue;for(var j=0;j<c.k.length;j++){if(t.indexOf(c.k[j])>=0)return c.id}}return"other"}
function buildCatBar(){var h="";CATS.forEach(function(c){h+="<button class=\\"tab cat-btn\\" data-cat=\\""+c.id+"\\">"+c.n+"</button>"});document.getElementById("catBar").innerHTML=h;updateCatCounts()}
async function updateCatCounts(){try{var d=await fetchApproved();document.querySelectorAll("#catBar .cat-btn").forEach(function(b){var cid=b.dataset.cat;b.textContent=CATS.find(function(c){return c.id===cid}).n+" ("+d.filter(function(x){return classify(x.tags)===cid}).length+")"})}catch(e){}}
function pickCat(id){activeCat=id;document.querySelectorAll("#catBar .cat-btn").forEach(function(b){b.classList.toggle("active",b.dataset.cat===id)});renderCategories()}
async function renderCategories(){var g=document.getElementById("grid"),e=document.getElementById("empty");document.getElementById("pager").innerHTML="";g.innerHTML="";e.style.display="none";if(!activeCat)return;try{var d=await fetchApproved();var items=d.filter(function(x){return classify(x.tags)===activeCat});if(!items.length){e.style.display="block";e.textContent="暂无歌曲";return}items.forEach(function(item,i){var div=document.createElement("div");div.innerHTML=buildRow(item,i);g.appendChild(div.firstElementChild);trackView(item.id)})}catch(ex){e.style.display="block";e.textContent="加载失败"}}
'''
html = html.replace('let page=1,pageSize=15,totalPages=1;', 'let page=1,pageSize=15,totalPages=1,activeCat="";'+cat_js)

# 6. Event delegation for catBar
html = html.replace("document.getElementById('tabs').addEventListener('click',e=>{",
    "document.getElementById('catBar').addEventListener('click',function(e){var b=e.target.closest('.cat-btn');if(!b)return;pickCat(b.dataset.cat)});\ndocument.getElementById('tabs').addEventListener('click',e=>{")

# 7. Tab handler
html = html.replace("document.getElementById('searchBar').classList.toggle('hidden',tab!=='search');\n  render();",
    "document.getElementById('searchBar').classList.toggle('hidden',tab!=='search');\ndocument.getElementById('catBar').style.display=tab==='category'?'flex':'none';\nif(tab==='category'){activeCat='';buildCatBar();renderCategories();return}\nrender();")

# 8. Major tag in rows
html = html.replace("tagList.length ? tagList.map(t => `<span class=\"tag\">${esc(t)}</span>`).join('') : ''",
    "tagList.length ? tagList.map(function(t){var m=['原神','崩坏','绝区零','V家','动漫','ACG'].indexOf(t)>=0;return '<span class=\"tag'+(m?' major':'')+'\">'+esc(t)+'</span>'}).join('') : ''")

# 9. Major tag selector in modal
html = html.replace('<label style="display:block;font-size:0.8rem;color:var(--text-muted);margin-bottom:4px;margin-top:12px">标签（空格分隔）</label>\n    <input type="text" id="inputTags" placeholder="原神 璃月 抒情" maxlength="100"',
    '<label style="display:block;font-size:0.8rem;color:var(--text-muted);margin-bottom:4px;margin-top:12px">大分类 <span style="color:#ef4444">*</span></label>\n    <div id="majorPick" style="display:flex;flex-wrap:wrap;gap:4px"></div>\n    <label style="display:block;font-size:0.8rem;color:var(--text-muted);margin-bottom:4px;margin-top:12px">小标签（空格分隔）</label>\n    <input type="text" id="inputTags" placeholder="璃月 抒情 钢琴" maxlength="100"')

# 10. Modal JS
html = html.replace("document.getElementById('fab').addEventListener('click',()=>{document.getElementById('modalOverlay').classList.add('show');document.getElementById('modalError').textContent=''});",
    "var _pickedMajor='';document.getElementById('fab').addEventListener('click',function(){document.getElementById('modalOverlay').classList.add('show');document.getElementById('modalError').textContent='';_pickedMajor='';document.getElementById('majorPick').innerHTML=CATS.map(function(c){return '<span class=\"tab\" style=\"cursor:pointer\" data-cat=\"'+c.id+'\">'+c.n+'</span>'}).join('')});")
html = html.replace("document.getElementById('modalOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal()});",
    "document.getElementById('majorPick').addEventListener('click',function(e){var s=e.target.closest('.tab');if(!s)return;_pickedMajor=s.dataset.cat;document.querySelectorAll('#majorPick .tab').forEach(function(b){b.classList.toggle('active',b.dataset.cat===_pickedMajor)})});\ndocument.getElementById('modalOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal()});")

# 11. Validation
html = html.replace("if(!desc){errEl.textContent='请填写简介（MIDI来源）';return}\n  try{\n    await sbApi('linli_codes',{method:'POST',body:JSON.stringify({code,title,description:desc,author,tags,status:'pending',views:0,likes:0,reports:0})});",
    "if(!desc){errEl.textContent='请填写简介（MIDI来源）';return}\n  if(!_pickedMajor){errEl.textContent='请选择一个大分类';return}\n  var fullTags=(_pickedMajor+' '+tags).trim();\n  try{\n    await sbApi('linli_codes',{method:'POST',body:JSON.stringify({code,title,description:desc,author,tags:fullTags,status:'pending',views:0,likes:0,reports:0})});")

with open('D:/claude/Mysite/linli-category-test.html','w',encoding='utf-8') as f:
    f.write(html)
print('DONE')
