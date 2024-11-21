import { useState } from "react";
import { ChromePicker } from 'react-color'

export function ColorPicker({
  color: initialColor,
  setColor: modifyColor
}: {
  color: string,
  setColor: (color: string) => void
}) {
  const [color, setColor] = useState(initialColor);
  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  return (
    <div>
      <div
        className="w-24 h-12 rounded-md cursor-pointer border border-gray-300"
        style={{ backgroundColor: color }}
        onClick={toggleOpen}
      >
      </div>
      {open && (
        <>
          <div
            onClick={toggleOpen}
            className="absolute top-0 bottom-0 left-0 right-0"
          />
          <ChromePicker
            color={color}
            onChange={(color) => setColor(color.hex)}
            onChangeComplete={(color) => modifyColor(color.hex)}
          />
        </>
      )}
    </div>
  )
}
