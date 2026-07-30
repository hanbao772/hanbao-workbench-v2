const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(__dirname + '/workbench.html', 'utf8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://example.com/workbench.html'
});
const { window } = dom;

// jsdom 没有 fetch / AbortController / speechSynthesis / Audio，打桩避免报错
window.fetch = () => Promise.reject(new Error('no-network'));
window.AbortController = window.AbortController || class { constructor(){ this.signal={}; } abort(){} };
window.speechSynthesis = undefined;
window.Audio = function(src){ this.src = src; this.currentTime = 0; this.duration = 0; this.play = () => Promise.resolve(); this.pause = () => {}; this.load = () => {}; };

dom.window.addEventListener('error', e => {
  console.error('PAGE ERROR:', e.error && e.error.message);
});

setTimeout(() => {
  const d = window.document;
  const checks = [];
  const clock = d.getElementById('clock');
  checks.push(['clock renders', !!clock && /\d\d:\d\d:\d\d/.test(clock.textContent)]);
  const quoteCn = d.getElementById('quoteCn');
  checks.push(['quote renders', !!quoteCn && quoteCn.textContent.length > 0]);
  const navList = d.querySelector('.nav-list');
  checks.push(['nav has 11 items', !!navList && navList.querySelectorAll('.nav-item').length === 11]);
  const logoTitle = d.querySelector('.logo-title');
  checks.push(['logo renamed 汉堡的万能助手', !!logoTitle && logoTitle.textContent.indexOf('汉堡的万能助手') >= 0]);

  // 切到 reading 模块，模拟添加文案
  try {
    window.switchPage('reading');
    const ta = d.getElementById('inp_reading_word');
    const src = d.getElementById('inp_reading_mean');
    ta.value = '生活原本沉闷，但跑起来就有风。';
    src.value = '网络';
    window.addItem('reading');
    const page = d.getElementById('content_reading');
    const copyCard = page.querySelector('.copy-card');
    checks.push(['文案记录卡片渲染', !!copyCard]);
    checks.push(['文案内容正确', !!copyCard && copyCard.textContent.indexOf('生活原本沉闷') >= 0]);
    window.toggleFav('reading', 0);
    const favCard = d.getElementById('content_reading').querySelector('.copy-card.fav');
    checks.push(['收藏切换生效', !!favCard]);
  } catch (e) {
    checks.push(['reading module error: ' + e.message, false]);
  }

  // 切到 podcast 模块
  try {
    window.switchPage('podcast');
    checks.push(['podcast page exists', !!d.getElementById('page_podcast')]);
    checks.push(['podcast player card renders', !!d.querySelector('.podcast-player-card')]);
    checks.push(['podcast list container renders', !!d.getElementById('podcastList')]);
    checks.push(['formatTime works', window.formatTime(1048) === '17:28']);
    const picks = window.getDailyPodcasts([{duration:600},{duration:900},{duration:1200},{duration:3000}], 3);
    checks.push(['getDailyPodcasts filters 15min', picks.length === 3 && picks.every(p => p.duration >= 600 && p.duration <= 1200)]);
  } catch (e) {
    checks.push(['podcast module error: ' + e.message, false]);
  }

  // 主题色检查：没有残留 pink
  const styleText = d.querySelector('style').textContent;
  checks.push(['无 --pink 变量残留', !/--pink-/.test(styleText)]);

  let allPass = true;
  checks.forEach(([name, ok]) => {
    console.log((ok ? 'PASS ' : 'FAIL ') + name);
    if (!ok) allPass = false;
  });
  console.log(allPass ? '\n✅ ALL CHECKS PASSED' : '\n❌ SOME CHECKS FAILED');
  process.exit(allPass ? 0 : 1);
}, 600);
