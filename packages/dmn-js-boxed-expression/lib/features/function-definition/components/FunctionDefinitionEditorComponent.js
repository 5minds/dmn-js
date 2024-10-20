import { createVNode, createComponentVNode, createTextVNode } from "inferno";
import { is } from 'dmn-js-shared/lib/util/ModelUtil';
import { withChangeSupport } from '../../../util/withChangeSupport';
import { EditButton } from '../../../components/EditButton';
export class FunctionDefinitionComponentProvider {
  static $inject = ['components'];
  constructor(components) {
    components.onGetComponent('expression', ({
      expression
    }) => {
      if (is(expression, 'dmn:FunctionDefinition')) {
        return FunctionDefinitionEditorComponent;
      }
    });
  }
}
const FunctionDefinitionEditorComponent = withChangeSupport(_FunctionDefinitionEditorComponent, props => [props.expression]);
function _FunctionDefinitionEditorComponent({
  expression
}, context) {
  const functionDefinition = context.injector.get('functionDefinition');
  const contextMenu = context.injector.get('contextMenu');
  const kind = functionDefinition.getKind(expression);
  const parameters = functionDefinition.getParameters(expression);
  const body = functionDefinition.getBody(expression);
  const openKindEditor = event => {
    const position = getParentPosition(event);
    contextMenu.open(position, {
      contextMenuType: 'kind-editor',
      expression
    });
  };
  const openFormalParametersEditor = event => {
    const position = getParentPosition(event);
    contextMenu.open(position, {
      contextMenuType: 'formal-parameters-editor',
      expression
    });
  };
  return createVNode(1, "div", "function-definition", [createComponentVNode(2, Kind, {
    "kind": kind,
    "openEditor": openKindEditor
  }), createComponentVNode(2, FormalParameters, {
    "parameters": parameters,
    "openEditor": openFormalParametersEditor
  }), createComponentVNode(2, BodyExpression, {
    "expression": body
  })], 4);
}
const KIND_MAP = {
  'FEEL': 'F',
  'Java': 'J',
  'PMML': 'P'
};
function Kind({
  kind,
  openEditor
}, context) {
  const translate = context.injector.get('translate');
  return createVNode(1, "div", "function-definition-kind", [KIND_MAP[kind], createComponentVNode(2, EditButton, {
    "label": translate('Edit function kind'),
    "onClick": openEditor
  })], 0);
}
function FormalParameters({
  openEditor,
  parameters
}, context) {
  const translate = context.injector.get('translate');
  return createVNode(1, "div", "function-definition-parameters", [createVNode(1, "div", null, [createTextVNode("("), parameters.reduce((acc, parameter) => {
    return acc.concat(createComponentVNode(2, Parameter, {
      "parameter": parameter
    }), ', ');
  }, []).slice(0, -1), createTextVNode(")")], 0), createComponentVNode(2, EditButton, {
    "label": translate('Edit formal parameters'),
    "onClick": openEditor
  })], 4);
}
const Parameter = withChangeSupport(_Parameter, props => [props.parameter]);
function _Parameter({
  parameter
}) {
  const {
    name,
    typeRef
  } = parameter;
  const displayedName = name || '<unnamed>';
  return createVNode(1, "span", null, typeRef ? `${displayedName}: ${typeRef}` : displayedName, 0);
}
function BodyExpression({
  expression
}, context) {
  const Expression = context.components.getComponent('expression', {
    expression
  });
  return createVNode(1, "div", "function-definition-body", createComponentVNode(2, Expression, {
    "expression": expression
  }), 2);
}
function getParentPosition(event) {
  const parent = event.target.parentElement,
    bbox = parent.getBoundingClientRect();
  return {
    x: bbox.x,
    y: bbox.y
  };
}
//# sourceMappingURL=FunctionDefinitionEditorComponent.js.map