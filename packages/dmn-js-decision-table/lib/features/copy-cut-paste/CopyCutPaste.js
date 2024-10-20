import { isArray } from 'min-dash';
import CutHandler from './cmd/CutHandler';
import PasteHandler from './cmd/PasteHandler';
import { createDescriptor } from './DescriptorUtil';
export default class CutPaste {
  constructor(clipboard, commandStack, eventBus, modeling, sheet, rules) {
    this._clipboard = clipboard;
    this._commandStack = commandStack;
    this._eventBus = eventBus;
    this._modeling = modeling;
    this._sheet = sheet;
    this._rules = rules;
    commandStack.registerHandler('cut', CutHandler);
    commandStack.registerHandler('paste', PasteHandler);
  }

  /**
   * Copy elements.
   *
   * @param {Array} elements - Elements to be copied.
   */
  copy(elements) {
    if (!isArray(elements)) {
      elements = [elements];
    }
    const data = {
      elements: createDescriptor(elements)
    };
    this._eventBus.fire('copyCutPaste.copy', {
      data
    });
    this._clipboard.set(data);
  }

  /**
   * Cut elements thereby removing them temporarily.
   *
   * @param {Array} elements - Elements to be cut.
   */
  cut(elements) {
    if (!isArray(elements)) {
      elements = [elements];
    }
    const data = {
      elements: createDescriptor(elements),
      keepIds: true
    };
    const context = {
      elements,
      data
    };
    this._eventBus.fire('copyCutPaste.cut', {
      data
    });
    this._commandStack.execute('cut', context);
  }

  /**
   * Paste rows or cols before row or col.
   *
   * @param {Row|Col} element - Row or col to paste elements before.
   */
  pasteBefore(element) {
    return this._paste(element, {
      before: true
    });
  }

  /**
   * Paste rows or cols after row or col.
   *
   * @param {Row|Col} element - Row or col to paste elements after.
   */
  pasteAfter(element) {
    return this._paste(element, {
      after: true
    });
  }

  /**
   * Basic paste onto given target element.
   */
  _paste(target, position) {
    const clipboardData = this._clipboard.get();
    if (!clipboardData) {
      return undefined;
    }
    const allowed = this._rules.allowed('paste', {
      data: clipboardData.elements,
      target
    });
    if (!allowed) {
      return false;
    }
    this._commandStack.execute('paste', {
      element: target,
      ...position
    });

    // @bpmn-io: Clear clipboard to work around
    // https://github.com/camunda/camunda-modeler/issues/1246 which breaks native copy &
    // paste when row or column is copied or cut
    this._clipboard.clear();

    // Return true to stop propagation and prevent native paste
    return true;
  }

  /**
   * Paste elements at.
   */
  pasteAt(element) {

    // TODO: implement for pasting cells
  }
}
CutPaste.$inject = ['clipboard', 'commandStack', 'eventBus', 'modeling', 'sheet', 'rules'];
//# sourceMappingURL=CopyCutPaste.js.map