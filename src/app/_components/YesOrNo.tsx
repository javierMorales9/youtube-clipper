import { useState } from "react";
import { Label } from "./Label";

export function YesOrNo({
  value: initialValue,
  width = "mid",
  onChange,
}: {
  value: boolean,
  width?: "small" | "mid" | "full",
  onChange: (value: boolean) => void
}) {

  const [value, setValue] = useState(initialValue);

  const handleClick = (choice: boolean) => {
    setValue(choice);
    onChange(choice);
  }

  const choices = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' }
  ];

  console.log(value);
  return (
    <div className="inline-block">
      <div className="flex flex-row rounded-md border border-gray-300">
        {choices.map((choice, i) => (
          <Label
            key={choice.label}
            className={`
              cursor-pointer p-2 text-lg flex justify-center
              ${width === "mid" ? "min-w-28" : width === "small" ? "min-w-20" : "w-full"}
              ${i !== 0 && 'border-l border-gray-200'}
              ${i === 0 && 'rounded-l-md'}
              ${i === choices.length - 1 && 'rounded-r-md'}
              ${value === choice.value ? "bg-gray-200" : "bg-white"}
          `}
            onClick={() => handleClick(choice.value)}
          >
            {choice.label}
          </Label>
        ))}
      </div>
    </div>
  );
}

