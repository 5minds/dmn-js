import { createVNode, createComponentVNode } from "inferno";
import { Component } from 'inferno';
import Input from 'dmn-js-shared/lib/components/Input';
import InputSelect from 'dmn-js-shared/lib/components/InputSelect';
export default class LiteralExpressionPropertiesComponent extends Component {
  constructor(props, context) {
    super(props, context);
    this._translate = context.injector.get('translate');
    this._viewer = context.injector.get('viewer');
    this._modeling = context.injector.get('modeling');
    this._dataTypes = context.injector.get('dataTypes');
    const decision = this._viewer.getDecision();
    this.state = {
      name: decision.variable.name,
      typeRef: decision.variable.typeRef
    };
    this.setVariableName = this.setVariableName.bind(this);
    this.setVariableType = this.setVariableType.bind(this);
  }
  setVariableName(name) {
    this._modeling.editVariableName(name);
    this.setState({
      name
    });
  }
  setVariableType(typeRef) {
    if (typeRef === '') {
      this._modeling.editVariableType(undefined);
      this.setState({
        typeRef: undefined
      });
    } else {
      this._modeling.editVariableType(typeRef);
      this.setState({
        typeRef
      });
    }
  }
  render() {
    const {
      name,
      typeRef
    } = this.state;
    const typeRefOptions = this._dataTypes.getAll().map(t => {
      return {
        label: this._translate(t),
        value: t
      };
    });
    return createVNode(1, "div", "literal-expression-properties", createVNode(1, "table", null, [createVNode(1, "tr", null, [createVNode(1, "td", null, this._translate('Variable name:'), 0), createVNode(1, "td", null, createComponentVNode(2, Input, {
      "label": this._translate('Variable name'),
      "className": "variable-name-input",
      "onInput": this.setVariableName,
      "placeholder": this._translate('name'),
      "value": name || ''
    }), 2)], 4), createVNode(1, "tr", null, [createVNode(1, "td", null, this._translate('Variable type:'), 0), createVNode(1, "td", null, createVNode(1, "div", "dms-fill-row", createComponentVNode(2, InputSelect, {
      "label": this._translate('Variable type'),
      "onChange": this.setVariableType,
      "options": typeRefOptions,
      "value": typeRef,
      "className": "variable-type-select dms-block"
    }), 2), 2)], 4), createComponentVNode(2, ExpressionLanguage)], 4), 2);
  }
}
class ExpressionLanguage extends Component {
  constructor(props, context) {
    super(props, context);
    this._translate = context.injector.get('translate');
    this._viewer = context.injector.get('viewer');
    this._modeling = context.injector.get('modeling');
    this._expressionLanguages = context.injector.get('expressionLanguages');
    this.setExpressionLanguage = this.setExpressionLanguage.bind(this);
  }
  setExpressionLanguage(expressionLanguage) {
    if (expressionLanguage === '') {
      this._modeling.editExpressionLanguage(undefined);
    } else {
      this._modeling.editExpressionLanguage(expressionLanguage);
    }
  }
  _getExpressionLanguage() {
    const decision = this._viewer.getDecision();
    const literalExpression = decision.decisionLogic;
    return literalExpression && literalExpression.expressionLanguage ? literalExpression.expressionLanguage.toLowerCase() : this._getDefaultExpressionLanguage();
  }
  _getDefaultExpressionLanguage() {
    return this._expressionLanguages.getDefault().value;
  }
  _shouldRender() {
    const expressionLanguages = this._expressionLanguages.getAll();
    if (expressionLanguages.length > 1) {
      return true;
    }
    const expressionLanguage = this._getExpressionLanguage();
    return expressionLanguage !== this._getDefaultExpressionLanguage();
  }
  render() {
    if (!this._shouldRender()) {
      return null;
    }
    const expressionLanguage = this._getExpressionLanguage();
    const languageOptions = this._expressionLanguages.getAll();
    return createVNode(1, "tr", null, [createVNode(1, "td", null, this._translate('Expression language:'), 0), createVNode(1, "td", null, createVNode(1, "div", "dms-fill-row", createComponentVNode(2, InputSelect, {
      "label": this._translate('Expression language'),
      "onChange": this.setExpressionLanguage,
      "options": languageOptions,
      "value": expressionLanguage,
      "className": "expression-language-select dms-block"
    }), 2), 2)], 4);
  }
}
//# sourceMappingURL=LiteralExpressionPropertiesEditorComponent.js.map