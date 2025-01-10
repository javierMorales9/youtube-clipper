import { Line } from "@/app/utils";
import { useState } from "react";
import { Label } from "@/app/_components/common/Label";
import { NewInput } from "@/app/_components/common/NewInput";
import { ClipType, SectionType, DisplayName, ThemeEmojiPosition, ThemeFont, ThemeShadow, ThemeStroke } from "@/server/entities/clip/domain/Clip";
import { ColorPicker } from "@/app/_components/common/ColorPicker";
import { SingleChoice } from "@/app/_components/common/SingleChoice";
import { YesOrNo } from "@/app/_components/common/YesOrNo";
import { NewSelect } from "@/app/_components/common/NewSelect";
import { useFormContext } from "react-hook-form";
import { Timer } from "@/app/_components/useTimer";

export const DisplaysImages = {
  [DisplayName.One]: "/images/One.png",
  [DisplayName.TwoColumn]: "/images/TwoColumns.png",
  [DisplayName.TwoRow]: "/images/TwoRows.png",
};


export function Menu({
  lines,
  timer,
  start,
  section,
  changeDisplay
}: {
  lines: Line[],
  timer: Timer,
  start: number,
  section: SectionType | undefined,
  changeDisplay: (newDisplay: DisplayName) => void
}) {
  const menuViews = ["Display", "Translations", "Theme"] as const;
  const [menuView, setMenuView] = useState<typeof menuViews[number]>(menuViews[0]);

  return (
    <div className="h-full w-1/3 flex flex-col gap-y-2">
      <div className="flex space-x-4 bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        {menuViews.map((tab) => (
          <button
            key={tab}
            onClick={() => setMenuView(tab)}
            className={`px-4 py-2 rounded-md text font-medium 
                    ${menuView === tab
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
              }
                  `}
          >
            {tab}
          </button>
        ))}
      </div>
      {menuView === "Display" && (
        <DisplaysSelector
          section={section}
          changeDisplay={changeDisplay}
        />
      )}
      {menuView === "Translations" && (
        <Translations
          lines={lines}
          startTime={start * 1000}
          timer={timer}
        />
      )}
      {menuView === "Theme" && (
        <Theme />
      )}
    </div>
  );
}

function Translations({
  lines,
  startTime,
  timer,
}: {
  lines: Line[],
  startTime: number,
  timer: Timer,
}) {

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-y-scroll">
      <div className="w-full flex flex-col gap-y-3">
        {lines.map((line, i) => (
          <Line
            key={i}
            line={line}
            isActive={
              (line.start - startTime) <= timer.currentSeconds * 1000
              && timer.currentSeconds * 1000 <= (line.end - startTime)
            }
          />
        ))}
      </div>
    </div>
  );

  function Line({ line, isActive }: { line: Line, isActive: boolean }) {
    const parseTime = (time: number) => {
      const secondFromStart = ((time - startTime) / 1000);
      const [seconds, milliseconds] = secondFromStart.toString().split('.');

      return `${seconds}.${milliseconds?.substring(0, 2).padEnd(2, '0') ?? '00'}`;
    }
    return (
      <div
        className={`flex flex-col gap-y-1 p-3 cursor-pointer ${isActive && 'bg-blue-100 rounded-xl'}`}
        onClick={() => timer.seek((line.start - startTime) / 1000 + 0.1)}
      >
        <div className="flex flex-row justify-start">
          <span className={`
            flex justify-center px-2 py-1 rounded-2xl text-xs 
            ${isActive ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-500'}
          `}>
            {`${parseTime(line.start)}  -  ${parseTime(line.end)}`}
          </span>
        </div>
        <span className="text-lg flex flex-row gap-x-1">
          {line.words.map((word, i) => (
            <span key={i} className="inline-block hover:bg-gray-100 px-1">
              {word.word}
            </span>
          ))}
        </span>
      </div>
    );
  }
}

