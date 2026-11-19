'use client';
import { useState } from 'react';

// Período e, só quando é "Escolher datas", os campos De e Até.
export default function FiltroPeriodo({ per, de, ate }) {
  const [p, setP] = useState(per);
  return (
    <>
      <div><label htmlFor="per">Período</label><select id="per" name="per" value={p} onChange={(e) => setP(e.target.value)}>
        <option value="hoje">Hoje</option><option value="semana">Esta semana</option><option value="mes">Este mês</option><option value="30d">Últimos 30 dias</option><option value="livre">Escolher datas</option></select></div>
      {p === 'livre' && <>
        <div><label htmlFor="de">De</label><input id="de" type="date" name="de" defaultValue={de} /></div>
        <div><label htmlFor="ate">Até</label><input id="ate" type="date" name="ate" defaultValue={ate} /></div>
      </>}
    </>
  );
}
