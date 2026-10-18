#!/bin/sh
# Kääntää paperin kummallakin kielellä: paperi_fi.pdf ja paper_en.pdf. Fonttikartat annetaan
# komennossa, koska kaikissa TeX-asennuksissa pdfTeX:n oletuskarttaa ei ole generoitu.
set -e
cd "$(dirname "$0")"
for nimi in paperi_fi paper_en; do
  for i in 1 2 3; do
    pdflatex -interaction=nonstopmode -halt-on-error \
      "\\pdfmapfile{+lm.map}\\pdfmapfile{+symbols.map}\\input{$nimi}" > /dev/null
  done
  rm -f "$nimi.aux" "$nimi.log" "$nimi.out" "$nimi.toc"
  echo "paperi/$nimi.pdf valmis"
done
