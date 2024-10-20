import { createVNode, createComponentVNode } from "inferno";
import { Component } from 'inferno';
import InputSelect from 'dmn-js-shared/lib/components/InputSelect';
import List from 'dmn-js-shared/lib/components/List';
import ValidatedInput from 'dmn-js-shared/lib/components/ValidatedInput';
import { isInput } from 'dmn-js-shared/lib/util/ModelUtil';
import { getInputOrOutputValues, parseString } from '../Utils';
const DISJUNCTION = 'disjunction',
  NEGATION = 'negation';
const INPUT_VALUES_LABEL = 'Predefined values',
  OUTPUT_VALUES_LABEL = 'Predefined values',
  INPUT_ENTRY_VALUES_LABEL = 'Custom values';
export default class SimpleStringEditContextMenuComponent extends Component {
  constructor(props, context) {
    super(props, context);
    this._translate = context.injector.get('translate');
    this._modeling = context.injector.get('modeling');
    let parsedString = parseString(props.context.element.businessObject.text);

    // could not parse
    if (!parsedString) {
      parsedString = {
        values: [],
        type: DISJUNCTION
      };
    }
    const inputOrOutputValues = getInputOrOutputValues(props.context.element.col.businessObject);
    const filteredValues = parsedString.values.filter(value => {
      return !includes(inputOrOutputValues, value);
    });
    const isInputClause = isInput(props.context.element.col);
    let items = inputOrOutputValues.map(value => {
      return {
        value,
        isChecked: includes(parsedString.values, value),
        isRemovable: false,
        group: isInputClause ? this._translate(INPUT_VALUES_LABEL) : this._translate(OUTPUT_VALUES_LABEL)
      };
    });
    if (isInputClause) {
      items = items.concat(filteredValues.map(value => {
        return {
          value,
          isChecked: true,
          isRemovable: true,
          group: this._translate(INPUT_ENTRY_VALUES_LABEL)
        };
      }));
    }
    let inputValue = '';
    if (!isInputClause && parsedString.values.length && !includes(inputOrOutputValues, parsedString.values[0])) {
      inputValue = parsedString.values[0];
    }
    this.state = {
      items,
      unaryTestsType: parsedString.type,
      inputValue,
      isOutputValueInputChecked: inputValue !== ''
    };
    const debounceInput = context.injector.get('debounceInput');
    this.debouncedEditCell = debounceInput(this.editCell.bind(this));
    this.editCell = this.editCell.bind(this);
    this.addUnaryTestsListItem = this.addUnaryTestsListItem.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onOutputValueInputClick = this.onOutputValueInputClick.bind(this);
    this.onUnaryTestsListChanged = this.onUnaryTestsListChanged.bind(this);
    this.onUnaryTestsTypeChange = this.onUnaryTestsTypeChange.bind(this);
  }
  editCell(cell, text) {
    this._modeling.editCell(cell, text);
  }

  /**
   * Change type of unary tests.
   */
  onUnaryTestsTypeChange(value) {
    const {
      items
    } = this.state;
    const values = getValues(items);
    const {
      element
    } = this.props.context;
    if (value === DISJUNCTION) {
      this.editCell(element.businessObject, values.join(','));
      this.setState({
        unaryTestsType: DISJUNCTION
      });
    } else {
      this.editCell(element.businessObject, `not(${values.join(',')})`);
      this.setState({
        unaryTestsType: NEGATION
      });
    }
  }

  /**
   * Change list of unary tests.
   */
  onUnaryTestsListChanged(items) {
    // get checked items
    const values = getValues(items);
    const {
      element
    } = this.props.context;
    const {
      unaryTestsType
    } = this.state;
    if (unaryTestsType === DISJUNCTION) {
      this.editCell(element.businessObject, values.join(','));
    } else {
      this.editCell(element.businessObject, `not(${values.join(',')})`);
    }
    this.setState({
      items,
      isOutputValueInputChecked: false
    });
  }

  /**
   * Set output value to input value.
   */
  onOutputValueInputClick() {
    const {
      element
    } = this.props.context;
    const {
      inputValue,
      items
    } = this.state;
    const parsedString = parseString(inputValue);
    if (!parsedString || parsedString.values.length > 1) {
      return;
    }
    this.editCell(element.businessObject, `${parsedString.values.join('')}`);

    // uncheck all other values
    this.setState({
      items: items.map(item => {
        item.isChecked = false;
        return item;
      }),
      isOutputValueInputChecked: true
    });
  }

