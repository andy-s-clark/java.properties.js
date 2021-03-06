'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.propertiesToObject = propertiesToObject;
function compose() {
    var fns = arguments;

    return function (result) {
        for (var i = fns.length - 1; i > -1; i--) {
            result = fns[i].call(this, result);
        }

        return result;
    };
}

function assignProperty(obj, path, value) {
    var props = path.split('.');
    var key = props.pop();
    obj = props.reduce(function (newObj, prop) {
        if (!newObj[prop]) {
            newObj[prop] = {};
        }
        return newObj[prop];
    }, obj);

    obj[key] = value;
}

/**
 * Tries to parse the value to a primitive type. It converts "true" and "false" to a boolean, and "2" to a number.
 * @param value {String} value to parse
 * @returns {Boolean|Number|String} parsed value
 */
function parseValue(value) {
    if (['true', 'false'].indexOf(value) !== -1) {
        return value === 'true';
    }
    // is it float parseble?
    var parsed = parseFloat(value);
    if (!isNaN(parsed)) {
        return parsed;
    }
    return value;
}

/**
 * Validates whether the line is a comment (prefixed by # or !)
 * @param line {String} the line
 * @returns {Boolean} whether the line is a comment
 */
function isLineComment(line) {
    return (/^\s*(\#|\!|$)/.test(line)
    );
}

/**
 * Validates whether the line has continuation character (backslash) at end
 * @param line {String} the line
 * @returns {Boolean} whether the line is continued on the next line
 */
function isLineContinued(line) {
    return (/(\\\\)*\\$/.test(line)
    );
}

/**
 * Parses the line to a key and value
 * @param line {String} the line
 * @returns {Array} array with following structure: [line, key, value]
 */
function parseLine(line) {
    return (/^\s*((?:[^\s:=\\]|\\.)+)\s*[:=\s]\s*(.*)$/.exec(line)
    );
}

/**
 * Makes a deep structured object from a shallow object with dot-separated keys:
 *   { "key.with.nesting": "value" }
 *   becomes:
 *   { "key": { "with": { "nesting": "value" } } }
 * @param obj
 * @returns {{}}
 */
function makeDeepStructure(obj) {
    return Object.keys(obj).reduce(function (nested, key) {
        assignProperty(nested, key, obj[key]);
        return nested;
    }, {});
}

/**
 * Combines lines which end with a backslash with the next line
 * @param lines {String[]}
 * @returns {String[]}
 */
function combineMultiLines(lines) {
    return lines.reduce(function (acc, cur) {
        var line = acc[acc.length - 1];
        if (acc.length && isLineContinued(line)) {
            acc[acc.length - 1] = line.replace(/\\$/, '');
            acc[acc.length - 1] += cur;
        } else {
            acc.push(cur);
        }
        return acc;
    }, []);
}

/**
 * Removes leading white-space of every line
 * @param lines {String[]}
 * @returns {String[]}
 */
function removeLeadingWhitespace(lines) {
    return lines.map(function (line) {
        return line.replace(/^\s*/, '');
    }); // remove space at start of line
}

/**
 * Filters out the comment lines
 * @param lines {String[]}
 * @returns {String[]}
 */
function filterOutComments(lines) {
    return lines.filter(function (line) {
        return !isLineComment(line);
    });
}

/**
 * Parses the lines add adds the key-values to the return object
 * @param lines {String[]}
 * @returns {{}} the parsed key-value pairs
 */
function parseLines(lines) {
    var propertyMap = {};
    lines.forEach(function (line) {
        var parsed = parseLine(line);
        if (!parsed) {
            throw new Error('Cannot parse line: ', line);
        }
        propertyMap[parsed[1]] = parsed[2];
    });
    return propertyMap;
}

/**
 * Loops over the object values and tries to parse them to a native value.
 * @param obj
 * @returns {Object} the same object as the argument
 */
function parseValues(obj) {
    Object.keys(obj).forEach(function (key) {
        obj[key] = parseValue(obj[key]);
    });
    return obj;
}

/**
 * Makes an array of strings from a string containing return-characters.
 * @param str
 * @returns {Array} array of lines
 */
function makeLines(str) {
    return str.split(/\r?\n/);
}

var pToO = compose(makeDeepStructure, parseValues, parseLines, combineMultiLines, filterOutComments, removeLeadingWhitespace, makeLines);

function propertiesToObject(propertiesFile) {
    if (typeof propertiesFile !== 'string') {
        throw new Error('Cannot parse java-properties when it is not a string');
    }

    return pToO(propertiesFile);
}

exports.default = propertiesToObject;
