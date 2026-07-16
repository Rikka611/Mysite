// 分类函数测试 — 将 linli 中的 classify 函数复制至此
const CATS = [
  {id:"vocaloid",n:"术力口",k:["v家","术力口","vocaloid","初音未来","miku"]},
  {id:"anime",n:"番剧OP/ED",k:["动漫","番剧","oped","anime","animenz","air","clannad","cl","eva","fate","86","吉卜力","鸟之诗","缘之空","你的名字","夏日口袋","紫罗兰永恒花园","我推的孩子","凉宫春日","魔法少女小圆","咒术回战","进击的巨人","寄生兽","末日","天之少女","罪恶王冠","re:zero","yoasobi"]},
  {id:"genshin",n:"原神",k:["原神","genshin","蒙德","璃月","渊下宫","纳塔","挪德卡莱","可莉","芙宁娜","茜特菈莉","哥伦比亚","少偶","莉奈娅"]},
  {id:"honkai",n:"崩坏系列",k:["崩坏","崩铁","崩坏3","honkai","崩坏三","崩坏星穹铁道","知更鸟","昔涟","翁法洛斯","希儿","耀嘉音"]},
  {id:"zzz",n:"绝区零",k:["绝区零","zzz"]},
  {id:"acg",n:"其他ACG音乐",k:["游戏","acg","舞萌","东方","ff14","ff14","轨迹系列","blacksouls","战地风云","去月球","尼尔机械纪元","我的世界","roselia"]},
  {id:"other",n:"其他",k:[]}
];

function classify(tags) {
  var t = (tags || "").toLowerCase(), words = t.split(/[\s,]+/);
  for (var i = 0; i < CATS.length; i++) {
    var c = CATS[i]; if (!c.k.length) continue;
    for (var j = 0; j < c.k.length; j++) {
      var kw = c.k[j].toLowerCase();
      for (var w = 0; w < words.length; w++) { if (words[w] === kw) return c.id }
      if (t.indexOf(kw) >= 0 && kw.length > 4) return c.id;
    }
  }
  return "other";
}

// === 测试用例 ===
const assert = (cond, msg) => { if (!cond) throw new Error('FAIL: ' + msg); else console.log('PASS: ' + msg); };

// 精确标签匹配
assert(classify("原神 璃月") === "genshin", "原神标签");
assert(classify("绝区零") === "zzz", "绝区零标签");
assert(classify("V家 初音未来") === "vocaloid", "V家标签");
assert(classify("动漫") === "anime", "动漫标签");
assert(classify("崩坏三 希儿") === "honkai", "崩坏三标签");
assert(classify("游戏 东方") === "acg", "游戏标签");

// 大小写不敏感
assert(classify("V家") === "vocaloid", "V家大小写");
assert(classify("FF14") === "acg", "FF14大小写");
assert(classify("Clannad") === "anime", "Clannad大小写");

// 短词不误匹配长词 (zzz vs Animenzzz)
assert(classify("Animenz") === "anime", "Animenz是番剧");
assert(classify("Animenz 紫罗兰永恒花园") === "anime", "Animenz+紫罗兰=番剧");

// 空和无匹配
assert(classify("") === "other", "空标签=其他");
assert(classify("抒情 钢琴") === "other", "抒情钢琴=其他");

// 边缘情况
assert(classify("崩坏") === "honkai", "崩坏标签");
assert(classify("Fate stay night") === "anime", "Fate标签");
assert(classify("miku 初音未来 V家") === "vocaloid", "miku标签组合");

console.log('\n所有测试通过!');
