// This file exists for backwards-compatibility in the client package.
// The canonical SceneChangeEvent types live in @duckengine/core.

export type {
  SceneChangeEventBase as SceneChangeEvent,
  SceneChangeErrorEvent,
  SceneChangeEventWithError,
} from "@duckengine/core";

export type { SceneChangeEventWithError as default } from "@duckengine/core";
