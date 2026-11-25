// @arquivo  exif.js: lê a data em que a foto foi tirada (EXIF) para valer só a foto do dia.
// @tipo     regra
// @usado-por components/Foto.js
// Lê a data em que a foto foi tirada (EXIF DateTimeOriginal) de um JPEG.
// Sem EXIF (prints, fotos repassadas pelo WhatsApp), usa a data do arquivo no aparelho.
export async function dataDaFoto(arquivo) {
  try {
    const buf = await arquivo.slice(0, 256 * 1024).arrayBuffer();
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xffd8) return { data: new Date(arquivo.lastModified), fonte: 'arquivo' };
    let p = 2;
    while (p + 4 < v.byteLength) {
      const marca = v.getUint16(p), tam = v.getUint16(p + 2);
      if (marca === 0xffe1 && v.getUint32(p + 4) === 0x45786966) {
        const d = lerTiff(v, p + 10);
        if (d) return { data: d, fonte: 'exif' };
        break;
      }
      if ((marca & 0xff00) !== 0xff00) break;
      p += 2 + tam;
    }
  } catch { /* cai no plano B */ }
  return { data: new Date(arquivo.lastModified), fonte: 'arquivo' };
}

function lerTiff(v, ini) {
  const le = v.getUint16(ini) === 0x4949;
  const u16 = (o) => v.getUint16(ini + o, le), u32 = (o) => v.getUint32(ini + o, le);
  const texto = (o, n) => { let s = ''; for (let i = 0; i < n - 1; i++) s += String.fromCharCode(v.getUint8(ini + o + i)); return s; };
  const tags = (ifd) => {
    const n = u16(ifd), out = {};
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12, tag = u16(e), cnt = u32(e + 4);
      out[tag] = tag === 0x8769 ? u32(e + 8) : cnt > 4 ? texto(u32(e + 8), cnt) : null;
    }
    return out;
  };
  const ifd0 = tags(u32(4));
  const exif = ifd0[0x8769] ? tags(ifd0[0x8769]) : {};
  const s = exif[0x9003] || exif[0x9004] || ifd0[0x0132];
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(s || '');
  if (!m) return null;
  // Hora local do aparelho, como a câmera grava.
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}
