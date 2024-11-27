import { env } from "@/env";
import { S3Store } from "./S3Store";
import { DevStore } from "./DevStore";

export function Store() {
  if (true || env.NODE_ENV === "production") {
    return S3Store;
  } else {
    return DevStore;
  }
}
