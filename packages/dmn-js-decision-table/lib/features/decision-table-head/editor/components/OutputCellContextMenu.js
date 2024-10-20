import { createComponentVNode } from "inferno";
import { Component } from 'inferno';
import OutputEditor from './OutputEditor';
import { inject } from 'table-js/lib/components';
export default class OutputCellContextMenu extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {};
    inject(this);
    this.persistChanges = this.debounceInput(this.persistChanges);
  }
  persistChanges = () => {
    const {
      output
    } = this.props.context;
    const {
      unsaved
    } = this.state;
    if (!unsaved) {
      return;
    }
    this.modeling.updateProperties(output, unsaved);
    this.setState({
      unsaved: false
    });
  };
  handleChange = changes => {
    this.setState({
      unsaved: {
        ...this.state.unsaved,
        ...changes
      }
    }, this.persistChanges);
  };
  getValue(attr) {
    const {
      output
    } = this.props.context;
    const {
      unsaved
    } = this.state;
    return unsaved && attr in unsaved ? unsaved[attr] : output.get(attr);
  }
  render() {
    return createComponentVNode(2, OutputEditor, {
      "name": this.getValue('name'),
      "label": this.getValue('label'),
      "onChange": this.handleChange
    });
  }
}
OutputCellContextMenu.$inject = ['debounceInput', 'modeling'];
//# sourceMappingURL=OutputCellContextMenu.js.map