export const Displays = {
  One: {
    name: 'One',
    //image: '/public/images/displays/one.png',
    elements: [
      {
        x: 0,
        y: 0,
        width: 270,
        height: 480,
      },
    ],
  },
  TwoColumn: {
    name: 'TwoColumn',
    //image: '/public/images/displays/two-column.png',
    elements: [
      {
        x: 0,
        y: 0,
        width: 270,
        height: 240,
      },
      {
        x: 0,
        y: 240,
        width: 270,
        height: 240,
      },
    ],
  },
  TwoRow: {
    name: 'TwoRow',
    //image: '/public/images/displays/two-row.png',
    elements: [
      {
        x: 0,
        y: 0,
        width: 135,
        height: 480,
      },
      {
        x: 135,
        y: 0,
        width: 135,
        height: 480,
      },
    ],
  },
};

export type DisplayKey = keyof typeof Displays;

