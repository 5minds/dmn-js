import { createVNode } from "inferno";
/**
 * This file must not be changed or exchanged.
 *
 * @see http://bpmn.io/license for more information.
 */

import { domify, delegate as domDelegate, event as domEvent } from 'min-dom';
import { Component } from 'inferno';

// inlined ../../../../resources/logo.svg
// eslint-disable-next-line
var BPMNIO_IMG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14.02 5.57" width="53" height="21" style="vertical-align:middle"><path fill="#000000" d="M1.88.92v.14c0 .41-.13.68-.4.8.33.14.46.44.46.86v.33c0 .61-.33.95-.95.95H0V0h.95c.65 0 .93.3.93.92zM.63.57v1.06h.24c.24 0 .38-.1.38-.43V.98c0-.28-.1-.4-.32-.4zm0 1.63v1.22h.36c.2 0 .32-.1.32-.39v-.35c0-.37-.12-.48-.4-.48H.63zM4.18.99v.52c0 .64-.31.98-.94.98h-.3V4h-.62V0h.92c.63 0 .94.35.94.99zM2.94.57v1.35h.3c.2 0 .3-.09.3-.37v-.6c0-.29-.1-.38-.3-.38h-.3zm2.89 2.27L6.25 0h.88v4h-.6V1.12L6.1 3.99h-.6l-.46-2.82v2.82h-.55V0h.87zM8.14 1.1V4h-.56V0h.79L9 2.4V0h.56v4h-.64zm2.49 2.29v.6h-.6v-.6zM12.12 1c0-.63.33-1 .95-1 .61 0 .95.37.95 1v2.04c0 .64-.34 1-.95 1-.62 0-.95-.37-.95-1zm.62 2.08c0 .28.13.39.33.39s.32-.1.32-.4V.98c0-.29-.12-.4-.32-.4s-.33.11-.33.4z"/><path fill="#000000" d="M0 4.53h14.02v1.04H0zM11.08 0h.63v.62h-.63zm.63 4V1h-.63v2.98z"/></svg>';

/**
 * Adds the project logo to the diagram container as
 * required by the bpmn.io license.
 *
 * @see http://bpmn.io/license
 *
 * @param {Element} container
 */
export function addProjectLogo(container) {
  var linkMarkup = '<a href="http://bpmn.io" ' + 'target="_blank" ' + 'class="bjs-powered-by" ' + 'title="Powered by bpmn.io" ' + 'style="position: absolute; bottom: 15px; right: 15px; z-index: 100;">' + BPMNIO_IMG + '</a>';
  var linkElement = domify(linkMarkup);
  container.appendChild(linkElement);
  domEvent.bind(linkElement, 'click', function (event) {
    open();
    event.preventDefault();
  });
}
export class PoweredByComponent extends Component {
  constructor(props, context) {
    super(props, context);
    this.node = null;
  }
  componentDidMount() {
    addProjectLogo(this.node);
  }
  render() {
    return createVNode(1, "div", null, null, 1, null, null, node => this.node = node);
  }
}
function css(attrs) {
  return attrs.join(';');
}
var LIGHTBOX_STYLES = css(['z-index: 1001', 'position: fixed', 'top: 0', 'left: 0', 'right: 0', 'bottom: 0']);
var BACKDROP_STYLES = css(['width: 100%', 'height: 100%', 'background: rgba(40,40,40,0.2)']);
var NOTICE_STYLES = css(['position: absolute', 'left: 50%', 'top: 40%', 'transform: translate(-50%)', 'width: 260px', 'padding: 10px', 'background: white', 'box-shadow: 0 1px 4px rgba(0,0,0,0.3)', 'font-family: Helvetica, Arial, sans-serif', 'font-size: 14px', 'display: flex', 'line-height: 1.3']);

/* eslint-disable max-len */
var LIGHTBOX_MARKUP = '<div class="bjs-powered-by-lightbox" style="' + LIGHTBOX_STYLES + '">' + '<div class="backdrop" style="' + BACKDROP_STYLES + '"></div>' + '<div class="notice" style="' + NOTICE_STYLES + '">' + '<a href="https://bpmn.io" target="_blank" rel="noopener" style="margin: 15px 20px 15px 10px; align-self: center;' + '">' + BPMNIO_IMG + '</a>' + '<span>' + 'Web-based tooling for BPMN, DMN and CMMN diagrams ' + 'powered by <a href="https://bpmn.io" target="_blank" rel="noopener">bpmn.io</a>.' + '</span>' + '</div>' + '</div>';
/* eslint-enable */

var lightbox;
function open() {
  if (!lightbox) {
    lightbox = domify(LIGHTBOX_MARKUP);
    domDelegate.bind(lightbox, '.backdrop', 'click', function (event) {
      document.body.removeChild(lightbox);
    });
  }
  document.body.appendChild(lightbox);
}
//# sourceMappingURL=PoweredByUtil.js.map