import { createVNode } from "inferno";
import { Component } from 'inferno';
import { inject, mixin } from 'table-js/lib/components';
import { ComponentWithSlots } from 'dmn-js-shared/lib/components/mixins';
const MIN_WIDTH = 400;
export default class AnnotationHeader extends Component {
  constructor(props, context) {
    super(props, context);
    mixin(this, ComponentWithSlots);
    inject(this);
  }
  componentDidMount() {
    this.changeSupport.onElementsChanged(this.getRoot(), this.onElementsChanged);
  }
  componentWillUnmount() {
    this.changeSupport.offElementsChanged(this.getRoot(), this.onElementsChanged);
  }
  onElementsChanged = () => {
    this.forceUpdate();
  };
  getRoot() {
    return this.sheet.getRoot();
  }
  render() {
    const decisionTable = this.getRoot();
    const annotationsWidth = decisionTable.businessObject.get('annotationsWidth');
    const width = (annotationsWidth || MIN_WIDTH) + 'px';
    return createVNode(1, "th", "annotation header", [this.slotFills({
      type: 'cell-inner',
      context: {
        cellType: 'annotations',
        col: this.sheet.getRoot(),
        minWidth: MIN_WIDTH
      }
    }), this.translate('Annotations')], 0, {
      "style": {
        width
      }
    });
  }
}
AnnotationHeader.$inject = ['changeSupport', 'sheet', 'translate'];
//# sourceMappingURL=AnnotationHeader.js.map