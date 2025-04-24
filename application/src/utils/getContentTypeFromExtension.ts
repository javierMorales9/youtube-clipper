export function getContentTypeFromExtension(extension: string) {
  switch (extension) {
    case "m3u8":
      return "application/vnd.apple.mpegurl";
    case "png":
      return "image/png";
    case "mp4":
      return "video/mp4";
    case "jpg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}
