import { createVNode, createComponentVNode } from "inferno";
import { Component } from 'inferno';
import EditableComponent from 'dmn-js-shared/lib/components/EditableComponent';
import { Cell, inject } from 'table-js/lib/components';
export default class EditableAnnotationCell extends Component {
  constructor(props, context) {
    super(props, context);
    inject(this);
  }
  componentWillMount() {
    const {
      row
    } = this.props;
    this.changeSupport.onElementsChanged(row.id, this.onElementsChanged);
  }
  componentWillUnmount() {
    const {
      row
    } = this.props;
    this.changeSupport.offElementsChanged(row.id, this.onElementsChanged);
  }
  onElementsChanged = () => {
    this.forceUpdate();
  };
  setAnnotationValue = text => {
    const {
      row
    } = this.props;
    this.modeling.editAnnotation(row.businessObject, text);
  };
  render() {
    const {
      row,
      rowIndex
    } = this.props;
    const {
      description,
      id
    } = row.businessObject;
    return createComponentVNode(2, Cell, {
      "className": "annotation",
      "onChange": this.setAnnotationValue,
      "coords": `${rowIndex}:annotation`,
      "value": description,
      "elementId": id,
      "data-row-id": row.id,
      children: createComponentVNode(2, AnnotationEditor, {
        "label": this.translate('Annotation'),
        "ctrlForNewline": true,
        "className": "annotation-editor",
        "onChange": this.setAnnotationValue,
        "value": description
      })
    });
  }
}
EditableAnnotationCell.$inject = ['changeSupport', 'modeling', 'translate'];
class AnnotationEditor extends EditableComponent {
  render() {
    return createVNode(1, "div", this.getClassName(), this.getEditor(), 0);
  }
}
//# sourceMappingURL=AnnotationCell.js.map