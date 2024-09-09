import { assign } from 'min-dash';
import inherits from 'inherits-browser';
import { remove as collectionRemove, add as collectionAdd } from 'diagram-js/lib/util/Collections';
import { is, isAny } from 'dmn-js-shared/lib/util/ModelUtil';
import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

/**
 * Update DMN 1.3 information.
 */
export default function DrdUpdater(connectionDocking, definitionPropertiesView, drdFactory, drdRules, injector) {
  injector.invoke(CommandInterceptor, this);
  this._definitionPropertiesView = definitionPropertiesView;
  this._drdFactory = drdFactory;
  this._drdRules = drdRules;
  var self = this;
  function cropConnection(context) {
    var connection = context.connection,
      cropped = context.cropped;
    if (!cropped) {
      connection.waypoints = connectionDocking.getCroppedWaypoints(connection);
      context.cropped = true;
    }
  }
  this.executed(['connection.create', 'connection.layout'], cropConnection, true);
  this.reverted(['connection.layout'], function (context) {
    delete context.cropped;
  }, true);
  function updateParent(context) {
    var connection = context.connection,
      parent = context.parent,
      shape = context.shape;
    if (connection && !is(connection, 'dmn:Association')) {
      parent = connection.target;
    }
    self.updateParent(shape || connection, parent);
  }
  function reverseUpdateParent(context) {
    var connection = context.connection,
      shape = context.shape;
    var oldParent = context.parent || context.newParent;
    if (connection && !is(connection, 'dmn:Association')) {
      oldParent = connection.target;
    }
    self.updateParent(shape || connection, oldParent);
  }
  this.executed(['connection.create', 'connection.delete', 'connection.move', 'shape.create', 'shape.delete', 'shape.move'], updateParent, true);
  this.reverted(['connection.create', 'connection.delete', 'connection.move', 'shape.create', 'shape.delete'], reverseUpdateParent, true);
  function updateBounds(context) {
    var shape = context.shape;
    if (!(is(shape, 'dmn:DRGElement') || is(shape, 'dmn:TextAnnotation'))) {
      return;
    }
    self.updateBounds(shape);
  }
  this.executed(['shape.create', 'shape.move', 'shape.resize'], updateBounds, true);
  this.reverted(['shape.create', 'shape.move', 'shape.resize'], updateBounds, true);
  function updateConnectionWaypoints(context) {
    self.updateConnectionWaypoints(context);
  }
  this.executed(['connection.create', 'connection.layout', 'connection.move', 'connection.updateWaypoints'], updateConnectionWaypoints, true);
  this.reverted(['connection.create', 'connection.layout', 'connection.move', 'connection.updateWaypoints'], updateConnectionWaypoints, true);
  this.executed('connection.create', function (context) {
    var connection = context.connection,
      connectionBo = connection.businessObject,
      target = context.target,
      targetBo = target.businessObject;
    if (is(connection, 'dmn:Association')) {
      updateParent(context);
    } else {
      // parent is target
      self.updateSemanticParent(connectionBo, targetBo);
    }
  }, true);
  this.reverted('connection.create', function (context) {
    reverseUpdateParent(context);
  }, true);
  this.executed('connection.reconnect', function (context) {
    var connection = context.connection,
      connectionBo = connection.businessObject,
      newTarget = context.newTarget,
      newTargetBo = newTarget.businessObject;
    if (is(connectionBo, 'dmn:Association')) {
      return;
    }
    self.updateSemanticParent(connectionBo, newTargetBo);
  }, true);
  this.reverted('connection.reconnect', function (context) {
    var connection = context.connection,
      connectionBo = connection.businessObject,
      oldTarget = context.oldTarget,
      oldTargetBo = oldTarget.businessObject;
    if (is(connectionBo, 'dmn:Association')) {
      return;
    }
    self.updateSemanticParent(connectionBo, oldTargetBo);
  }, true);
  this.executed('element.updateProperties', function (context) {
    definitionPropertiesView.update();
  }, true);
  this.reverted('element.updateProperties', function (context) {
    definitionPropertiesView.update();
  }, true);
}
inherits(DrdUpdater, CommandInterceptor);
DrdUpdater.$inject = ['connectionDocking', 'definitionPropertiesView', 'drdFactory', 'drdRules', 'injector'];
DrdUpdater.prototype.updateBounds = function (shape) {
  var businessObject = shape.businessObject,
    bounds = businessObject.di.bounds;

  // update bounds
  assign(bounds, {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height
  });
};
DrdUpdater.prototype.updateConnectionWaypoints = function (context) {
  var drdFactory = this._drdFactory;
  var connection = context.connection,
    businessObject = connection.businessObject,
    edge = businessObject.di;
  edge.waypoint = drdFactory.createDiWaypoints(connection.waypoints).map(function (waypoint) {
    waypoint.$parent = edge;
    return waypoint;
  });
};
DrdUpdater.prototype.updateParent = function (element, oldParent) {
  var parent = element.parent;
  if (!is(element, 'dmn:DRGElement') && !is(element, 'dmn:Artifact')) {
    parent = oldParent;
  }
  var businessObject = element.businessObject,
    parentBo = parent && parent.businessObject;
  this.updateSemanticParent(businessObject, parentBo);
  this.updateDiParent(businessObject.di, parentBo && parentBo.di);
};
DrdUpdater.prototype.updateSemanticParent = function (businessObject, parent) {
  if (businessObject.$parent === parent) {
    return;
  }
  if (is(businessObject, 'dmn:Decision') && is(parent, 'dmn:DecisionService') && is(businessObject.$parent, 'dmn:Definitions')) {
    // Moving decision from definitions to decision service

    // add to new parent (decision service)
    const outputDecisions = parent.get('outputDecision');
    const encapsulatedDecisions = parent.get('encapsulatedDecision');
    const outputDecision = this._drdFactory.create('dmn:DMNElementReference', {
      href: '#' + businessObject.id
    });
    const encapsulatedDecision = this._drdFactory.create('dmn:DMNElementReference', {
      href: '#' + businessObject.id
    });
    outputDecisions.push(outputDecision);
    encapsulatedDecisions.push(encapsulatedDecision);
    outputDecision.$parent = parent;
    encapsulatedDecision.$parent = parent;
    businessObject.$parent = parent;
  } else if (is(businessObject, 'dmn:Decision') && is(parent, 'dmn:Definitions') && is(businessObject.$parent, 'dmn:DecisionService')) {
    // Moving decision from decision service to definitions

    // remove from old parent (decision service)
    const outputDecisions = businessObject.$parent.get('outputDecision');
    const encapsulatedDecisions = businessObject.$parent.get('encapsulatedDecision');
    const deleteIndexOutput = outputDecisions.findIndex(decision => decision.href === '#' + businessObject.id);
    const deleteIndexEncapsulated = encapsulatedDecisions.findIndex(decision => decision.href === '#' + businessObject.id);
    outputDecisions.splice(deleteIndexOutput, 1);
    encapsulatedDecisions.splice(deleteIndexEncapsulated, 1);

    // add to new parent (definitions)
    businessObject.$parent = parent;
  } else if (is(businessObject, 'dmn:Decision') && is(parent, 'dmn:DecisionService') && !businessObject.$parent) {
    // Creating decision in decision service

    // add to new parent (decision service)
    const outputDecisions = parent.get('outputDecision');
    const encapsulatedDecisions = parent.get('encapsulatedDecision');
    const outputDecision = this._drdFactory.create('dmn:DMNElementReference', {
      href: '#' + businessObject.id
    });
    const encapsulatedDecision = this._drdFactory.create('dmn:DMNElementReference', {
      href: '#' + businessObject.id
    });
    outputDecisions.push(outputDecision);
    encapsulatedDecisions.push(encapsulatedDecision);
    outputDecision.$parent = parent;
    encapsulatedDecision.$parent = parent;
    businessObject.$parent = parent;

    // add to definitions as drgElement
    const drgElement = parent.$parent.get('drgElement');
    drgElement.push(businessObject);
  } else if (is(businessObject, 'dmn:Decision') && parent === null && is(businessObject.$parent, 'dmn:DecisionService')) {
    // Deleting decision from decision service

    // remove from old parent (decision service)
    const outputDecisions = businessObject.$parent.get('outputDecision');
    const encapsulatedDecisions = businessObject.$parent.get('encapsulatedDecision');
    const deleteIndexOutput = outputDecisions.findIndex(decision => decision.href === '#' + businessObject.id);
    const deleteIndexEncapsulated = encapsulatedDecisions.findIndex(decision => decision.href === '#' + businessObject.id);
    outputDecisions.splice(deleteIndexOutput, 1);
    encapsulatedDecisions.splice(deleteIndexEncapsulated, 1);

    // remove from definitions as drgElement
    const drgElement = businessObject.$parent.$parent.get('drgElement');
    collectionRemove(drgElement, businessObject);
  } else if (is(businessObject, 'dmn:Decision') && is(parent, 'dmn:DecisionService') && is(businessObject.$parent, 'dmn:DecisionService') && businessObject.$parent !== parent) {
    // Moving decision from decision service to another decision service

    // remove from old parent (decision service)
    const outputDecisions = businessObject.$parent.get('outputDecision');
    const encapsulatedDecisions = businessObject.$parent.get('encapsulatedDecision');
    const deleteIndexOutput = outputDecisions.findIndex(decision => decision.href === '#' + businessObject.id);
    const deleteIndexEncapsulated = encapsulatedDecisions.findIndex(decision => decision.href === '#' + businessObject.id);
    outputDecisions.splice(deleteIndexOutput, 1);
    encapsulatedDecisions.splice(deleteIndexEncapsulated, 1);

    // add to new parent (decision service)
    const outputDecisionsNew = parent.get('outputDecision');
    const encapsulatedDecisionsNew = parent.get('encapsulatedDecision');
    const outputDecision = this._drdFactory.create('dmn:DMNElementReference', {
      href: '#' + businessObject.id
    });
    const encapsulatedDecision = this._drdFactory.create('dmn:DMNElementReference', {
      href: '#' + businessObject.id
    });
    outputDecisionsNew.push(outputDecision);
    encapsulatedDecisionsNew.push(encapsulatedDecision);
    outputDecision.$parent = parent;
    encapsulatedDecision.$parent = parent;
    businessObject.$parent = parent;
  } else {
    // Any other case

    let containment;
    if (is(businessObject, 'dmn:DRGElement')) {
      containment = 'drgElement';
    } else if (is(businessObject, 'dmn:Artifact')) {
      containment = 'artifact';
    } else if (is(businessObject, 'dmn:InformationRequirement')) {
      containment = 'informationRequirement';
    } else if (is(businessObject, 'dmn:AuthorityRequirement')) {
      containment = 'authorityRequirement';
    } else if (is(businessObject, 'dmn:KnowledgeRequirement')) {
      containment = 'knowledgeRequirement';
    }
    let children;
    if (businessObject.$parent) {
      // remove from old parent
      children = businessObject.$parent.get(containment);
      collectionRemove(children, businessObject);
    }
    if (parent) {
      // add to new parent
      children = parent.get(containment);
      if (children) {
        children.push(businessObject);
        businessObject.$parent = parent;
      }
    }
  }

  // remove parent
  if (!parent) {
    businessObject.$parent = null;
  }
};
DrdUpdater.prototype.updateDiParent = function (di, parentDi) {
  if (di.$parent === parentDi) {
    return;
  }
  if (isAny(di, ['dmndi:DMNEdge', 'dmndi:DMNShape'])) {
    var diagram = parentDi || di;
    while (!is(diagram, 'dmndi:DMNDiagram')) {
      diagram = diagram.$parent;
    }
    var diagramElements = diagram.get('diagramElements');
    if (parentDi) {
      di.$parent = diagram;
      collectionAdd(diagramElements, di);
    } else {
      di.$parent = null;
      collectionRemove(diagramElements, di);
    }
  } else {
    throw new Error('unsupported');
  }
};
//# sourceMappingURL=DrdUpdater.js.map