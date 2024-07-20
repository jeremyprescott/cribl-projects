const cLogger = C.util.getLogger("func:RemoveNullFields");

exports.disabled = 0;
exports.name = "Remove null fields";
exports.version = "0.1.0";
exports.group = "Custom Functions";

let shouldRemove;
let isDisabled;

exports.init = (options) => {
  const conf = options?.conf ?? {};
  const funcIdx = options?.pipeIdx ?? undefined;
  const pipeId = options?.pid ?? undefined;
  const wp = options?.cid ?? undefined;
  const { removeNull = false, removeEmpty = false } = conf;
  isDisabled = !removeNull && !removeEmpty;

  cLogger.debug("initializing RemoveNullFields function", {
    pipeId,
    funcIdx,
    wp,
    conf,
  });
  shouldRemove = new RemoveFields({ removeNull, removeEmpty });
};

class RemoveFields {
  field;
  constructor(options) {
    const { removeNull, removeEmpty } = options;
    this.field =
      removeNull && removeEmpty
        ? (value) => this._isNull(value) || this._isEmpty(value) // Remove null and empty fields
        : removeNull || removeEmpty
          ? removeNull
            ? (value) => this._isNull(value) // Remove null fields only
            : (value) => this._isEmpty(value) // Remove empty fields only
          : () => false; // Do nothing
  }

  _isNull = (value) => value === null;
  _isUndefined = (value) => value === undefined;
  _isEmpty = (value) =>
    !this._isNull(value) &&
    !this._isUndefined(value) &&
    (value.length === 0 || value === "");
}

exports.process = (event) => {
  if (isDisabled) return event;

  for (const key in event) {
    if (key.startsWith("__")) continue; // Ignore internal fields, Cribl and otherwise.
    if (shouldRemove.field(event[key])) event[key] = undefined;
  }

  return event;
};
