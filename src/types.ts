import type { ConfigT as MetroConfig } from "metro-config";

type MetroConfigObject = MetroConfig;
type MetroConfigPromise = Promise<MetroConfig>;
type MetroConfigFunction = (baseConfig: MetroConfig) => MetroConfig;
type MetroConfigAsyncFunction = (
  baseConfig: MetroConfig
) => Promise<MetroConfig>;
type MetroConfigPromiseOfFunction = Promise<
  MetroConfigFunction | MetroConfigAsyncFunction
>;

export type AnyMetroConfig =
  | MetroConfigObject
  | MetroConfigPromise
  | MetroConfigFunction
  | MetroConfigAsyncFunction
  | MetroConfigPromiseOfFunction;

// Transformer composition types
type Transformer<TOptions = void> = <T extends AnyMetroConfig>(
  input: T,
  options?: TOptions
) => MutatedType<T>;

type TransformerWithOptions<TOptions = unknown> = [
  Transformer<TOptions>,
  TOptions,
];

export type TransformerEntry =
  | Transformer<void>
  | TransformerWithOptions<unknown>;

// Type inference helpers for mutator return types
export type MutatedType<T> = T extends MetroConfigObject
  ? MetroConfig | Promise<MetroConfig> // Object can become Promise if mutation is async
  : T extends MetroConfigPromise
    ? Promise<MetroConfig> // Promise stays Promise
    : T extends MetroConfigFunction
      ? (baseConfig: MetroConfig) => MetroConfig | Promise<MetroConfig> // Function stays function
      : T extends MetroConfigAsyncFunction
        ? (baseConfig: MetroConfig) => Promise<MetroConfig> // Async function stays async function
        : T extends MetroConfigPromiseOfFunction
          ? Promise<
              (baseConfig: MetroConfig) => MetroConfig | Promise<MetroConfig>
            > // Promise of function stays Promise of function
          : never;
