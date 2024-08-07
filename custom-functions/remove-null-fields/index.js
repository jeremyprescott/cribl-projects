const cLogger = C.util.getLogger("func:removeNullFields");

exports.disabled = 0;
exports.name = "Remove null fields";
exports.version = "0.1.1";
exports.group = "Custom Functions";

/**
 * Instance of the RemoveFields class used to determine if a field should be removed
 * based on the provided configuration. Initialized in the init function.
 * @type {RemoveFields}
 */
let shouldRemove;

/**
 * Indicates whether the function should be disabled based on the configuration.
 * The function is disabled if both `removeNull` and `removeEmpty` are false.
 * @type {boolean}
 */
let isDisabled;

/**
 * Initializes the RemoveNullFields function with the provided options.
 * @param {Object} options - The options to initialize the function.
 * @param {Object} options.conf - The configuration object.
 * @param {boolean} options.conf.removeNull - Toggle to remove null fields.
 * @param {boolean} options.conf.removeEmpty - Toggle to remove empty fields.
 * @param {number} [options.pipeIdx] - The index of the pipeline.
 * @param {string} [options.pid] - The pipeline ID.
 * @param {string} [options.cid] - The worker process ID.
 */
exports.init = (options) => {
  const {
    conf = {},
    pipeIdx: funcIdx = undefined,
    pid: pipeId = undefined,
    cid: wp = undefined,
  } = options;
  
  const { removeNull = false, removeEmpty = true } = conf;

  // Determine if the function should be disabled
  isDisabled = !removeNull && !removeEmpty;

  // Log the initialization details
  cLogger.info("initializing RemoveNullFields function", { pipeId, funcIdx, wp, conf });

  // Create an instance of RemoveFields based on the configuration
  shouldRemove = new RemoveFields(removeNull, removeEmpty)
};

/**
 * Class representing a utility to remove fields based on specific conditions.
 */
class RemoveFields {
  /**
   * Callback function to perform the RemoveFields evaluation
   * @type {Function}
   */
  field;

  /**
   * Create an instance of RemoveFields.
   * @param {boolean} removeNull - Toggle to remove null fields.
   * @param {boolean} removeEmpty - Toggle to remove empty fields.
   */
  constructor(removeNull, removeEmpty) {
    this.field = removeNull && removeEmpty
      ? (value) => this.#_isBoth(value) // Remove null and empty fields
      : removeNull || removeEmpty
        ? removeNull
          ? (value) => this.#_isNull(value) // Remove null fields only
          : (value) => this.#_isEmpty(value) // Remove empty fields only
        : () => false; // Do nothing
  }
  /**
   * Checks if the field in the event is null.
   * @param {*} value - The value of the field
   * @return {boolean} true if the field is null, otherwise false.
   */
  #_isNull = (value) => value === null;

  /**
   * Checks if the field in the event is an empty string.
   * @param {*} value - The value of the field
   * @return {boolean} true if the field is an empty string, otherwise false.
   */
  #_isEmpty = (value) => {
    if(value === null || value === undefined) return false;
    if(value !== '') return false;
    return true;
  }

  /**
   * Checks if the field in the event is either null or an empty string.
   * @param {*} value - The value of the field
   * @return {boolean} true if the field is null or an empty string, otherwise false.
   */
  #_isBoth = (value) => {
    if(value !== null && value !== undefined && value !== '') return false;
    return true;
  }
}

exports.process = (event) => {
  // Return the event unchanged if processing is disabled.
  if (isDisabled) return event;

  // Iterate over each key in the event object.
  for (const key in event) {
    // Ignore internal fields, such as Cribl fields and other fields starting with "__".
    if (key.startsWith("__") || key === "_time" || key === "_raw") {
      continue;
    }

    // If the shouldRemove callback returns true for the current field, set the field to undefined.
    if (shouldRemove.field(event[key])) {
      event[key] = undefined;
    }
  }

  // Return the modified event object.
  return event;
};
