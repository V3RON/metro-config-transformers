import type { AnyMetroConfig, MutatedType, TransformerEntry } from "./types.js";

/**
 * Composes multiple Metro config transformers together using a Babel-like tuple syntax.
 *
 * Supports both simple transformers and transformers with options:
 * - Simple: `withRequireProfiler`
 * - With options: `[withExpoAtlas, { projectRoot: __dirname }]`
 *
 * @param entries - Array of transformers, either plain functions or [function, options] tuples
 * @returns A composed transformer function that applies all transformers in sequence
 *
 * @example
 * ```typescript
 * const combinedTransformer = composeMetroConfigTransformers(
 *   withRequireProfiler,
 *   [withExpoAtlas, { projectRoot: __dirname }],
 *   withReduxDevTools
 * );
 *
 * module.exports = combinedTransformer(getDefaultConfig(__dirname));
 * ```
 */
export const composeMetroConfigTransformers = (
  ...entries: TransformerEntry[]
) => {
  return <T extends AnyMetroConfig>(input: T): MutatedType<T> => {
    // Reduce through all transformers, chaining them together
    return entries.reduce<AnyMetroConfig>((acc, entry) => {
      // Check if entry is a tuple [transformer, options] or plain transformer
      if (Array.isArray(entry)) {
        const [transformer, options] = entry;
        return transformer(acc, options) as unknown as AnyMetroConfig;
      }
      return entry(acc) as unknown as AnyMetroConfig;
    }, input) as unknown as MutatedType<T>;
  };
};
