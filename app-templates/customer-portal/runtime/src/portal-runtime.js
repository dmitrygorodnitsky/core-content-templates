import { openedModuleIds, modules } from "./modules/index.js";

export class PortalRuntime {
  constructor(options) {
    this.state = options.state;
    this.modules = modules;
    this.cache = new Map();
  }

  parseConfig() {
    return this.state.config;
  }

  load(moduleId) {
    var descriptor = this.modules[moduleId];
    if (!descriptor) throw new Error("Unknown module: " + moduleId);

    this.state.moduleStatus[moduleId] = "loading";
    try {
      var raw = descriptor.adapter.load(moduleId, { state: this.state, config: this.parseConfig() });
      var normalized = descriptor.normalize(raw, { state: this.state, config: this.parseConfig() });
      this.cache.set(moduleId, normalized);
      this.state.moduleData[moduleId] = normalized;
      this.state.moduleStatus[moduleId] = "ready";
      return normalized;
    } catch (error) {
      this.state.moduleStatus[moduleId] = "error";
      this.state.moduleData[moduleId] = null;
      throw error;
    }
  }

  loadAll(moduleIds) {
    var ids = moduleIds || openedModuleIds;
    return ids.map((moduleId) => this.load(moduleId));
  }

  invalidate(moduleId) {
    this.cache.delete(moduleId);
    if (moduleId) this.load(moduleId);
  }

  refreshModules(moduleIds) {
    moduleIds.forEach((moduleId) => this.invalidate(moduleId));
  }
}
