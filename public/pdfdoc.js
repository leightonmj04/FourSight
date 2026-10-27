// A small PDF writer for FourSight's downloads (the four-year plan and the prerequisite chains). It writes text in
// the standard Helvetica fonts, rectangles, lines and curves; everything is built on this device with no library.
//
//   const doc = new PdfDoc({ title });
//   const pg = doc.page(612, 792);          // points; (0, 0) is the TOP-left corner, y grows downward
//   pg.text('CHE 210', 40, 80, { size: 9, bold: true, color: '#BF5700', align: 'left' | 'right' | 'center' });
//   pg.rect(x, y, w, h, { fill, stroke, lw });
//   pg.line([[x, y], [x, y], ...], { stroke, lw, dash: [3, 2] });
//   pg.curve([x0, y0], [c1x, c1y], [c2x, c2y], [x1, y1], { stroke, lw, dash });
//   pg.poly([[x, y], ...], { fill, stroke });
//   doc.width(text, size, bold), doc.fit(text, maxWidth, size, bold), doc.wrap(text, maxWidth, size, bold, maxLines)
//   doc.bytes() -> Uint8Array, doc.blob() -> Blob
(() => {
  'use strict';

  // Helvetica and Helvetica-Bold advance widths (1/1000 em) for ASCII 32-126, from the Adobe font metrics.
  const W_REG = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
    556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556,
    222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
  const W_BOLD = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556,
    556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611,
    278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];
  // Characters outside ASCII that WinAnsiEncoding has, with their byte and widths [regular, bold].
  const EXTRA = {
    '–': [0x96, 556, 556], '—': [0x97, 1000, 1000], '‘': [0x91, 222, 278], '’': [0x92, 222, 278],
    '“': [0x93, 333, 500], '”': [0x94, 333, 500], '•': [0x95, 350, 350], '…': [0x85, 1000, 1000],
    '›': [0x9B, 333, 333], '‹': [0x8B, 333, 333], '·': [0xB7, 278, 278], ' ': [0xA0, 278, 278],
    '™': [0x99, 1000, 1000], '€': [0x80, 556, 556],
  };

  // A character -> [byte, width]; anything the standard fonts cannot show becomes "?".
  function glyph(ch, bold) {
    const code = ch.charCodeAt(0);
    if (code >= 32 && code <= 126) return [code, (bold ? W_BOLD : W_REG)[code - 32]];
    if (EXTRA[ch]) return [EXTRA[ch][0], EXTRA[ch][bold ? 2 : 1]];
    if (code >= 0xA1 && code <= 0xFF) {
      // Accented letters are about as wide as the letter itself.
      const base = ch.normalize('NFD')[0];
      const b = base.charCodeAt(0);
      return [code, b >= 32 && b <= 126 ? (bold ? W_BOLD : W_REG)[b - 32] : 556];
    }
    if (/\s/.test(ch)) return [32, 278];
    const plain = ch.normalize('NFD')[0];
    if (plain !== ch && plain.charCodeAt(0) < 127) return glyph(plain, bold);
    return [63, bold ? 611 : 556];
  }

  const num = (n) => (Math.round(n * 100) / 100).toString();
  const rgb = (hex) => {
    const h = String(hex || '#000').replace('#', '');
    const v = h.length === 3 ? h.split('').map((c) => parseInt(c + c, 16)) : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return v.map((c) => num(c / 255)).join(' ');
  };
  // A PDF literal string from text, one byte per character.
  const literal = (text, bold = false) => {
    let out = '(';
    for (const ch of String(text)) {
      const [b] = glyph(ch, bold);
      if (b === 40 || b === 41 || b === 92) out += '\\' + String.fromCharCode(b);
      else if (b > 126) out += '\\' + b.toString(8).padStart(3, '0');
      else out += String.fromCharCode(b);
    }
    return out + ')';
  };

  class Page {
    constructor(w, h) { this.w = w; this.h = h; this.ops = []; }
    Y(y) { return num(this.h - y); }
    text(str, x, y, { size = 10, bold = false, color = '#000', align = 'left' } = {}) {
      str = String(str ?? '');
      if (!str) return this;
      const w = PdfDoc.width(str, size, bold);
      const left = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
      this.ops.push(`BT /${bold ? 'F2' : 'F1'} ${num(size)} Tf ${rgb(color)} rg ${num(left)} ${this.Y(y)} Td ${literal(str, bold)} Tj ET`);
      return this;
    }
    paint({ fill, stroke, lw = 0.75, dash, cap }) {
      let s = 'q ';
      if (fill) s += `${rgb(fill)} rg `;
      if (stroke) s += `${rgb(stroke)} RG ${num(lw)} w `;
      if (dash) s += `[${dash.map(num).join(' ')}] 0 d `;
      if (cap != null) s += `${cap} J `;
      return s;
    }
    end({ fill, stroke }, closed) { return fill && stroke ? (closed ? 'b' : 'B') : fill ? 'f' : closed ? 's' : 'S'; }
    rect(x, y, w, h, opts = {}) {
      if (!opts.fill && !opts.stroke) return this;
      this.ops.push(`${this.paint(opts)}${num(x)} ${this.Y(y + h)} ${num(w)} ${num(h)} re ${this.end(opts, false)} Q`);
      return this;
    }
    line(pts, opts = {}) {
      const o = { stroke: '#000', ...opts };
      this.ops.push(`${this.paint(o)}${pts.map(([x, y], i) => `${num(x)} ${this.Y(y)} ${i ? 'l' : 'm'}`).join(' ')} S Q`);
      return this;
    }
    curve(p0, c1, c2, p1, opts = {}) {
      const o = { stroke: '#000', ...opts };
      this.ops.push(`${this.paint(o)}${num(p0[0])} ${this.Y(p0[1])} m ${num(c1[0])} ${this.Y(c1[1])} ${num(c2[0])} ${this.Y(c2[1])} ${num(p1[0])} ${this.Y(p1[1])} c S Q`);
      return this;
    }
    poly(pts, opts = {}) {
      if (!opts.fill && !opts.stroke) return this;
      this.ops.push(`${this.paint(opts)}${pts.map(([x, y], i) => `${num(x)} ${this.Y(y)} ${i ? 'l' : 'm'}`).join(' ')} h ${this.end(opts, true)} Q`);
      return this;
    }
  }

  class PdfDoc {
    constructor({ title = '' } = {}) { this.title = title; this.pages = []; }
    page(w = 612, h = 792) { const p = new Page(w, h); this.pages.push(p); return p; }
    static width(str, size, bold = false) {
      let n = 0;
      for (const ch of String(str)) n += glyph(ch, bold)[1];
      return (n * size) / 1000;
    }
    width(str, size, bold) { return PdfDoc.width(str, size, bold); }
    // The text cut to fit maxWidth, ending in an ellipsis when cut.
    fit(str, max, size, bold) {
      str = String(str ?? '');
      if (PdfDoc.width(str, size, bold) <= max) return str;
      let lo = 0, hi = str.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (PdfDoc.width(str.slice(0, mid).trimEnd() + '…', size, bold) <= max) lo = mid; else hi = mid - 1;
      }
      // Cut between words when there is room to, so no word (or course number) is left half shown.
      let cut = str.slice(0, lo);
      const space = cut.lastIndexOf(' ');
      if (space > cut.length * 0.5 && /\S/.test(str[lo] || '')) cut = cut.slice(0, space);
      return cut.replace(/[\s,;:(\-–—]+$/, '') + '…';
    }
    // Lines of at most maxWidth, broken between words; the last allowed line ends in an ellipsis if text remains.
    wrap(str, max, size, bold, maxLines = Infinity) {
      const words = String(str ?? '').split(/\s+/).filter(Boolean);
      const lines = [];
      let cur = '';
      for (let i = 0; i < words.length; i++) {
        const next = cur ? `${cur} ${words[i]}` : words[i];
        if (PdfDoc.width(next, size, bold) <= max || !cur) { cur = next; continue; }
        lines.push(cur);
        cur = words[i];
        if (lines.length === maxLines - 1) { cur = words.slice(i).join(' '); break; }
      }
      if (cur) lines.push(cur);
      return lines.map((l) => (PdfDoc.width(l, size, bold) > max ? this.fit(l, max, size, bold) : l));
    }
    bytes() {
      const objs = [];
      const add = (s) => { objs.push(s); return objs.length; };
      const catalog = add(null), pages = add(null);
      const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
      const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
      const d = new Date(), p2 = (n) => String(n).padStart(2, '0');
      const date = `D:${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
      const info = add(`<< /Title ${literal(this.title)} /Producer (FourSight) /Creator (FourSight) /CreationDate (${date}) >>`);
      const kids = [];
      for (const pg of this.pages) {
        const stream = pg.ops.join('\n');
        const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
        kids.push(add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${num(pg.w)} ${num(pg.h)}] ` +
          `/Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${content} 0 R >>`));
      }
      objs[catalog - 1] = `<< /Type /Catalog /Pages ${pages} 0 R >>`;
      objs[pages - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
      // Every character above is one byte, so string lengths are byte offsets.
      let out = '%PDF-1.4\n%âãÏÓ\n';
      const offsets = [];
      objs.forEach((s, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${s}\nendobj\n`; });
      const xref = out.length;
      out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
      out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
      const bytes = new Uint8Array(out.length);
      for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
      return bytes;
    }
    blob() { return new Blob([this.bytes()], { type: 'application/pdf' }); }
  }

  window.PdfDoc = PdfDoc;
})();
