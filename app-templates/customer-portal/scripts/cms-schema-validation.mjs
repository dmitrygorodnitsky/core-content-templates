const SUPPORTED_KEYWORDS = new Set([
  "$schema", "$id", "title", "type", "additionalProperties", "required", "properties",
  "const", "enum", "$defs", "$ref", "minItems", "uniqueItems", "items", "minLength",
  "pattern", "oneOf", "minimum", "maximum",
]);
const SUPPORTED_TYPES = new Set(["null", "array", "object", "integer", "string", "number", "boolean"]);

export function assertValidCmsPayload(schema, payload, label = "CMS payload") {
  const errors = validateCmsPayload(schema, payload);
  if (errors.length) throw new Error(label + " failed schema validation: " + errors.join("; "));
  return payload;
}

export function validateCmsPayload(rootSchema, payload) {
  const schemaNodes = scanSupportedSchema(rootSchema);
  const errors = [];
  if (!isJsonValue(payload)) return ["payload must be a valid JSON value"];
  visit(rootSchema, payload, "payload", new Set());
  return errors;

  function visit(schema, current, currentPath, activeReferences) {
    if (schema.$ref) {
      if (activeReferences.has(schema.$ref)) throw new Error("Circular CMS schema reference is not supported: " + schema.$ref);
      const target = resolveLocalRef(rootSchema, schema.$ref, schemaNodes);
      const nextReferences = new Set(activeReferences);
      nextReferences.add(schema.$ref);
      visit(target, current, currentPath, nextReferences);
    }
    if (schema.oneOf) {
      let matches = 0;
      for (const candidate of schema.oneOf) {
        const candidateErrors = [];
        const originalLength = errors.length;
        visit(candidate, current, currentPath, new Set(activeReferences));
        candidateErrors.push(...errors.splice(originalLength));
        if (!candidateErrors.length) matches += 1;
      }
      if (matches !== 1) errors.push(displayPath(currentPath) + " must satisfy exactly one schema");
    }

    const types = schema.type === undefined ? [] : Array.isArray(schema.type) ? schema.type : [schema.type];
    if (types.length && !types.some((type) => matchesType(type, current))) {
      errors.push(displayPath(currentPath) + " must be " + types.join(" or "));
    }
    if (Object.prototype.hasOwnProperty.call(schema, "const") && !jsonEqual(current, schema.const)) errors.push(displayPath(currentPath) + " must equal " + JSON.stringify(schema.const));
    if (schema.enum && !schema.enum.some((item) => jsonEqual(item, current))) errors.push(displayPath(currentPath) + " must be an allowed enum value");

    if (typeof current === "string") {
      if (schema.minLength !== undefined && Array.from(current).length < schema.minLength) errors.push(displayPath(currentPath) + " is shorter than minLength");
      if (schema.pattern && !(new RegExp(schema.pattern)).test(current)) errors.push(displayPath(currentPath) + " does not match pattern");
    }
    if (typeof current === "number") {
      if (schema.minimum !== undefined && current < schema.minimum) errors.push(displayPath(currentPath) + " is below minimum");
      if (schema.maximum !== undefined && current > schema.maximum) errors.push(displayPath(currentPath) + " is above maximum");
    }
    if (Array.isArray(current)) {
      if (schema.minItems !== undefined && current.length < schema.minItems) errors.push(displayPath(currentPath) + " has fewer than minItems");
      if (schema.uniqueItems && current.some((item, index) => current.slice(0, index).some((previous) => jsonEqual(previous, item)))) errors.push(displayPath(currentPath) + " contains duplicate items");
      if (schema.items) current.forEach((item, index) => visit(schema.items, item, currentPath + "[" + index + "]", new Set(activeReferences)));
    }
    if (current && typeof current === "object" && !Array.isArray(current)) {
      for (const key of schema.required || []) {
        if (!Object.prototype.hasOwnProperty.call(current, key)) errors.push(displayPath(currentPath + "." + key) + " is required");
      }
      if (schema.additionalProperties === false) {
        for (const key of Object.keys(current)) {
          if (!Object.prototype.hasOwnProperty.call(schema.properties || {}, key)) errors.push(displayPath(currentPath + "." + key) + " is not allowed");
        }
      }
      for (const [key, childSchema] of Object.entries(schema.properties || {})) {
        if (Object.prototype.hasOwnProperty.call(current, key)) visit(childSchema, current[key], currentPath + "." + key, new Set(activeReferences));
      }
    }
  }
}

