import { createVNode, createComponentVNode } from "inferno";
import { Component } from 'inferno';
import Input from 'dmn-js-shared/lib/components/Input';
import { parseString } from '../Utils';
export default class OutputNumberEdit extends Component {
  constructor(props, context) {
    super(props, context);
    this._translate = context.injector.get('translate');
    this._modeling = context.injector.get('modeling');
    const {
      element
    } = this.props.context;
    const parsedString = parseString(element.businessObject.text);
    if (parsedString) {
      this.state = {
        value: parsedString.value
      };
    } else {
      this.state = {
        value: ''
      };
    }
    const debounceInput = context.injector.get('debounceInput');
    this.debouncedEditCell = debounceInput(this.editCell.bind(this));
    this.editCell = this.editCell.bind(this);
    this.onInput = this.onInput.bind(this);
  }
  editCell(cell, text) {
    this._modeling.editCell(cell, text);
  }
  onInput(value) {
    const {
      element
    } = this.props.context;
    this.debouncedEditCell(element.businessObject, value);
    this.setState({
      value
    });
  }
  render() {
    const {
      value
    } = this.state;
    return createVNode(1, "div", "context-menu-container simple-number-edit", [createVNode(1, "h3", "dms-heading", this._translate('Edit number'), 0), createVNode(1, "h4", "dms-heading", this._translate('Set value'), 0), createComponentVNode(2, Input, {
      "onInput": this.onInput,
      "type": "number",
      "value": value
    })], 4);
  }
}
//# sourceMappingURL=OutputNumberEdit.js.map