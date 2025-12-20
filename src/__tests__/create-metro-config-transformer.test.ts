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
    update: mock(),
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
    getTransformOptions: mock(),
    transformVariants: {},
    workerPath: "",
    publicPath: "",
  } as any,
  serializer: {
    createModuleIdFactory: mock(() => mock(() => 0)),
    customSerializer: null,
    experimentalSerializerHook: mock(),
    getModulesRunBeforeMainModule: mock(() => []),
    getPolyfills: mock(() => []),
    getRunModuleStatement: mock(() => ""),
    polyfillModuleNames: [],
    processModuleFilter: mock(() => true),
    isThirdPartyModule: mock(() => false),
  },
  server: {
    enhanceMiddleware: mock((middleware) => middleware),
    forwardClientLogs: false,
    port: 8081,
    rewriteRequestUrl: mock((url) => url),
    unstable_serverRoot: null,
    useGlobalHotkey: false,
    verifyConnections: false,
  },
  symbolicator: {
    customizeFrame: mock(() => undefined),
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

describe("createMetroConfigTransformer", () => {
  describe("input type handling", () => {
    it("1.1 should transform MetroConfigObject directly", () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        testProperty: "added",
      }));

      const input = createTestConfig();
      const result = transformer(input);

      expect(result).toHaveProperty("testProperty", "added");
      expect(result).toHaveProperty("projectRoot", "/test");
    });

    it("1.2 should await and transform Promise<MetroConfigObject>", async () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        asyncProperty: "added",
      }));

      const input = Promise.resolve(createTestConfig());
      const result = await transformer(input);

      expect(result).toHaveProperty("asyncProperty", "added");
    });

    it("1.3 should wrap sync MetroConfigFunction", () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        functionProperty: "added",
      }));

      const input = (baseConfig: MetroConfig) => ({
        ...baseConfig,
        originalFunction: true,
      });

      const result = transformer(input);
      const finalConfig = result(createTestConfig());

      expect(finalConfig).toHaveProperty("originalFunction", true);
      expect(finalConfig).toHaveProperty("functionProperty", "added");
    });

    it("1.4 should wrap async MetroConfigAsyncFunction", async () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        asyncFunctionProperty: "added",
      }));

      const input = async (baseConfig: MetroConfig) => ({
        ...baseConfig,
        originalAsyncFunction: true,
      });

      const result = transformer(input);
      const finalConfig = await result(createTestConfig());

      expect(finalConfig).toHaveProperty("originalAsyncFunction", true);
      expect(finalConfig).toHaveProperty("asyncFunctionProperty", "added");
    });

    it("1.5 should handle Promise<MetroConfigFunction>", async () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        promiseFunctionProperty: "added",
      }));

      const input = Promise.resolve((baseConfig: MetroConfig) => ({
        ...baseConfig,
        originalPromiseFunction: true,
      }));

      const result = await transformer(input);
      const finalConfig = result(createTestConfig());

      expect(finalConfig).toHaveProperty("originalPromiseFunction", true);
      expect(finalConfig).toHaveProperty("promiseFunctionProperty", "added");
    });

    it("1.6 should handle Promise<MetroConfigAsyncFunction>", async () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        promiseAsyncFunctionProperty: "added",
      }));

      const input = Promise.resolve(async (baseConfig: MetroConfig) => ({
        ...baseConfig,
        originalPromiseAsyncFunction: true,
      }));

      const result = await transformer(input);
      const finalConfig = await result(createTestConfig());

      expect(finalConfig).toHaveProperty("originalPromiseAsyncFunction", true);
      expect(finalConfig).toHaveProperty(
        "promiseAsyncFunctionProperty",
        "added"
      );
    });
  });

  describe("mutation function variants", () => {
    it("2.1 should work with sync mutation", () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        syncMutation: true,
      }));

      const result = transformer(createTestConfig());
      expect(result).toHaveProperty("syncMutation", true);
    });

    it("2.2 should work with async mutation", async () => {
      const transformer = createMetroConfigTransformer(async (config) => ({
        ...config,
        asyncMutation: true,
      }));

      const result = await transformer(createTestConfig());
      expect(result).toHaveProperty("asyncMutation", true);
    });

    it("2.3 should pass options to mutation function", () => {
      const transformer = createMetroConfigTransformer<{ test: string }>(
        (config, options) => ({
          ...config,
          receivedOptions: options,
        })
      );

      const result = transformer(createTestConfig(), { test: "value" });
      expect(result).toHaveProperty("receivedOptions", { test: "value" });
    });

    it("2.4 should work when options is undefined", () => {
      const transformer = createMetroConfigTransformer((config, options) => ({
        ...config,
        optionsWasUndefined: options === undefined,
      }));

      const result = transformer(createTestConfig());
      expect(result).toHaveProperty("optionsWasUndefined", true);
    });
  });

  describe("shape preservation", () => {
    it("3.1 object input returns object or awaitable promise", async () => {
      const syncTransformer = createMetroConfigTransformer((config) => ({
        ...config,
        sync: true,
      }));

      const asyncTransformer = createMetroConfigTransformer(async (config) => ({
        ...config,
        async: true,
      }));

      const syncResult = syncTransformer(createTestConfig());
      const asyncResult = await asyncTransformer(createTestConfig());

      expect(syncResult).toHaveProperty("sync", true);
      expect(asyncResult).toHaveProperty("async", true);
    });

    it("3.2 function input returns callable function", () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        transformed: true,
      }));

      const input = (baseConfig: MetroConfig) => baseConfig;
      const result = transformer(input);

      expect(typeof result).toBe("function");
      const finalConfig = result(createTestConfig());
      expect(finalConfig).toHaveProperty("transformed", true);
    });

    it("3.3 function input receives baseConfig parameter correctly", () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        receivedBaseConfig: true,
      }));

      const input = (baseConfig: MetroConfig) => baseConfig;
      const result = transformer(input);

      const customBaseConfig = { ...createTestConfig(), customProp: "test" };
      const finalConfig = result(customBaseConfig);

      expect(finalConfig).toHaveProperty("customProp", "test");
      expect(finalConfig).toHaveProperty("receivedBaseConfig", true);
    });

    it("3.4 promise input returns awaitable result", async () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        fromPromise: true,
      }));

      const input = Promise.resolve(createTestConfig());
      const result = transformer(input);

      expect(result).toBeInstanceOf(Promise);
      const finalConfig = await result;
      expect(finalConfig).toHaveProperty("fromPromise", true);
    });
  });

  describe("mutation application", () => {
    it("4.1 should add new properties", () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        newProperty: "added",
      }));

      const result = transformer(createTestConfig());
      expect(result).toHaveProperty("newProperty", "added");
    });

    it("4.2 should modify existing properties", () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        projectRoot: "/modified",
      }));

      const result = transformer(createTestConfig());
      expect(result).toHaveProperty("projectRoot", "/modified");
    });

    it("4.3 should handle nested property mutation", () => {
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        serializer: {
          ...config.serializer,
          customSerializer: mock(),
        },
      }));

      const result = transformer(createTestConfig());
      const config = result as MetroConfig;
      expect(config.serializer).toHaveProperty("customSerializer");
      expect(typeof config.serializer.customSerializer).toBe("function");
    });

    it("4.4 should not modify original config", () => {
      const originalConfig = createTestConfig();
      const transformer = createMetroConfigTransformer((config) => ({
        ...config,
        newProperty: "added",
      }));

      transformer(originalConfig);

      expect(originalConfig).not.toHaveProperty("newProperty");
    });
  });
});
