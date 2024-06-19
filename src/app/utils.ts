export function toReadableTime(time: number | undefined) {
  if (!time) return "00:00";

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor((time % 3600) % 60);

  const hoursStr = hours === 0 ? "" : hours < 10 ? `0${hours}:` : `${hours}:`;
  const minutesStr = minutes < 10 ? `0${minutes}:` : `${minutes}:`;
  const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

  return `${hoursStr}${minutesStr}${secondsStr}`;
}
