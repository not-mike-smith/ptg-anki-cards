import fs from 'fs';

type Person = null|'1st'|'2nd'|'3rd';
type Number = null|'singular'|'plural';
type Tense = null|'presente'|'imperfeito'|'pretérito'|'condicional'|'gerundo'|'particípio'|'futuro'|'pessoal'
type Voice = null|'infinitivo'|'indicativo'|'imperativo'|'subjuntivo';

type Column = {
  index: number;
  person: Person;
  number: Number;
  tense: Tense;
  voice: Voice;
};

type Row = {
  index: number;
  verb: string;
  conjugations: string[];
};

const lines = fs.readFileSync('conjugations.csv').toString().split("\r\n");
const personDefs = lines[0].split("\t").map(x => x === '' ? null : x) as Person[];
const numberDefs = lines[1].split("\t").map(x => x === '' ? null : x) as Number[];
const tenseDefs = lines[2].split("\t").map(x => x === '' ? null : x) as Tense[];
const voiceDefs = lines[3].split("\t").map(x => x === '' ? null : x) as Voice[];

const columns: Column[] = personDefs.map((person, i) => ({
  index: i,
  person,
  number: numberDefs[i] as Number,
  tense: tenseDefs[i] as Tense,
  voice: voiceDefs[i] as Voice
}));

const rows: Row[] = lines.slice(4).map((line, i) => {
  const items = line.split("\t");
  return {
    index: i,
    verb: items[0],
    conjugations: items
  };
});

const NUM_REGULAR_VERBS = 8;

type ConjucationCard = {
  id: `${number}_${number}`;
  ifinitive: string;
  conjugated: string;
  column: Column;
};

type ConjugatedCard = {
  id: `${number}_${string}`;
  infinitive: string;
  conjugated: string;
  columns: Column[];
};

const regularConjucationCards: ConjucationCard[] = [];
const irregularConjucationCards: ConjucationCard[] = [];
let cards = regularConjucationCards;
rows.forEach((row) => {
  if (row.index === NUM_REGULAR_VERBS) { cards = irregularConjucationCards; }
  let cIndex = 1;
  row.conjugations.slice(1).forEach((conj) => {
    cards.push({
      id: `${row.index}_${cIndex}`,
      ifinitive: row.verb,
      conjugated: conj,
      column: columns[cIndex]
    });

    cIndex++;
  });
});

function makeIdentifyingConjucationCardsForRow (row: Row): ConjugatedCard[] {
  const dict: {[k: string]: Column[]} = row.conjugations.reduce(
    (d, conj) => {
      d[conj] = [];
      return d;
    },
    {} as {[k: string]: Column[]}
  );

  row.conjugations.forEach((conj, i) => {
    dict[conj].push(columns[i]);
  });

  return Object.keys(dict).map(key => ({
    id: `${row.index}_${key}`,
    infinitive: row.verb,
    conjugated: key,
    columns: dict[key]
  }));
}

const regularConjugatedCards = rows
  .slice(0, NUM_REGULAR_VERBS)
  .flatMap(makeIdentifyingConjucationCardsForRow);

const irregularConjugatedCards = rows
  .slice(NUM_REGULAR_VERBS)
  .flatMap(makeIdentifyingConjucationCardsForRow);

function colDesc (col: Column): string {
  const aspects: string[] = [];
  if (col.person === '1st' && col.number === 'singular') { aspects.push('eu'); }
  else if (col.person === '3rd' && col.number === 'singular') { aspects.push('ele/a (vc)'); }
  else if (col.person === '1st' && col.number === 'plural') { aspects.push('nós'); }
  else if (col.person === '3rd' && col.number === 'plural') { aspects.push('eles/as (vcs)'); }
  else if (col.number === null && col.person) { aspects.push(`${col.person}-pessoa`); }
  else if (col.person === null && col.number) { aspects.push(col.number); }

  aspects.push('|');
  if (col.tense) { aspects.push(col.tense); }
  if (col.voice && col.voice !== 'indicativo') { aspects.push(col.voice); }
  
  return aspects.join(' ');
}

function toConjugationCard (card: ConjucationCard): string {
  return `${card.id}\t${card.ifinitive}\t${colDesc(card.column)}\t${card.conjugated}`;
}

function toConjugatedCard (card: ConjugatedCard): string {
   // Get all descriptions as an HTML list
  const descriptions = card.columns.map(col => 
    `• ${colDesc(col)}`
  ).join('<br>');

  return `${card.id}\t${card.conjugated}\t${card.infinitive}\t${card.columns.length}\t${descriptions}`;
}

fs.writeFileSync("regular-to-conjugated.csv", regularConjucationCards.map(toConjugationCard).join("\n"));
fs.writeFileSync("regular-from-conjugated.csv", regularConjugatedCards.map(toConjugatedCard).join("\n"));
fs.writeFileSync("irregular-to-conjugated.csv", irregularConjucationCards.map(toConjugationCard).join("\n"));
fs.writeFileSync("irregular-from-conjugated.csv", irregularConjugatedCards.map(toConjugatedCard).join("\n"));
