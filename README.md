<div align="center">

<img src="docs/metro-config-transformer.png" alt="Metro Config Transformers Logo" width="120" height="120" />

<h1>Metro Config Transformers</h1>

<p><em>Create Metro config transformers that work in all possible combinations</em></p>

![npm version](https://img.shields.io/npm/v/metro-config-transformers?style=for-the-badge&logo=npm&color=CB3837)
![license](https://img.shields.io/npm/l/metro-config-transformers?style=for-the-badge&logo=github&color=181717)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Metro](https://img.shields.io/badge/Metro-Config-FF6B35?style=for-the-badge&logo=react&logoColor=white)

<br>

🔄 **Handles objects, functions, promises, and any combination with full type safety**

---

</div>

---

## Why this library exists?

Metro config transformers are a powerful way to customize your Metro bundler configuration, but there's a **critical problem**: **there's no standardization** for how transformers should work.

### The problem

1. **No Standardization**: Different transformer libraries handle Metro configs differently. Some expect objects, others expect functions, and some return Promises.

2. **Order dependency issues**: Certain transformers need to return a Promise (async operations), which means they **must be applied last**. However, there's nothing preventing users from calling them first, leading to:

   - Silent failures
   - Runtime errors
   - Frustration and confusion
   - GitHub issues being created unnecessarily

3. **Composition complexity**: Manually composing transformers that handle different input/output types (objects, functions, promises) is error-prone and requires deep understanding of Metro's internals.

### The solution

This library serves as a **foundation for config transformers**, ensuring they work correctly in all possible combinations. Developers no longer need to be vigilant about:

- ✅ **Order of transformers** - works correctly regardless of composition order
- ✅ **Input/output types** - handles objects, functions, promises seamlessly
- ✅ **Async operations** - Promise-based transformers work correctly in any position

## Installation

```bash
npm install metro-config-transformers
# or
yarn add metro-config-transformers
# or
pnpm add metro-config-transformers
# or
bun add metro-config-transformers
```

## Usage

### Creating a transformer

Use `createMetroConfigTransformer` to create a transformer that handles all Metro config formats:

```typescript
import { createMetroConfigTransformer } from "metro-config-transformers";
import type { ConfigT as MetroConfig } from "metro-config";

const withCustomTransformer = createMetroConfigTransformer(
  (config: MetroConfig) => {
    return {
      ...config,
      resolver: {
        ...config.resolver,
        sourceExts: [...(config.resolver.sourceExts || []), "custom"],
      },
    };
  }
);

// Works with all config formats:
const config1 = withCustomTransformer({
  /* config object */
});
const config2 = withCustomTransformer(() => ({
  /* config object */
}));
const config3 = withCustomTransformer(
  Promise.resolve({
    /* config object */
  })
);
const config4 = withCustomTransformer(async () => ({
  /* config object */
}));
```

### Async transformers

Transformers can be async and work correctly regardless of order:

```typescript
const withAsyncTransformer = createMetroConfigTransformer(
  async (config: MetroConfig) => {
    const someAsyncData = await fetchSomeData();
    return {
      ...config,
      // Use asyncData in config
    };
  }
);
```

### Transformers with options

Transformers can accept options:

```typescript
const withOptionsTransformer = createMetroConfigTransformer<{
  projectRoot: string;
}>((config: MetroConfig, options) => {
  return {
    ...config,
    projectRoot: options?.projectRoot || config.projectRoot,
  };
});

// Usage
const config = withOptionsTransformer(baseConfig, { projectRoot: __dirname });
```

### Composing multiple transformers

Use `composeMetroConfigTransformers` to combine multiple transformers:

```typescript
import { composeMetroConfigTransformers } from "metro-config-transformers";

const combinedTransformer = composeMetroConfigTransformers(
  withCustomTransformer,
  [withOptionsTransformer, { projectRoot: __dirname }], // Tuple syntax for options
  withAsyncTransformer, // Works correctly even if async!
  anotherTransformer
);

// Apply to your config
module.exports = combinedTransformer(getDefaultConfig(__dirname));
```

## API reference

### `createMetroConfigTransformer<TOptions>(mutate)`

Creates a Metro config transformer that handles all possible config formats.

**Parameters:**

- `mutate`: `(config: MetroConfig, options?: TOptions) => MetroConfig | Promise<MetroConfig>`
  - Function that performs the actual config transformation
  - Can be sync or async

**Returns:** A transformer function that accepts any Metro config format and preserves its "shape":

- Object input → Object output (or Promise if transformation is async)
- Promise input → Promise output
- Function input → Function output
- Async function input → Async function output
- Promise of function input → Promise of function output

### `composeMetroConfigTransformers(...entries)`

Composes multiple transformers together using a Babel-like tuple syntax.

**Parameters:**

- `entries`: Array of `TransformerEntry`
  - Can be a plain transformer function: `withTransformer`
  - Or a tuple with options: `[withTransformer, options]`

**Returns:** A composed transformer function that applies all transformers in sequence

**Type:**

```typescript
type TransformerEntry = Transformer<void> | [Transformer<TOptions>, TOptions];
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

## License

MIT © [Szymon Chmal](https://github.com/v3ron)

## Related

- [Metro Bundler](https://metro.dev/)
