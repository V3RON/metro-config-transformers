import { describe, it, expect, mock } from "bun:test";
import type { ConfigT as MetroConfig } from "metro-config";
import {
  createMetroConfigTransformer,
  composeMetroConfigTransformers,
} from "../index.js";

// Mock Metro config for testing
const mockMetroConfig = {
  projectRoot: "/test",
  watchFolders: [],
  cacheStores: [],
  cacheVersion: "1.0.0",
  maxWorkers: 1,
  stickyWorkers: false,
  transformerPath: "",
  reporter: {
    update: () => {},
  } as any,
  resetCache: false,
  resolver: {
    assetExts: [],
    assetResolutions: [],
    blockList: [],
    disableHierarchicalLookup: false,
    extraNodeModules: {},
    emptyModulePath: "",
    enableGlobalPackages: false,
    nodeModulesPaths: [],
    platforms: [],
    resolverMainFields: [],
    sourceExts: [],
    unstable_conditionNames: [],
    unstable_conditionsByPlatform: {},
    unstable_enablePackageExports: false,
    useWatchman: false,
    requireCycleIgnorePatterns: [],
  },
  transformer: {
    getTransformOptions: () => {},
    transformVariants: {},
    workerPath: "",
    publicPath: "",
  } as any,
  serializer: {
    createModuleIdFactory: () => () => 0,
    customSerializer: null,
    experimentalSerializerHook: () => {},
    getModulesRunBeforeMainModule: () => [],
    getPolyfills: () => [],
    getRunModuleStatement: () => "",
    polyfillModuleNames: [],
    processModuleFilter: () => true,
    isThirdPartyModule: () => false,
  },
  server: {
    enhanceMiddleware: (middleware: any) => middleware,
    forwardClientLogs: false,
    port: 8081,
    rewriteRequestUrl: (url: string) => url,
    unstable_serverRoot: null,
    useGlobalHotkey: false,
    verifyConnections: false,
  },
  symbolicator: {
    customizeFrame: () => undefined,
  },
  watcher: {
    additionalExts: [],
    watchman: {
      deferStates: [],
    },
    healthCheck: {
      enabled: false,
      interval: 0,
      timeout: 0,
      filePrefix: "",
    },
    unstable_autoSaveCache: {
      enabled: false,
    },
  },
} as MetroConfig;

// Helper to create a test config
const createTestConfig = (): MetroConfig => ({
  ...mockMetroConfig,
});

