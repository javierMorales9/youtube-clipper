import { env } from "@/env";
import { ProdClipProcessor } from "./ProdClipProcessor";
import { DevClipProcessor } from "./DevClipProcessor";

export function ClipProcessor() {
  if(env.NODE_ENV === "production") 
    return ProdClipProcessor;
  else
    return DevClipProcessor;
}
