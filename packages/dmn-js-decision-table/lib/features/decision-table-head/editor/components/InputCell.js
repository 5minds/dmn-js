import { createVNode } from "inferno";
import { Component } from 'inferno';
import { mixin } from 'table-js/lib/components';
import { ComponentWithSlots } from 'dmn-js-shared/lib/components/mixins';
export default class InputCell extends Component {
  constructor(props, context) {
    super(props, context);
    mixin(this, ComponentWithSlots);
    this._translate = context.injector.get('translate');
  }
  onClick = event => {
    const {
      input
    } = this.props;
    this._eventBus.fire('input.edit', {
      event,
      input
    });
  };
  onContextmenu = event => {
    const {
      id
    } = this.props.input;
    this._eventBus.fire('cell.contextmenu', {
      event,
      id
    });
  };
  onElementsChanged = () => {
    this.forceUpdate();
  };
  componentWillMount() {
    const {
      injector
    } = this.context;
    this._changeSupport = this.context.changeSupport;
    this._sheet = injector.get('sheet');
    this._eventBus = injector.get('eventBus');
    this._elementRegistry = injector.get('elementRegistry');
    const root = this._sheet.getRoot();
    const {
      input
    } = this.props;
    this._changeSupport.onElementsChanged(root.id, this.onElementsChanged);
    this._changeSupport.onElementsChanged(input.id, this.onElementsChanged);
  }
  componentWillUnmount() {
    const root = this._sheet.getRoot();
    const {
      input
    } = this.props;
    this._changeSupport.offElementsChanged(root.id, this.onElementsChanged);
    this._changeSupport.offElementsChanged(input.id, this.onElementsChanged);
  }
  render() {
    const {
      input,
      index,
      inputsLength
    } = this.props;
    const {
      inputExpression,
      inputValues
    } = input;
    const label = input.get('label');
    const width = input.width ? input.width + 'px' : '192px';
    return createVNode(1, "th", "input-cell input-editor", [this.slotFills({
      type: 'cell-inner',
      context: {
        cellType: 'input-cell',
        col: this._elementRegistry.get(input.id),
        index,
        inputsLength
      },
      col: input
    }), createVNode(1, "div", "clause", index === 0 ? this._translate('When') : this._translate('And'), 0), label ? createVNode(1, "div", "input-label", label, 0, {
      "title": this._translate('Input label: ') + label
    }) : createVNode(1, "div", "input-expression", inputExpression.text, 0, {
      "title": this._translate('Input expression: ') + inputExpression.text
    }), createVNode(1, "div", "input-variable", inputValues && inputValues.text || this._translate(inputExpression.typeRef || ''), 0, {
      "title": inputValues && inputValues.text ? this._translate('Input values') : this._translate('Input type')
    })], 0, {
      "data-col-id": input.id,
      "onDblClick": this.onClick,
      "onContextmenu": this.onContextmenu,
      "style": {
        width
      }
    });
  }
}
//# sourceMappingURL=InputCell.js.map