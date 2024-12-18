import { env } from "@/env";
import { S3Store } from "./S3Store";
import { DevStore } from "./DevStore";
import { Store } from "../domain/Store";

export function storeFactory(): Store {
  if (env.NODE_ENV === "production") {
    return S3Store;
  } else {
    return DevStore;
  }
}

