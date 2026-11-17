import { Blob, File } from "node:buffer";
import { webcrypto } from "node:crypto";
import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";
import { BroadcastChannel } from "node:worker_threads";

class MockIntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds: number[] = [];

  disconnect() {}

  observe() {}

  takeRecords() {
    return [];
  }

  unobserve() {}
}

if (typeof globalThis.PointerEvent === "undefined" && typeof MouseEvent !== "undefined") {
  class MockPointerEvent extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? "mouse";
    }
  }

  Object.defineProperty(globalThis, "PointerEvent", {
    value: MockPointerEvent,
    configurable: true,
    writable: true,
  });
}

// jsdom expõe apenas `crypto.getRandomValues`; a criptografia do cache usa
// `crypto.subtle` (Web Crypto), fornecido pela implementação do Node.
if (typeof globalThis.crypto?.subtle === "undefined") {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
    writable: true,
  });
}

Object.defineProperties(globalThis, {
  Blob: { value: Blob, configurable: true },
  BroadcastChannel: { value: BroadcastChannel, configurable: true },
  File: { value: File, configurable: true },
  IntersectionObserver: {
    value: MockIntersectionObserver,
    configurable: true,
  },
  ReadableStream: { value: ReadableStream, configurable: true },
  TextDecoder: { value: TextDecoder, configurable: true },
  TextEncoder: { value: TextEncoder, configurable: true },
  TransformStream: { value: TransformStream, configurable: true },
  WritableStream: { value: WritableStream, configurable: true },
});
