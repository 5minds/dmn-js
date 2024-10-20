import Table from 'table-js';
import { importDecision } from './import/Importer';
import { assign } from 'min-dash';
import { domify, remove as domRemove } from 'min-dom';
import TranslateModule from 'diagram-js/lib/i18n/translate';
import annotationsModule from './features/annotations';
import coreModule from './core';
import decisionTableHeadModule from './features/decision-table-head';
import decisionTablePropertiesModule from './features/decision-table-properties';
import decisionRuleIndicesModule from './features/decision-rule-indices';
import decisionRulesModule from './features/decision-rules';
import hitPolicyModule from './features/hit-policy';
import viewDrdModule from './features/view-drd';
import PoweredByModule from './features/powered-by';

/**
 * @typedef {import('dmn-js-shared/lib/base/View).OpenResult} OpenResult
 */

/**
 * @typedef {import('dmn-js-shared/lib/base/View).OpenError} OpenError
 */

export default class Viewer extends Table {
  constructor(options = {}) {
    const container = Viewer._createContainer();
    super(assign(options, {
      renderer: {
        container
      }
    }));
    this._container = container;
  }

  /**
   * Open diagram element.
   *
   * @param  {ModdleElement} decision
   * @returns {Promise} Resolves with {OpenResult} when successful
   * or rejects with {OpenError}
   */
  open(decision) {
    var self = this;
    return new Promise((resolve, reject) => {
      var err;

      // use try/catch to not swallow synchronous exceptions
      // that may be raised during model parsing
      try {
        if (self._decision) {
          // clear existing rendered diagram
          self.clear();
        }

        // update decision
        self._decision = decision;

        // perform import
        return importDecision(self, decision, function (err, warnings) {
          if (err) {
            err.warnings = warnings || [];
            reject(err);
          } else {
            resolve({
              warnings: warnings || []
            });
          }
        });
      } catch (e) {
        err = e;
      }

      // handle synchronously thrown exception
      if (err) {
        err.warnings = err.warnings || [];
        reject(err);
      } else {
        resolve({
          warnings: []
        });
      }
    });
  }

  /**
   * Initialize the table, returning { modules: [], config }.
   *
   * @param  {Object} options
   *
   * @return {Object} init config
   */
  _init(options) {
    let {
      modules,
      additionalModules,
      ...config
    } = options;
    let baseModules = modules || this.getModules();
    let extraModules = additionalModules || [];
    let staticModules = [{
      decisionTable: ['value', this]
    }];
    let allModules = [PoweredByModule, ...baseModules, ...extraModules, ...staticModules];
    return {
      modules: allModules,
      config
    };
  }

  /**
   * Register an event listener
   *
   * Remove a previously added listener via {@link #off(event, callback)}.
   *
   * @param {string} event
   * @param {number} [priority]
   * @param {Function} callback
   * @param {Object} [that]
   */
  on(event, priority, callback, target) {
    return this.get('eventBus').on(event, priority, callback, target);
  }

  /**
   * De-register an event listener
   *
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    this.get('eventBus').off(event, callback);
  }

  /**
   * Emit an event on the underlying {@link EventBus}
   *
   * @param  {string} type
   * @param  {Object} event
   *
   * @return {Object} event processing result (if any)
   */
  _emit(type, event) {
    return this.get('eventBus').fire(type, event);
  }

  /**
   * Attach viewer to given parent node.
   *
   * @param  {Element} parentNode
   */
  attachTo(parentNode) {
    if (!parentNode) {
      throw new Error('parentNode required');
    }

    // ensure we detach from the
    // previous, old parent
    this.detach();
    const container = this._container;
    parentNode.appendChild(container);
    this._emit('attach', {});
  }

  /**
   * Detach viewer from parent node, if attached.
   */
  detach() {
    const container = this._container,
      parentNode = container.parentNode;
    if (!parentNode) {
      return;
    }
    this._emit('detach', {});
    domRemove(container);
  }
  destroy() {
    super.destroy();
    this.detach();
  }
  getModules() {
    return Viewer._getModules();
  }
  static _getModules() {
    return [annotationsModule, coreModule, TranslateModule, decisionTableHeadModule, decisionTablePropertiesModule, decisionRuleIndicesModule, decisionRulesModule, hitPolicyModule, viewDrdModule];
  }
  static _createContainer() {
    return domify('<div class="dmn-decision-table-container"></div>');
  }
}
//# sourceMappingURL=Viewer.js.map