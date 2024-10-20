import { createVNode } from "inferno";
import { Component } from 'inferno';
import { mixin } from 'table-js/lib/components';
import { ComponentWithSlots } from 'dmn-js-shared/lib/components/mixins';
export default class OutputCell extends Component {
  constructor(props, context) {
    super(props, context);
    mixin(this, ComponentWithSlots);
    this._translate = context.injector.get('translate');
  }
  onClick = event => {
    const {
      output
    } = this.props;
    this._eventBus.fire('output.edit', {
      event,
      output
    });
  };
  onContextmenu = event => {
    const {
      id
    } = this.props.output;
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
    this._eventBus = injector.get('eventBus');
    this._elementRegistry = injector.get('elementRegistry');
    const {
      output
    } = this.props;
    this._changeSupport.onElementsChanged(output.id, this.onElementsChanged);
  }
  componentWillUnmount() {
    const {
      output
    } = this.props;
    this._changeSupport.offElementsChanged(output.id, this.onElementsChanged);
  }
  render() {
    const {
      output,
      index,
      outputsLength
    } = this.props;
    const {
      label,
      name,
      outputValues,
      typeRef
    } = output;
    const width = output.width ? output.width + 'px' : '192px';
    return createVNode(1, "th", "output-cell output-editor", [this.slotFills({
      type: 'cell-inner',
      context: {
        cellType: 'output-cell',
        col: this._elementRegistry.get(output.id),
        index,
        outputsLength
      },
      col: output
    }), createVNode(1, "div", "clause", index === 0 ? this._translate('Then') : this._translate('And'), 0), label ? createVNode(1, "div", "output-label", label, 0, {
      "title": this._translate('Output label: ') + label
    }) : createVNode(1, "div", "output-name", name, 0, {
      "title": this._translate('Output name: ') + name
    }), createVNode(1, "div", "output-variable", outputValues && outputValues.text || this._translate(typeRef || ''), 0, {
      "title": outputValues && outputValues.text ? this._translate('Output values') : this._translate('Output type')
    })], 0, {
      "data-col-id": output.id,
      "onDblClick": this.onClick,
      "onContextmenu": this.onContextmenu,
      "style": {
        width
      }
    });
  }
}
//# sourceMappingURL=OutputCell.js.map