  /**
   * Set output value if valid.
   */
  onInput({
    isValid,
    value
  }) {
    const {
      isOutputValueInputChecked
    } = this.state;
    this.setState({
      inputValue: value
    });
    const {
      element
    } = this.props.context;
    if (!isInput(element) && isValid && isOutputValueInputChecked) {
      this.debouncedEditCell(element.businessObject, value);
    }
  }

  /**
   * Add new value on ENTER.
   */
  onKeyDown({
    isValid,
    event
  }) {
    if (!isEnter(event.keyCode)) {
      return;
    }
    const {
      element
    } = this.props.context;
    const isInputClause = isInput(element.col);

    // stop ENTER propagation (and ContextMenu close)
    if (isInputClause || !isValid) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (isValid) {
      if (isInputClause) {
        this.addUnaryTestsListItem();
      } else {
        this.onOutputValueInputClick();
      }
    }
  }

  /**
   * Add unary tests to list.
   */
  addUnaryTestsListItem() {
    const {
      inputValue,
      items,
      unaryTestsType
    } = this.state;
    const parsedInput = parseString(inputValue);
    if (!parsedInput) {
      return;
    }
    const {
      element
    } = this.props.context;
    const values = getValues(items);
    const newValues = [].concat(values, parsedInput.values);
    if (unaryTestsType === DISJUNCTION) {
      this.editCell(element.businessObject, newValues.join(','));
    } else {
      this.editCell(element.businessObject, `not(${newValues.join(',')})`);
    }
    const newItems = items.concat(parsedInput.values.map(value => {
      return {
        value,
        isChecked: true,
        isRemovable: true,
        group: this._translate('Custom values')
      };
    }));
    this.setState({
      items: newItems,
      inputValue: ''
    });
  }
  render() {
    const {
      element
    } = this.props.context;
    const {
      inputValue,
      isOutputValueInputChecked,
      items,
      unaryTestsType
    } = this.state;
    const options = [{
      label: this._translate('Match one'),
      value: DISJUNCTION
    }, {
      label: this._translate('Match none'),
      value: NEGATION
    }];
    const isInputClause = isInput(element.col);
    const isNegation = unaryTestsType === NEGATION;
    const showRadio = !isInputClause && items.length > 0;
    return createVNode(1, "div", "simple-string-edit context-menu-container", [createVNode(1, "h3", "dms-heading", this._translate('Edit string'), 0), isInputClause && createVNode(1, "p", null, createComponentVNode(2, InputSelect, {
      "label": this._translate('String value'),
      "noInput": true,
      "onChange": this.onUnaryTestsTypeChange,
      "options": options,
      "value": isNegation ? NEGATION : DISJUNCTION
    }, null, node => this.selectNode = node), 2), createComponentVNode(2, List, {
      "onChange": this.onUnaryTestsListChanged,
      "items": items,
      "type": isInputClause ? 'checkbox' : 'radio'
    }), isInputClause ? createVNode(1, "h4", "dms-heading", this._translate('Add values'), 0) : createVNode(1, "h4", "dms-heading", this._translate('Set value'), 0), createVNode(1, "div", "dms-fill-row", [showRadio && createVNode(64, "input", "cursor-pointer", null, 1, {
      "checked": isOutputValueInputChecked,
      "onClick": this.onOutputValueInputClick,
      "type": "radio",
      "style": {
        marginRight: '8px'
      }
    }), createComponentVNode(2, ValidatedInput, {
      "label": isInputClause ? this._translate('Values') : this._translate('Value'),
      "className": "dms-block",
      "onKeyDown": this.onKeyDown,
      "onInput": this.onInput,
      "placeholder": isInputClause ? this._translate('"value", "value", ...') : this._translate('"value"'),
      "type": "text",
      "validate": value => {
        if (!parseString(value)) {
          return this._translate('Strings must be in double quotes');
        }
      },
      "value": inputValue
    })], 0)], 0);
  }
}

// helpers //////////////////////

function isEnter(keyCode) {
  return keyCode === 13;
}

/**
 * Get array of actual values from array of items.
 *
 * @param {Array} items - Array of items.
 */
function getValues(items) {
  return items.filter(item => item.isChecked).map(item => item.value);
}
function includes(array, value) {
  return array.indexOf(value) !== -1;
}
//# sourceMappingURL=SimpleStringEditContextMenuComponent.js.map