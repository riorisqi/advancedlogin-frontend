/** `start` rejects with CameraUnavailableError when the camera can't be used. */
export interface QrCodeScanner {
  /** Resolves with a stop function: the camera light must go off when we're done. */
  start(video: HTMLVideoElement, onText: (text: string) => void): Promise<() => void>
}