export function testClassificationSchema(productionSchema) {
  if (productionSchema?.properties?.classification?.const !== "public-authored") {
    throw new Error("Public SEO production schema must require classification public-authored");
  }
  const schema = structuredClone(productionSchema);
  schema.$id = productionSchema.$id + "/test-classification";
  schema.properties.classification.const = "public-authored-test";
  return schema;
}

function scanSupportedSchema(schema) {
  if (!isPlainObject(schema)) throw new Error("CMS schema must be a non-array plain object; boolean schemas are not supported");
  if (!isJsonValue(schema)) throw new Error("CMS schema must contain only valid JSON values");
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") throw new Error("CMS schema must declare draft 2020-12");
  const schemaNodes = new Set();
  scan(schema, "schema");
  return schemaNodes;

  function scan(node, currentPath) {
    if (!isPlainObject(node)) throw new Error(currentPath + " must be a non-array plain object schema; boolean schemas are not supported");
    schemaNodes.add(node);
    for (const key of Object.keys(node)) {
      if (!SUPPORTED_KEYWORDS.has(key)) throw new Error(currentPath + " uses unsupported schema keyword " + key);
    }
    validateKeywordShapes(node, currentPath);
    if (Object.prototype.hasOwnProperty.call(node, "properties")) {
      for (const [key, child] of Object.entries(node.properties)) scan(child, currentPath + ".properties." + key);
    }
    if (Object.prototype.hasOwnProperty.call(node, "$defs")) {
      for (const [key, child] of Object.entries(node.$defs)) scan(child, currentPath + ".$defs." + key);
    }
    if (Object.prototype.hasOwnProperty.call(node, "oneOf")) {
      for (const [index, child] of node.oneOf.entries()) scan(child, currentPath + ".oneOf[" + index + "]");
    }
    if (Object.prototype.hasOwnProperty.call(node, "items")) scan(node.items, currentPath + ".items");
  }
}

function validateKeywordShapes(node, currentPath) {
  if (Object.prototype.hasOwnProperty.call(node, "$schema") && node.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    throw new Error(currentPath + ".$schema must equal the supported draft 2020-12 URI");
  }
  for (const keyword of ["$id", "title"]) {
    if (Object.prototype.hasOwnProperty.call(node, keyword) && (typeof node[keyword] !== "string" || !node[keyword])) throw new Error(currentPath + "." + keyword + " must be a nonempty string");
  }
  if (Object.prototype.hasOwnProperty.call(node, "$ref") && (typeof node.$ref !== "string" || !node.$ref.startsWith("#/"))) {
    throw new Error(currentPath + ".$ref must be a nonempty local JSON Pointer");
  }
  if (Object.prototype.hasOwnProperty.call(node, "type")) {
    const types = Array.isArray(node.type) ? node.type : [node.type];
    if (!types.length || types.some((type) => typeof type !== "string" || !SUPPORTED_TYPES.has(type)) || new Set(types).size !== types.length) {
      throw new Error(currentPath + ".type must be a supported type string or a nonempty unique array of supported type strings");
    }
  }
  if (Object.prototype.hasOwnProperty.call(node, "additionalProperties") && node.additionalProperties !== false) {
    throw new Error(currentPath + ".additionalProperties must be exactly false when present");
  }
  for (const keyword of ["properties", "$defs"]) {
    if (Object.prototype.hasOwnProperty.call(node, keyword) && !isPlainObject(node[keyword])) throw new Error(currentPath + "." + keyword + " must be a plain object schema map");
  }
  if (Object.prototype.hasOwnProperty.call(node, "required")) {
    if (!Array.isArray(node.required) || node.required.some((key) => typeof key !== "string") || new Set(node.required).size !== node.required.length) {
      throw new Error(currentPath + ".required must be an array of unique strings");
    }
  }
  if (Object.prototype.hasOwnProperty.call(node, "enum")) {
    if (!Array.isArray(node.enum) || !node.enum.length || node.enum.some((value) => !isJsonValue(value))) throw new Error(currentPath + ".enum must be a nonempty array of JSON values");
    if (node.enum.some((value, index) => node.enum.slice(0, index).some((previous) => jsonEqual(previous, value)))) throw new Error(currentPath + ".enum values must be structurally unique");
  }
  if (Object.prototype.hasOwnProperty.call(node, "const") && !isJsonValue(node.const)) throw new Error(currentPath + ".const must be a valid JSON value");
  if (Object.prototype.hasOwnProperty.call(node, "oneOf") && (!Array.isArray(node.oneOf) || !node.oneOf.length)) throw new Error(currentPath + ".oneOf must be a nonempty array of object schemas");
  if (Object.prototype.hasOwnProperty.call(node, "items") && !isPlainObject(node.items)) throw new Error(currentPath + ".items must be an object schema; boolean and array forms are not supported");
  if (Object.prototype.hasOwnProperty.call(node, "uniqueItems") && typeof node.uniqueItems !== "boolean") throw new Error(currentPath + ".uniqueItems must be boolean");
  for (const keyword of ["minItems", "minLength"]) {
    if (Object.prototype.hasOwnProperty.call(node, keyword) && (!Number.isInteger(node[keyword]) || node[keyword] < 0)) throw new Error(currentPath + "." + keyword + " must be a nonnegative integer");
  }
  for (const keyword of ["minimum", "maximum"]) {
    if (Object.prototype.hasOwnProperty.call(node, keyword) && (typeof node[keyword] !== "number" || !Number.isFinite(node[keyword]))) throw new Error(currentPath + "." + keyword + " must be a finite number");
  }
  if (Object.prototype.hasOwnProperty.call(node, "pattern")) {
    if (typeof node.pattern !== "string") throw new Error(currentPath + ".pattern must be a string");
    try { new RegExp(node.pattern); } catch (_) { throw new Error(currentPath + ".pattern must be a valid regular expression"); }
  }
}

