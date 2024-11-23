import { Word } from "@/server/api/sources/Word";

//We receive a time in seconds and convert it to a readable time format (hh:mm:ss)
export function toReadableTime(
  time: number | undefined,
  { alwaysHours }: { alwaysHours?: boolean } | undefined = {},
) {
  if (!time) return !alwaysHours ? "00:00" : "00:00:00";

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor((time % 3600) % 60);

  const hoursStr =
    hours === 0 && !alwaysHours ? "" : hours < 10 ? `0${hours}:` : `${hours}:`;
  const minutesStr = minutes < 10 ? `0${minutes}:` : `${minutes}:`;
  const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return `${hoursStr}${minutesStr}${secondsStr}`;
}

/*
 ******
 Join the words into sentences of fixed length
 We get the words and the start and end time of each word
 But we want to group the words into sentences for multiple reasons:
 - In order to generate the rolling subtitles.
 - It is easier to make the beam search suggestions.
 The end result we want is a list of sentences, with the following structure:
 {
     "text": "This is a sentence",
     "start": 0,
     "end": 1000,
     "words": [
         {
             "word": "This",
             "start": 0,
             "end": 100
         },
         {
             "word": "is",
             "start": 100,
             "end": 200
         },
         ...
     ]
 }

 We determine if we have to go to the next line based on three criteria:
 - The maximum number of characters per line.
 - The maximum duration of a line in seconds.
   If it takes to long, even if the are less words, we go to the next line
 - The maximum gap between words. If there is a gap between words where no one
   is speaking, we go to the next line.
*/
export type Line = {
  text: string;
  start: number;
  end: number;
  words: Word[];
};
type WordsIntoLinesOptions = {
  maxChars: number;
  maxDuration: number;
  maxGap: number;
};
const defaultWordsIntoLinesOptions: WordsIntoLinesOptions = {
  maxChars: 15,
  maxDuration: 2500,
  maxGap: 1500,
};
export function wordsIntoLines(
  words: Word[],
  inputOptions: Partial<WordsIntoLinesOptions> = defaultWordsIntoLinesOptions,
) {
  const options = { ...defaultWordsIntoLinesOptions, ...inputOptions };

  const lines: Line[] = [];
  let line: Word[] = [];

  let lineDuration = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!;
    const start = word.start;
    const end = word.end;

    line.push(word);

    lineDuration += end - start;
    const lineStr = line.map((item) => item.word).join(" ");

    const duration_exceeded = lineDuration > options.maxDuration;
    const chars_exceeded = lineStr.length > options.maxChars;

    let maxgap_exceeded = false;
    if (i > 0) {
      const gap = word.start - words[i - 1]!.end;
      maxgap_exceeded = gap > options.maxGap;
    }

    const shouldFinishLine =
      duration_exceeded || chars_exceeded || maxgap_exceeded;
    if (shouldFinishLine && line.length > 0) {
      lines.push({
        text: line.map((item) => item.word).join(" "),
        start: line[0]!.start,
        end: line[line.length - 1]!.end,
        words: line,
      });

      line = [];
      lineDuration = 0;
    }
  }

  if (line.length > 0) {
    lines.push({
      text: line.map((item) => item.word).join(" "),
      start: line[0]!.start,
      end: line[line.length - 1]!.end,
      words: line,
    });
  }

  return lines;
}
