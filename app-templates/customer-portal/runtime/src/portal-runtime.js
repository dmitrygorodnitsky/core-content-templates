import { openedModuleIds, modules } from "./modules/index.js";

export class PortalRuntime {
  constructor(options) {
    this.state = options.state;
    this.modules = options.modules || modules;
    this.cache = new Map();
    this.generations = new Map();
    this.inFlight = new Map();
  }

  parseConfig() {
    return this.state.config;
  }

  context() {
    var config = this.parseConfig();
    return {
      state: this.state,
      config: Object.assign({}, config, {
        enabledModules: (config.enabledModules || []).slice(),
      }),
    };
  }

  generation(moduleId) {
    return this.generations.get(moduleId) || 0;
  }

  cancel(moduleId, descriptor, context) {
    this.generations.set(moduleId, this.generation(moduleId) + 1);
    this.cache.delete(moduleId);
    this.inFlight.delete(moduleId);
    if (descriptor.clearProtectedState) descriptor.clearProtectedState(context);
  }

  publish(moduleId, data) {
    this.state.moduleData[moduleId] = data;
    this.state.moduleStatus[moduleId] = data && data.state ? data.state : "ready";
    return data;
  }

  publishDenied(moduleId, descriptor, preflight, context) {
    this.cancel(moduleId, descriptor, context);
    return this.publish(moduleId, descriptor.safeEnvelope(preflight, context));
  }

  cached(moduleId, cacheKey) {
    var cached = cacheKey && this.cache.get(moduleId);
    return cached && cached.cacheKey === cacheKey ? cached.data : null;
  }

  syncPreflight(moduleId) {
    var descriptor = this.modules[moduleId];
    if (!descriptor || !descriptor.preflight) return this.state.moduleData[moduleId] || null;
    var context = this.context();
    var preflight = descriptor.preflight(context);
    if (preflight.status !== "granted") return this.publishDenied(moduleId, descriptor, preflight, context);

    var current = this.state.moduleData[moduleId];
    if (descriptor.asyncOnly && current && current.vertical !== context.config.vertical) {
      this.cancel(moduleId, descriptor, context);
      return this.publish(moduleId, descriptor.loadingEnvelope(context));
    }
    return current || null;
  }

  load(moduleId) {
    var descriptor = this.modules[moduleId];
    if (!descriptor) throw new Error("Unknown module: " + moduleId);

    var context = this.context();
    var preflight = descriptor.preflight && descriptor.preflight(context);
    if (preflight && preflight.status !== "granted") {
      return this.publishDenied(moduleId, descriptor, preflight, context);
    }

    var cacheKey = descriptor.cacheKey && descriptor.cacheKey(context);
    var cached = this.cached(moduleId, cacheKey);
    if (cached) return this.publish(moduleId, cached);

    if (descriptor.asyncOnly) {
      var flight = this.inFlight.get(moduleId);
      if (flight && flight.cacheKey === cacheKey) return this.state.moduleData[moduleId];
      if (descriptor.clearProtectedState) descriptor.clearProtectedState(context);
      return this.publish(moduleId, descriptor.loadingEnvelope(context));
    }

    this.state.moduleStatus[moduleId] = "loading";
    try {
      var adapter = descriptor.adapter(context);
      var raw = adapter.load(moduleId, context);
      if (raw && typeof raw.then === "function") throw new Error("Module " + moduleId + " requires async load");
      var normalized = descriptor.normalize(raw, context);
      if (descriptor.onResult) descriptor.onResult(normalized, context);
      this.cache.set(moduleId, cacheKey ? { cacheKey: cacheKey, data: normalized } : normalized);
      return this.publish(moduleId, normalized);
    } catch (error) {
      this.cache.delete(moduleId);
      if (descriptor.clearProtectedState) descriptor.clearProtectedState(context);
      this.state.moduleStatus[moduleId] = "error";
      this.state.moduleData[moduleId] = descriptor.failureEnvelope ? descriptor.failureEnvelope(context) : null;
      throw error;
    }
  }

  loadAll(moduleIds) {
    var ids = moduleIds || openedModuleIds.filter((moduleId) => !this.modules[moduleId].asyncOnly);
    return ids.map((moduleId) => this.load(moduleId));
  }