function Theme({ }) {
  const { getValues: vals, setValue: setVal, register } = useFormContext<ClipType>();

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col gap-y-10 overflow-y-scroll">
      <div className="flex flex-col gap-y-6">
        <Label className="text-xl">Font</Label>
        <div className="flex flex-row gap-x-5">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="file">Famliy</Label>
            <NewSelect
              options={Object.values(ThemeFont).map((font) => ({ value: font, label: font }))}
              value={vals("theme.themeFont")}
              onSelect={(v) => setVal("theme.themeFont", v as ThemeFont)}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="file">Size</Label>
            <NewInput
              type="number"
              className="border border-gray-200 rounded-lg p-2"
              {...register('theme.themeSize', { valueAsNumber: true })}
            />
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="flex flex-col gap-y-2">
            <Label>Font color</Label>
            <ColorPicker
              color={vals("theme.themeFontColor")}
              setColor={(v) => setVal("theme.themeFontColor", v)}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="file">Uppercase</Label>
            <YesOrNo
              value={vals("theme.themeUpperText")}
              onChange={(v) => setVal("theme.themeUpperText", v)}
            />
          </div>
        </div>
        {/*
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="file">Shadow</Label>
          <SingleChoice
            value={vals("theme.themeShadow")}
            choices={Object.values(ThemeShadow)}
            onChange={(v) => setVal("theme.themeShadow", v as ThemeShadow)}
          />
        </div>
        */}
        <div className="flex flex-row justify-between">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="file">Stroke</Label>
            <SingleChoice
              value={vals("theme.themeStroke")}
              choices={Object.values(ThemeStroke)}
              onChange={(v) => setVal("theme.themeStroke", v as ThemeStroke)}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="file">Stroke color</Label>
            <ColorPicker
              color={vals("theme.themeStrokeColor")}
              setColor={(v) => setVal("theme.themeStrokeColor", v)}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-y-6">
        <Label className="text-xl">Style</Label>
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="file">Position</Label>
          <NewInput
            type="number"
            min={1}
            max={100}
            className="border border-gray-200 rounded-lg p-2"
            {...register('theme.themePosition', { valueAsNumber: true })}
          />
        </div>
        {/*
        <div className="flex flex-row justify-between gap-x-2">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="file">Include emoji</Label>
            <YesOrNo
              value={vals("theme.themeEmoji")}
              width="small"
              onChange={(v) => setVal("theme.themeEmoji", v)}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="file">Emoji Position</Label>
            <SingleChoice
              value={vals("theme.themeEmojiPosition")}
              choices={Object.values(ThemeEmojiPosition)}
              onChange={(v) => setVal("theme.themeEmojiPosition", v as ThemeEmojiPosition)}
            />
          </div>
        </div>
        <div className="flex flex-row justify-between">
          <div className="flex flex-col gap-y-2">
            <Label>Main color</Label>
            <ColorPicker
              color={vals("theme.themeMainColor")}
              setColor={(v) => setVal("theme.themeMainColor", v)}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label>Secondary color</Label>
            <ColorPicker
              color={vals("theme.themeSecondaryColor")}
              setColor={(v) => setVal("theme.themeSecondaryColor", v)}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label>Third color</Label>
            <ColorPicker
              color={vals("theme.themeThirdColor")}
              setColor={(v) => setVal("theme.themeThirdColor", v)}
            />
          </div>
        </div>
        */}
        <div>
        </div>
      </div>
    </div>
  );
}

function DisplaysSelector({
  section,
  changeDisplay,
}: {
  section?: SectionType,
  changeDisplay: (newDisplay: DisplayName) => void,
}) {
  return (
    <div className="bg-white h-full rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="w-full flex flex-wrap flex-col gap-y-5">
        {(Object.keys(DisplayName) as DisplayName[]).map((displayName) => (
          <div
            key={displayName}
            onClick={() => changeDisplay(displayName)}
            className={`
              flex flex-row justify-center items-center cursor-pointer
              gap-x-2 p-2 rounded-lg border border-gray-200
              ${section?.display === displayName
                ? 'bg-blue-100 border-blue-300'
                : 'bg-gray-100 border-gray-300'
              }
            `}
          >
            <img
              className="w-20"
              src={DisplaysImages[displayName]} alt={displayName}
            />
            <span
              className={
                `w-full flex justify-center
              `}
            >
              {displayName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

