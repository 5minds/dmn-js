import { map, filter, sortBy } from 'min-dash';
import { getLabel } from '../label-editing/LabelUtil';

/**
 * @typedef {import('diagram-js/lib/core/Canvas').default} Canvas
 * @typedef {import('diagram-js/lib/core/ElementRegistry').default} ElementRegistry
 * @typedef {import('diagram-js/lib/features/search-pad/SearchPad').default} SearchPad
 *
 * @typedef {import('diagram-js/lib/features/search-pad/SearchPadProvider').default
 * } SearchPadProvider
 * @typedef {import('diagram-js/lib/features/search-pad/SearchPadProvider').SearchResult
 * } SearchResult
 */

/**
 * Provides ability to search for DMN elements.
 *
 * @implements {SearchPadProvider}
 *
 * @param {ElementRegistry} elementRegistry
 * @param {SearchPad} searchPad
 * @param {Canvas} canvas
 */
export default function DmnSearchProvider(elementRegistry, searchPad, canvas) {
  this._elementRegistry = elementRegistry;
  this._canvas = canvas;
  searchPad.registerProvider(this);
}
DmnSearchProvider.$inject = ['elementRegistry', 'searchPad', 'canvas'];

/**
 * @param {string} pattern
 *
 * @return {SearchResult[]}
 */
DmnSearchProvider.prototype.find = function (pattern) {
  const rootElement = this._canvas.getRootElement();
  let elements = this._elementRegistry.filter(function (element) {
    if (element.labelTarget) {
      return false;
    }
    return true;
  });

  // do not include root element
  elements = filter(elements, function (element) {
    return element !== rootElement;
  });
  elements = map(elements, function (element) {
    return {
      primaryTokens: matchAndSplit(getLabel(element), pattern),
      secondaryTokens: matchAndSplit(element.id, pattern),
      element: element
    };
  });

  // exclude non-matched elements
  elements = filter(elements, function (element) {
    return hasMatched(element.primaryTokens) || hasMatched(element.secondaryTokens);
  });
  elements = sortBy(elements, function (element) {
    return getLabel(element.element) + element.element.id;
  });
  return elements;
};

/**
 * @param {Token[]} tokens
 *
 * @return {boolean}
 */
function hasMatched(tokens) {
  const matched = filter(tokens, function (token) {
    return !!token.matched;
  });
  return matched.length > 0;
}

/**
 * @param {string} text
 * @param {string} pattern
 *
 * @return {Token[]}
 */
function matchAndSplit(text, pattern) {
  const tokens = [],
    originalText = text;
  if (!text) {
    return tokens;
  }
  text = text.toLowerCase();
  pattern = pattern.toLowerCase();
  const i = text.indexOf(pattern);
  if (i > -1) {
    if (i !== 0) {
      tokens.push({
        normal: originalText.substr(0, i)
      });
    }
    tokens.push({
      matched: originalText.substr(i, pattern.length)
    });
    if (pattern.length + i < text.length) {
      tokens.push({
        normal: originalText.substr(pattern.length + i, text.length)
      });
    }
  } else {
    tokens.push({
      normal: originalText
    });
  }
  return tokens;
}
//# sourceMappingURL=DmnSearchProvider.js.map