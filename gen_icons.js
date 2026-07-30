const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [76, 120, 152, 167, 180, 192, 512];
const OUT = __dirname;

// 天空蓝渐变背景 + 圆角 + 🍔 emoji
function draw(size){
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.22;

  // 圆角矩形裁剪
  ctx.save();
  roundRect(ctx, 0, 0, size, size, r);
  ctx.clip();

  // 渐变背景
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#e0f2fe');
  g.addColorStop(0.5, '#7dd3fc');
  g.addColorStop(1, '#38bdf8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // 内描边高光
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = size * 0.03;
  roundRect(ctx, ctx.lineWidth/2, ctx.lineWidth/2, size - ctx.lineWidth, size - ctx.lineWidth, r - ctx.lineWidth/2);
  ctx.stroke();
  ctx.restore();

  // emoji 居中
  const emojiSize = size * 0.62;
  ctx.font = emojiSize + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🍔', size/2, size/2 + size*0.02);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUT, `icon-${size}.png`), buf);
  if(size === 180) fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), buf);
  if(size === 512) fs.writeFileSync(path.join(OUT, 'favicon.png'), buf);
  console.log('wrote icon-' + size + '.png');
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

sizes.forEach(draw);
console.log('done');