function resolveLocalRef(rootSchema, reference, schemaNodes) {
  if (!reference.startsWith("#/")) throw new Error("Only local CMS schema references are supported: " + reference);
  let target = rootSchema;
  for (const encodedPart of reference.split("/").slice(1)) {
    if (/~(?:[^01]|$)/.test(encodedPart)) throw new Error("CMS schema reference contains invalid JSON Pointer escaping: " + reference);
    const part = encodedPart.replace(/~1/g, "/").replace(/~0/g, "~");
    if (["__proto__", "prototype", "constructor"].includes(part)) throw new Error("CMS schema reference contains a dangerous JSON Pointer segment: " + reference);
    if ((!target || typeof target !== "object") || !Object.prototype.hasOwnProperty.call(target, part)) throw new Error("CMS schema reference does not resolve through own properties: " + reference);
    target = target[part];
  }
  if (!isPlainObject(target) || !schemaNodes.has(target)) throw new Error("CMS schema reference target is not a recognized schema node: " + reference);
  return target;
}

function displayPath(value) {
  return value.replace(/^payload\.?/, "") || "payload";
}

function matchesType(type, value) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (["string", "number", "boolean"].includes(type)) return typeof value === type;
  throw new Error("Unsupported CMS schema type: " + type);
}

function jsonEqual(left, right) {
  if (!isJsonValue(left) || !isJsonValue(right)) throw new Error("JSON Schema equality supports only valid JSON values");
  if (left === right) return true;
  if (left === null || right === null || typeof left !== typeof right) return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((item, index) => jsonEqual(item, right[index]));
  }
  if (typeof left === "object") {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    if (leftKeys.length !== rightKeys.length || leftKeys.some((key, index) => key !== rightKeys[index])) return false;
    return leftKeys.every((key) => jsonEqual(left[key], right[key]));
  }
  return false;
}

function isJsonValue(value, active = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;
  if (active.has(value)) return false;
  if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  if (Object.getOwnPropertySymbols(value).length) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.values(descriptors).some((descriptor) => !Object.prototype.hasOwnProperty.call(descriptor, "value"))) return false;
  active.add(value);
  const valid = Object.keys(value).every((key) => isJsonValue(value[key], active));
  active.delete(value);
  return valid;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
}
