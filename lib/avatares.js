// @arquivo  avatares.js: lista dos 30 avatares de criança (preset:k01 a k30).
// @tipo     regra
// @usado-por components/Avatar.js, components/AvatarUpload.js
// Avatares prontos, só para quem tem o Modo criança ligado.
// Guardados no banco como "preset:k01" a "preset:k30". Os desenhos ficam em public/avatares/crianca/.
// Avatares antigos ("preset:m1", "preset:d1") não aparecem mais: a pessoa passa a mostrar a inicial.
export const CRIANCAS = [
  ['k01', 'Menina de pele clara e cabelo preto comprido'],
  ['k02', 'Menino de black power'],
  ['k03', 'Menino de pele clara, cabelo preto espetado e óculos'],
  ['k04', 'Menina de trancinhas'],
  ['k05', 'Menino loiro de cabelo curto'],
  ['k06', 'Menina de maria-chiquinha castanha'],
  ['k07', 'Menino ruivo de topete e sardas'],
  ['k08', 'Menina de black power com laço'],
  ['k09', 'Menino de pele clara e cabelo preto de lado'],
  ['k10', 'Menina de coque'],
  ['k11', 'Menino de cabelo cacheado'],
  ['k12', 'Menina ruiva de cabelo comprido e óculos'],
  ['k13', 'Menino de cabelo raspado'],
  ['k14', 'Menina de cabelo chanel com tiara'],
  ['k15', 'Menino de franja loira'],
  ['k16', 'Menina de cabelo cacheado comprido'],
  ['k17', 'Menino de tranças nagô'],
  ['k18', 'Menina de rabo de cavalo loiro'],
  ['k19', 'Menino de cabelo ondulado'],
  ['k20', 'Menina de pele clara e franja preta'],
  ['k21', 'Menino de pele clara, cabelo preto curto e óculos'],
  ['k22', 'Menina de maria-chiquinha preta'],
  ['k23', 'Menino de topete castanho'],
  ['k24', 'Menina de cabelo castanho comprido'],
  ['k25', 'Menino de cabelo espetado ruivo'],
  ['k26', 'Menina de coque loiro e óculos'],
  ['k27', 'Menino de black power e óculos'],
  ['k28', 'Menina de trancinhas ruivas'],
  ['k29', 'Menino de cabelo castanho claro de lado'],
  ['k30', 'Menina de cabelo chanel castanho'],
];
export const ehPreset = (v) => typeof v === 'string' && /^preset:k\d{2}$/.test(v) && CRIANCAS.some((c) => `preset:${c[0]}` === v);

export function formaPreset(id) {
  const c = CRIANCAS.find((x) => x[0] === id);
  return c ? { tipo: 'k', src: `/avatares/crianca/${c[0]}.svg`, nome: c[1] } : null;
}
