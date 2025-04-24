import { useState } from "react";
import { Label } from "./Label";

export function SingleChoice({
  value: initialValue,
  choices,
  onChange,
}: {
  value: string,
  choices: string[],
  onChange: (value: string) => void
}) {

  const [value, setValue] = useState(initialValue);

  const handleClick = (choice: string) => {
    setValue(choice);
    onChange(choice);
  }

  return (
    <div className="flex flex-row rounded-md border border-gray-300">
      {choices.map((choice, i) => (
        <Label
          key={choice}
          className={
            `w-full cursor-pointer p-2 text-lg flex justify-center
            ${i !== 0 && 'border-l border-gray-200'}
            ${i === 0 && 'rounded-l-md'}
            ${i === choices.length - 1 && 'rounded-r-md'}
            ${value === choice ? "bg-gray-200" : "bg-white"}
          `}
          onClick={() => handleClick(choice)}
        >
          {choice}
        </Label>
      ))}
    </div>
  );
}
