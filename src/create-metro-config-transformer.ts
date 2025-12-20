import type { AnyMetroConfig, MutatedType } from "./types.js";
import type { ConfigT as MetroConfig } from "metro-config";

/**
 * Creates a Metro config transformer that can handle all possible Metro config export formats.
 *
 * The transformer preserves the "shape" of the input while applying transformations:
 * - Object input → Object output (or Promise if transformation is async)
 * - Promise input → Promise output
 * - Function input → Function output
 * - Async function input → Async function output
 * - Promise of function input → Promise of function output
 *
 * @param mutate - Function that performs the actual config transformation
 * @returns A transformer function that accepts any Metro config format
 */
export const createMetroConfigTransformer = <TOptions = void>(
  mutate: (
    config: MetroConfig,
    options?: TOptions
  ) => MetroConfig | Promise<MetroConfig>
) => {
  return <T extends AnyMetroConfig>(
    input: T,
    options?: TOptions
  ): MutatedType<T> => {
    // 1. Handle function inputs (sync and async config functions)
    if (typeof input === "function") {
      return ((baseConfig: MetroConfig) => {
        const result = input(baseConfig);
        // Handle both sync and async function results
        if (result instanceof Promise) {
          return result.then((config) => mutate(config, options));
        }
        return mutate(result, options);
      }) as MutatedType<T>;
    }

    // 2. Handle Promise inputs (Promise of object or Promise of function)
    if (input instanceof Promise) {
      return input.then((resolved) => {
        // The resolved value might be a function or an object
        if (typeof resolved === "function") {
          // Return a wrapped function that applies mutation
          return (baseConfig: MetroConfig) => {
            const result = resolved(baseConfig);
            if (result instanceof Promise) {
              return result.then((config) => mutate(config, options));
            }
            return mutate(result, options);
          };
        }
        // It's an object, apply mutation directly
        return mutate(resolved, options);
      }) as MutatedType<T>;
    }

    // 3. Handle object inputs (plain config object)
    return mutate(input, options) as MutatedType<T>;
  };
};
