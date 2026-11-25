#!/usr/bin/env bash
# @arquivo  conferir-so-comentarios.sh: prova que um PR de documentação só mexeu em comentários.
# @tipo     infra
# @uso      bash docs/conferir-so-comentarios.sh [base]   (base = branch de comparação, padrão origin/main)
# Compara cada arquivo .js/.mjs alterado, antes e depois, SEM comentários e SEM linhas em branco.
set -euo pipefail
BASE="${1:-origin/main}"
tira() { # lê o código no stdin, tira comentários // e /* */ e linhas vazias
  node -e '
    const s=require("fs").readFileSync(0,"utf8");
    let o="",i=0,q=null;
    while(i<s.length){const c=s[i],d=s[i+1];
      if(q){o+=c;if(c==="\\"){o+=d;i+=2;continue}if(c===q)q=null;i++;continue}
      if(c==="\""||c==="\x27"||c==="`"){q=c;o+=c;i++;continue}
      if(c==="/"&&d==="/"){while(i<s.length&&s[i]!=="\n")i++;continue}
      if(c==="/"&&d==="*"){i+=2;while(i<s.length&&!(s[i]==="*"&&s[i+1]==="/"))i++;i+=2;continue}
      o+=c;i++}
    process.stdout.write(o.split("\n").map(l=>l.trim()).filter(Boolean).join("\n"))'
}
ruim=0
for f in $(git diff --name-only "$BASE"...HEAD -- '*.js' '*.mjs'); do
  git cat-file -e "$BASE:$f" 2>/dev/null || continue
  a=$(git show "$BASE:$f" | tira); b=$(tira < "$f")
  if [ "$a" != "$b" ]; then echo "MUDOU CÓDIGO: $f"; ruim=1; fi
done
[ $ruim = 0 ] && echo "OK: só comentários mudaram." || { echo "ATENÇÃO: veja os arquivos acima."; exit 1; }
