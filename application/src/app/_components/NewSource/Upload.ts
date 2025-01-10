import { SourceData } from ".";

type Part = {
  PartNumber: number;
  signedUrl: string;
};

// original source: https://github.com/pilovm/multithreaded-uploader/blob/master/frontend/uploader.js
export class Uploader {
  private chunkSize: number;
  private threadsQuantity: number;
  private file: File;
  private videoData: SourceData;
  private aborted: boolean;
  private uploadedSize: number;
  private progressCache: Record<string, number>;
  private activeConnections: Record<string, XMLHttpRequest>;
  private parts: Part[];
  private uploadedParts: any[];
  private id: string | null;
  private onProgressFn: (progress: any) => void;
  private onErrorFn: (error: any) => void;
  private onCompletedFn: (result: any) => void;
  private initiateFn: (parms: {
    name: string;
    parts: number;
  }) => Promise<{ id: string, parts: Part[] }>;
  private completeFn: (parms: { id: string; parts: any[] }) => Promise<any>;

  constructor(options: {
    chunkSize?: number;
    threadsQuantity?: number;
    file: File;
    videoData: SourceData;
    initiate: any;
    complete: any;
  }) {
    // this must be bigger than or equal to 5MB,
    // otherwise AWS will respond with:
    // "Your proposed upload is smaller than the minimum allowed size"
    this.chunkSize = options.chunkSize || 1024 * 1024 * 5;
    // number of parallel uploads
    this.threadsQuantity = Math.min(options.threadsQuantity || 5, 15);
    this.file = options.file;
    this.videoData = options.videoData;
    this.aborted = false;
    this.uploadedSize = 0;
    this.progressCache = {};
    this.activeConnections = {};
    this.parts = [];
    this.uploadedParts = [];
    this.id = null;
    this.onProgressFn = () => {};
    this.onErrorFn = () => {};
    this.onCompletedFn = () => {};
    this.initiateFn = options.initiate;
    this.completeFn = options.complete;
  }

  // starting the multipart upload request
  start() {
    return this.initialize();
  }

  async initialize() {
    try {
      // adding the the file extension (if present) to fileName
      const parts = Math.ceil(this.file.size / this.chunkSize);

      const { id, parts: newParts } = await this.initiateFn({
        ...this.videoData,
        name: this.videoData.name,
        parts,
      });
      this.id = id;
      this.parts.push(...newParts);

      this.sendNext();
    } catch (error) {
      await this.complete(error);
    }
  }

  sendNext() {
    const activeConnections = Object.keys(this.activeConnections).length;

    if (activeConnections >= this.threadsQuantity) {
      return;
    }

    if (this.parts.length === 0) {
      if (!activeConnections) {
        this.complete().catch((error) => console.error(error));
      }

      return;
    }

    const part = this.parts.pop();
    if (this.file && part) {
      const sentSize = (part.PartNumber - 1) * this.chunkSize;
      const chunk = this.file.slice(sentSize, sentSize + this.chunkSize);

      const sendChunkStarted = () => {
        this.sendNext();
      };

      this.sendChunk(chunk, part, sendChunkStarted)
        .then(() => {
          this.sendNext();
        })
        .catch((error) => {
          this.parts.push(part);

          this.complete(error).catch((error) => console.error(error));
        });
    }
  }

  // terminating the multipart upload request on success or failure
  async complete(error: any = null) {
    if (error && !this.aborted) {
      this.onErrorFn(error);
      return;
    }

    if (error) {
      this.onErrorFn(error);
      return;
    }

    try {
      await this.sendCompleteRequest();
    } catch (error) {
      this.onErrorFn(error);
    }
  }

  // finalizing the multipart upload request on success by calling
  // the finalization API
  async sendCompleteRequest() {
    if (this.id) {
      const videoFinalizationMultiPartInput = {
        id: this.id,
        parts: this.uploadedParts,
      };

      const result = await this.completeFn(videoFinalizationMultiPartInput);
      this.onCompletedFn(result);
    }
  }

  sendChunk(chunk: any, part: Part, sendChunkStarted: () => void) {
    return new Promise((resolve, reject) => {
      this.upload(chunk, part, sendChunkStarted)
        .then((status) => {
          if (status !== 200) {
            reject(new Error("Failed chunk upload"));
            return;
          }

          resolve(true);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  // calculating the current progress of the multipart upload request
  handleProgress(part: number, event: { type: string; loaded: number }) {
    if (this.file) {
      if (
        event.type === "progress" ||
        event.type === "error" ||
        event.type === "abort"
      ) {
        this.progressCache[part] = event.loaded;
      }

      if (event.type === "uploaded") {
        this.uploadedSize += this.progressCache[part] || 0;
        delete this.progressCache[part];
      }

      const inProgress = Object.keys(this.progressCache)
        .map(Number)
        .reduce((memo, id) => (memo += this.progressCache[id]!), 0);

      const sent = Math.min(this.uploadedSize + inProgress, this.file.size);

      const total = this.file.size;

      const percentage = Math.round((sent / total) * 100);

      this.onProgressFn({
        sent: sent,
        total: total,
        percentage: percentage,
      });
    }
  }

  // uploading a part through its pre-signed URL
  upload(file: any, part: Part, sendChunkStarted: () => void) {
    // uploading each part with its pre-signed URL
    return new Promise((resolve, reject) => {
      if (this.id) {
        // - 1 because PartNumber is an index starting from 1 and not 0
        const xhr = (this.activeConnections[part.PartNumber - 1] =
          new XMLHttpRequest());

        sendChunkStarted();

        const progressListener = this.handleProgress.bind(
          this,
          part.PartNumber - 1,
        );

        xhr.upload.addEventListener("progress", progressListener);

        xhr.addEventListener("error", progressListener);
        xhr.addEventListener("abort", progressListener);
        xhr.addEventListener("loadend", progressListener);

        xhr.open("PUT", part.signedUrl);

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4 && xhr.status === 200) {
            // retrieving the ETag parameter from the HTTP headers
            const ETag = xhr.getResponseHeader("ETag");

            if (ETag) {
              const uploadedPart = {
                PartNumber: part.PartNumber,
                // removing the " enclosing carachters from
                // the raw ETag
                ETag: ETag.replaceAll('"', ""),
              };

              this.uploadedParts.push(uploadedPart);

              resolve(xhr.status);
              delete this.activeConnections[part.PartNumber - 1];
            }
          }
        };

        xhr.onerror = (error) => {
          reject(error);
          delete this.activeConnections[part.PartNumber - 1];
        };

        xhr.onabort = () => {
          reject(new Error("Upload canceled by user"));
          delete this.activeConnections[part.PartNumber - 1];
        };

        xhr.send(file);
      }
    });
  }

  onProgress(onProgress: any) {
    this.onProgressFn = onProgress;
    return this;
  }

  onError(onError: any) {
    this.onErrorFn = onError;
    return this;
  }

  onCompleted(onCompleted: any) {
    this.onCompletedFn = onCompleted;
    return this;
  }

  abort() {
    Object.keys(this.activeConnections)
      .map(Number)
      .forEach((id) => {
        this.activeConnections[id]!.abort();
      });

    this.aborted = true;
  }
}
