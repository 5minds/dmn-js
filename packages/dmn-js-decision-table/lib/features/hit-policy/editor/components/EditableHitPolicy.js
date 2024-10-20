import { createVNode, createComponentVNode } from "inferno";
import { Component } from 'inferno';
import { find } from 'min-dash';
import InputSelect from 'dmn-js-shared/lib/components/InputSelect';
import { inject } from 'table-js/lib/components';
import { HIT_POLICIES } from './../../HitPolicies';
export default class EditableHitPolicy extends Component {
  constructor(props, context) {
    super(props, context);
    this._translate = context.injector.get('translate');
    inject(this);
  }
  onChange = ({
    aggregation,
    hitPolicy
  }) => {
    this.modeling.editHitPolicy(hitPolicy, aggregation);
  };
  onElementsChanged = () => {
    this.forceUpdate();
  };
  componentDidMount() {
    this.changeSupport.onElementsChanged(this.getRoot().id, this.onElementsChanged);
  }
  componentWillUnmount() {
    this.changeSupport.offElementsChanged(this.getRoot().id, this.onElementsChanged);
  }
  getRoot() {
    return this.sheet.getRoot();
  }
  render() {
    const root = this.getRoot(),
      businessObject = root.businessObject;
    const {
      aggregation,
      hitPolicy
    } = businessObject;
    const hitPolicyEntry = find(HIT_POLICIES, entry => {
      return isEqualHitPolicy(entry.value, {
        aggregation,
        hitPolicy
      });
    });
    return createVNode(1, "div", "hit-policy", [createVNode(1, "label", "dms-label", this._translate('Hit policy:'), 0), createComponentVNode(2, InputSelect, {
      "className": "hit-policy-edit-policy-select",
      "label": this._translate('Hit policy'),
      "onChange": this.onChange,
      "options": HIT_POLICIES.map(entry => ({
        ...entry,
        label: this._translate(entry.label)
      })),
      "value": hitPolicyEntry.value,
      "data-hit-policy": "true",
      "noInput": true
    })], 4, {
      "title": this._translate(hitPolicyEntry.explanation)
    });
  }
}
EditableHitPolicy.$inject = ['changeSupport', 'sheet', 'modeling'];

// helpers //////////////////////
function isEqualHitPolicy(a, b) {
  return a.hitPolicy === b.hitPolicy && a.aggregation === b.aggregation;
}
//# sourceMappingURL=EditableHitPolicy.js.map