describe("composeMetroConfigTransformers", () => {
  describe("basic composition", () => {
    it("5.1 should return identity for empty entries", () => {
      const composed = composeMetroConfigTransformers();
      const input = createTestConfig();
      const result = composed(input);

      expect(result).toEqual(input);
    });

    it("5.2 should apply single transformer", () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        single: true,
      }));

      const composed = composeMetroConfigTransformers(transformer);
      const result = composed(createTestConfig());

      expect(result).toHaveProperty("single", true);
    });

    it("5.3 should chain multiple transformers", () => {
      const transformer1 = createMetroConfigTransformer((config) => ({
        ...config,
        step1: true,
      }));

      const transformer2 = createMetroConfigTransformer((config) => ({
        ...config,
        step2: true,
      }));

      const transformer3 = createMetroConfigTransformer((config) => ({
        ...config,
        step3: true,
      }));

      const composed = composeMetroConfigTransformers(
        transformer1,
        transformer2,
        transformer3
      );
      const result = composed(createTestConfig());

      expect(result).toHaveProperty("step1", true);
      expect(result).toHaveProperty("step2", true);
      expect(result).toHaveProperty("step3", true);
    });

    it("5.4 should apply transformers in order", () => {
      const transformer1 = createMetroConfigTransformer((config) => ({
        ...config,
        order: ["step1"],
      }));

      const transformer2 = createMetroConfigTransformer((config) => ({
        ...config,
        order: [...(config as any).order, "step2"],
      }));

      const transformer3 = createMetroConfigTransformer((config) => ({
        ...config,
        order: [...(config as any).order, "step3"],
      }));

      const composed = composeMetroConfigTransformers(
        transformer1,
        transformer2,
        transformer3
      );
      const result = composed(createTestConfig());

      expect(result).toHaveProperty("order", ["step1", "step2", "step3"]);
    });
  });

  describe("tuple syntax", () => {
    it("6.1 should work with plain function entry", () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        plain: true,
      }));

      const composed = composeMetroConfigTransformers(transformer);
      const result = composed(createTestConfig());

      expect(result).toHaveProperty("plain", true);
    });

    it("6.2 should pass options from tuple", () => {
      const transformer = createMetroConfigTransformer<{ test: string }>(
        (config, options) => ({
          ...config,
          options: options,
        })
      );

      const composed = composeMetroConfigTransformers([
        transformer,
        { test: "value" },
      ] as any);
      const result = composed(createTestConfig());

      expect(result).toHaveProperty("options", { test: "value" });
    });

    it("6.3 should handle mixed entries", () => {
      const transformer1 = createMetroConfigTransformer((config) => ({
        ...config,
        plain: true,
      }));

      const transformer2 = createMetroConfigTransformer<{ mixed: string }>(
        (config, options) => ({
          ...config,
          options: options,
        })
      );

      const transformer3 = createMetroConfigTransformer((config) => ({
        ...config,
        final: true,
      }));

      const composed = composeMetroConfigTransformers(
        transformer1,
        [transformer2, { mixed: "test" }] as any,
        transformer3
      );

      const result = composed(createTestConfig());

      expect(result).toHaveProperty("plain", true);
      expect(result).toHaveProperty("options", { mixed: "test" });
      expect(result).toHaveProperty("final", true);
    });

    it("6.4 should handle different option types", () => {
      const transformer = createMetroConfigTransformer<any>(
        (config, options) => ({
          ...config,
          options,
        })
      );

      const testCases = [
        { input: "string", expected: "string" },
        { input: 42, expected: 42 },
        { input: true, expected: true },
        { input: { nested: "object" }, expected: { nested: "object" } },
        { input: ["array"], expected: ["array"] },
      ];

      testCases.forEach(({ input, expected }) => {
        const composed = composeMetroConfigTransformers([
          transformer,
          input,
        ] as any);
        const result = composed(createTestConfig());
        expect(result).toHaveProperty("options", expected);
      });
    });
  });

  describe("input type handling with composition", () => {
    it("7.1 should work with object input", () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        objectInput: true,
      }));

      const composed = composeMetroConfigTransformers(transformer);
      const result = composed(createTestConfig());

      expect(result).toHaveProperty("objectInput", true);
    });

    it("7.2 should work with promise input", async () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        promiseInput: true,
      }));

      const composed = composeMetroConfigTransformers(transformer);
      const input = Promise.resolve(createTestConfig());
      const result = await composed(input);

      expect(result).toHaveProperty("promiseInput", true);
    });

    it("7.3 should work with function input", () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        functionInput: true,
      }));

      const composed = composeMetroConfigTransformers(transformer);
      const input = (baseConfig: MetroConfig) => baseConfig;
      const result = composed(input);

      const finalConfig = result(createTestConfig());
      expect(finalConfig).toHaveProperty("functionInput", true);
    });

    it("7.4 should work with async function input", async () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        asyncFunctionInput: true,
      }));

      const composed = composeMetroConfigTransformers(transformer);
      const input = async (baseConfig: MetroConfig) => baseConfig;
      const result = composed(input);

      const finalConfig = await result(createTestConfig());
      expect(finalConfig).toHaveProperty("asyncFunctionInput", true);
    });
  });

  describe("async handling in composition", () => {
    it("8.1 should return sync result for all sync transformers", () => {
      const transformer1 = createMetroConfigTransformer((config) => ({
        ...config,
        step1: true,
      }));

      const transformer2 = createMetroConfigTransformer((config) => ({
        ...config,
        step2: true,
      }));

      const composed = composeMetroConfigTransformers(
        transformer1,
        transformer2
      );
      const result = composed(createTestConfig());

      expect(result).toHaveProperty("step1", true);
      expect(result).toHaveProperty("step2", true);
    });

    it("8.2 should handle single async transformer", async () => {
      const transformer = createMetroConfigTransformer(async (config) => ({
        ...config,
        asyncSingle: true,
      }));

      const composed = composeMetroConfigTransformers(transformer);
      const result = await composed(createTestConfig());

      expect(result).toHaveProperty("asyncSingle", true);
    });

    it("8.3 should chain multiple async transformers", async () => {
      const transformer1 = createMetroConfigTransformer(async (config) => ({
        ...config,
        async1: true,
      }));

      const transformer2 = createMetroConfigTransformer(async (config) => ({
        ...config,
        async2: true,
      }));

      const composed = composeMetroConfigTransformers(
        transformer1,
        transformer2
      );
      const result = await composed(createTestConfig());

      expect(result).toHaveProperty("async1", true);
      expect(result).toHaveProperty("async2", true);
    });

    it("8.4 should handle async in middle of sync transformers", async () => {
      const sync1 = createMetroConfigTransformer((config) => ({
        ...config,
        sync1: true,
      }));

      const asyncTransformer = createMetroConfigTransformer(async (config) => ({
        ...config,
        asyncMiddle: true,
      }));

      const sync2 = createMetroConfigTransformer((config) => ({
        ...config,
        sync2: true,
      }));

      const composed = composeMetroConfigTransformers(
        sync1,
        asyncTransformer,
        sync2
      );
      const result = await composed(createTestConfig());

      expect(result).toHaveProperty("sync1", true);
      expect(result).toHaveProperty("asyncMiddle", true);
      expect(result).toHaveProperty("sync2", true);
    });
  });

  describe("real-world scenarios", () => {
    it("9.1 should handle serializer chain", () => {
      const addPolyfills = createMetroConfigTransformer((config) => ({
        ...config,
        serializer: {
          ...config.serializer,
          getPolyfills: () => ["polyfill1", "polyfill2"],
        },
      }));

      const addCustomSerializer = createMetroConfigTransformer((config) => ({
        ...config,
        serializer: {
          ...config.serializer,
          customSerializer: mock(),
        },
      }));

      const composed = composeMetroConfigTransformers(
        addPolyfills,
        addCustomSerializer
      );
      const result = composed(createTestConfig());
      const config = result as MetroConfig;

      expect(config.serializer).toHaveProperty("getPolyfills");
      expect(config.serializer).toHaveProperty("customSerializer");
      expect(typeof config.serializer.customSerializer).toBe("function");
    });

    it("9.2 should handle middleware composition", () => {
      const addMiddleware1 = createMetroConfigTransformer((config) => ({
        ...config,
        server: {
          ...config.server,
          middleware1: true,
        },
      }));

      const addMiddleware2 = createMetroConfigTransformer((config) => ({
        ...config,
        server: {
          ...config.server,
          middleware2: true,
        },
      }));

      const composed = composeMetroConfigTransformers(
        addMiddleware1,
        addMiddleware2
      );
      const result = composed(createTestConfig());
      const config = result as MetroConfig;

      expect(config.server).toHaveProperty("middleware1", true);
      expect(config.server).toHaveProperty("middleware2", true);
    });

    it("9.3 should simulate full pipeline", () => {
      // Simulate withRequireProfiler
      const withRequireProfiler = createMetroConfigTransformer((config) => ({
        ...config,
        serializer: {
          ...config.serializer,
          requireProfiler: true,
        },
      }));

      // Simulate withExpoAtlas
      const withExpoAtlas = createMetroConfigTransformer((config, options) => ({
        ...config,
        server: {
          ...config.server,
          expoAtlas: options,
        },
      }));

      // Simulate withReduxDevTools
      const withReduxDevTools = createMetroConfigTransformer((config) => ({
        ...config,
        reduxDevTools: true,
      }));

      const composed = composeMetroConfigTransformers(
        withRequireProfiler,
        [withExpoAtlas, { port: 8081 }] as any,
        withReduxDevTools
      );

      const result = composed(createTestConfig());
      const config = result as MetroConfig;

      expect(config.serializer).toHaveProperty("requireProfiler", true);
      expect(config.server).toHaveProperty("expoAtlas", { port: 8081 });
      expect(config).toHaveProperty("reduxDevTools", true);
    });
  });
});
