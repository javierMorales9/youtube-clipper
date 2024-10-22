import { InputHTMLAttributes } from "react";

export default function Input({
  label,
  placeholder,
  className,
  type = "text",
  error,
  params: { className: _, ...params },
  nextButton,
}: {
  label?: string;
  placeholder?: string;
  className?: string;
  type?: string;
  error?: string;
  params: InputHTMLAttributes<HTMLInputElement>;
  nextButton?: () => JSX.Element;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-y-2">
        {label &&
          <label className="text-md">{label}</label>
        }
        <div className="flex flex-row gap-x-2">
          <input
            {...params}
            type={type}
            placeholder={placeholder}
            className={`border border-gray-300 rounded p-2 ${className} ${_}`}
          />
          {nextButton && nextButton()}
        </div>
      </div>
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