  loadAsync(moduleId) {
    var descriptor = this.modules[moduleId];
    if (!descriptor) return Promise.reject(new Error("Unknown module: " + moduleId));

    var context = this.context();
    var preflight = descriptor.preflight && descriptor.preflight(context);
    if (preflight && preflight.status !== "granted") {
      return Promise.resolve(this.publishDenied(moduleId, descriptor, preflight, context));
    }

    var cacheKey = descriptor.cacheKey && descriptor.cacheKey(context);
    var cached = this.cached(moduleId, cacheKey);
    if (cached) return Promise.resolve(this.publish(moduleId, cached));

    var existing = this.inFlight.get(moduleId);
    if (existing && existing.cacheKey === cacheKey) return existing.promise;

    var generation = this.generation(moduleId);
    var vertical = context.config.vertical;
    if (descriptor.clearProtectedState) descriptor.clearProtectedState(context);
    if (descriptor.loadingEnvelope) this.publish(moduleId, descriptor.loadingEnvelope(context));
    else this.state.moduleStatus[moduleId] = "loading";

    var operation;
    try {
      operation = Promise.resolve(descriptor.adapter(context).load(moduleId, context));
    } catch (error) {
      operation = Promise.reject(error);
    }

    var promise = operation.then((raw) => {
      if (!this.isCurrentLoad(moduleId, descriptor, generation, cacheKey, vertical)) {
        return this.state.moduleData[moduleId] || null;
      }
      var normalized = descriptor.normalize(raw, context);
      if (!this.isCurrentLoad(moduleId, descriptor, generation, cacheKey, vertical)) {
        return this.state.moduleData[moduleId] || null;
      }
      if (descriptor.onResult) descriptor.onResult(normalized, context);
      this.cache.set(moduleId, cacheKey ? { cacheKey: cacheKey, data: normalized } : normalized);
      return this.publish(moduleId, normalized);
    }).catch((error) => {
      if (!this.isCurrentLoad(moduleId, descriptor, generation, cacheKey, vertical)) {
        return this.state.moduleData[moduleId] || null;
      }
      this.cache.delete(moduleId);
      if (descriptor.clearProtectedState) descriptor.clearProtectedState(this.context());
      this.state.moduleStatus[moduleId] = "error";
      this.state.moduleData[moduleId] = descriptor.failureEnvelope ? descriptor.failureEnvelope(this.context()) : null;
      throw error;
    }).finally(() => {
      var flight = this.inFlight.get(moduleId);
      if (flight && flight.promise === promise) this.inFlight.delete(moduleId);
    });
    this.inFlight.set(moduleId, { cacheKey: cacheKey, promise: promise });
    return promise;
  }

  isCurrentLoad(moduleId, descriptor, generation, cacheKey, vertical) {
    if (this.generation(moduleId) !== generation) return false;
    var context = this.context();
    if (context.config.vertical !== vertical) return false;
    if (descriptor.cacheKey && descriptor.cacheKey(context) !== cacheKey) return false;
    var preflight = descriptor.preflight && descriptor.preflight(context);
    return !preflight || preflight.status === "granted";
  }

  loadAllAsync(moduleIds) {
    var ids = moduleIds || openedModuleIds;
    return Promise.all(ids.map((moduleId) => this.loadAsync(moduleId)));
  }

  invalidate(moduleId) {
    var descriptor = this.modules[moduleId];
    if (!descriptor) throw new Error("Unknown module: " + moduleId);
    var context = this.context();
    this.cancel(moduleId, descriptor, context);
    return this.load(moduleId);
  }

  reloadAsync(moduleId) {
    var descriptor = this.modules[moduleId];
    if (!descriptor) return Promise.reject(new Error("Unknown module: " + moduleId));
    this.cancel(moduleId, descriptor, this.context());
    return this.loadAsync(moduleId);
  }

  refreshModules(moduleIds) {
    return Promise.all(moduleIds.map((moduleId) => {
      return this.modules[moduleId].asyncOnly ? this.reloadAsync(moduleId) : Promise.resolve(this.invalidate(moduleId));
    }));
  }
}
