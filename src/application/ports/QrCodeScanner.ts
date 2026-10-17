/**
 * Reads QR codes from the device camera. Infrastructure decides how (getUserMedia + a decoder);
 * the application only cares about "here's text from a QR code".
 *
 * `start` rejects with CameraUnavailableError when the camera can't be used.
 */
export interface QrCodeScanner {
  /**
   * Starts the camera, shows the preview in `video`, and calls `onText` for every decoded QR.
   * Resolves with a function that stops the camera (the light must go off when we're done).
   */
  start(video: HTMLVideoElement, onText: (text: string) => void): Promise<() => void>
}
