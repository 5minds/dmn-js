import { assign } from 'min-dash';
import inherits from 'inherits-browser';
import { remove as collectionRemove, add as collectionAdd } from 'diagram-js/lib/util/Collections';
import { asTRBL } from 'diagram-js/lib/layout/LayoutUtil';
import { computeChildrenBBox, getMinResizeBounds } from 'diagram-js/lib/features/resize/ResizeUtil';
import { is, isAny } from 'dmn-js-shared/lib/util/ModelUtil';
import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';
const DEFAULT_MIN_WIDTH = 10;
const DEFAULT_CHILD_BOX_PADDING = 20;

/**
 * Update DMN 1.3 information.
 */
export default function DrdUpdater(connectionDocking, definitionPropertiesView, drdFactory, drdRules, injector, eventBus, modeling, elementRegistry) {
  injector.invoke(CommandInterceptor, this);
  this._definitionPropertiesView = definitionPropertiesView;
  this._drdFactory = drdFactory;
  this._drdRules = drdRules;
  this._eventBus = eventBus;
  this._modeling = modeling;
  this._elementRegistry = elementRegistry;
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
    self.updateBounds(shape, context);
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
  eventBus.on('resize.start', function (event) {
    const context = event.context,
      shape = context.shape,
      businessObject = shape.businessObject;
    if (is(businessObject, 'dmn:DecisionService')) {
      const isSplit = businessObject.isSplit;
      if (!isSplit) {
        return;
      }
      const decisions = businessObject.$parent.get('drgElement').filter(d => is(d, 'dmn:Decision'));
      const encapsulated = decisions.filter(d => businessObject.get('encapsulatedDecision').some(e => e.href === '#' + d.id));
      const encapsulatedWithoutOutput = encapsulated.filter(e => !businessObject.get('outputDecision').some(o => o.href === '#' + e.id));
      const output = decisions.filter(d => businessObject.get('outputDecision').some(o => o.href === '#' + d.id));
      const isSouth = context.direction.includes('s');
      const isNorth = context.direction.includes('n');
      const minBounds = self.computeMinResizeBox(context);
      if (isSouth) {
        const highestOutputDecisionY = Math.max(...output.map(d => d.di.bounds.y + d.di.bounds.height));
        minBounds.height = Math.max(minBounds.height, (highestOutputDecisionY - shape.y) * 2 + DEFAULT_CHILD_BOX_PADDING);
      }
      if (isNorth) {
        const lowestEncapsulatedDecisionY = Math.min(...encapsulatedWithoutOutput.map(d => d.di.bounds.y));
        minBounds.height = Math.max(minBounds.height, (shape.y + shape.height - lowestEncapsulatedDecisionY) * 2 + DEFAULT_CHILD_BOX_PADDING);
        minBounds.y = Math.min(minBounds.y, lowestEncapsulatedDecisionY - DEFAULT_CHILD_BOX_PADDING - minBounds.height / 2);
      }
      context.resizeConstraints = {
        min: asTRBL(minBounds)
      };
    }
  });
  eventBus.on('resize.end', function (event) {
    const context = event.context,
      shape = context.shape,
      delta = context.delta,
      businessObject = shape.businessObject;
    if (is(businessObject, 'dmn:DecisionService')) {
      const isSplit = businessObject.isSplit;
      if (!isSplit) {
        return;
      }
      const decisions = businessObject.$parent.get('drgElement').filter(d => is(d, 'dmn:Decision'));
      const encapsulated = decisions.filter(d => businessObject.get('encapsulatedDecision').some(e => e.href === '#' + d.id));
      const output = decisions.filter(d => businessObject.get('outputDecision').some(o => o.href === '#' + d.id));
      const encapsulatedWithoutOutput = encapsulated.filter(e => !output.some(o => o.id === e.id));
      const moveDecision = decision => {
        const shape = self._elementRegistry.get(decision.id);
        const currentPosition = {
          x: shape.x,
          y: shape.y
        };
        const targetY = shape.y + delta.y / 2;
        const targetPosition = {
          x: shape.x,
          y: targetY
        };
        self._modeling.moveShape(shape, {
          x: targetPosition.x - currentPosition.x,
          y: targetPosition.y - currentPosition.y
        });
        const bounds = shape.businessObject.di.bounds;
        assign(bounds, {
          x: shape.x,
          y: targetY,
          width: shape.width,
          height: shape.height
        });
      };
      const isSouth = context.direction.includes('s');
      const isNorth = context.direction.includes('n');
      const strechtingToTop = isNorth && delta.y < 0;
      const strechtingToBottom = isSouth && delta.y > 0;
      if (strechtingToBottom) {
        encapsulatedWithoutOutput.forEach(moveDecision);
      }
      if (strechtingToTop) {
        output.forEach(moveDecision);
      }
    }
  });
}
inherits(DrdUpdater, CommandInterceptor);
DrdUpdater.$inject = ['connectionDocking', 'definitionPropertiesView', 'drdFactory', 'drdRules', 'injector', 'eventBus', 'modeling', 'elementRegistry'];
DrdUpdater.prototype.updateBounds = function (shape, context) {
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
  this.updateSemanticParent(businessObject, parentBo, element, parent);
  this.updateDiParent(businessObject.di, parentBo && parentBo.di);
};
DrdUpdater.prototype.updateSemanticParent = function (businessObject, parent, element, parentElement) {
  if (businessObject.$parent === parent) {
    return;
  }
  const decisionFromDefinitionsToDecisionService = is(businessObject, 'dmn:Decision') && is(parent, 'dmn:DecisionService') && is(businessObject.$parent, 'dmn:Definitions');
  const decisionFromDecisionServiceToDefinitions = is(businessObject, 'dmn:Decision') && is(parent, 'dmn:Definitions') && is(businessObject.$parent, 'dmn:DecisionService');
  const creatingDecisionInDecisionService = is(businessObject, 'dmn:Decision') && is(parent, 'dmn:DecisionService') && !businessObject.$parent;
  const deletingDecisionFromDecisionService = is(businessObject, 'dmn:Decision') && parent === null && is(businessObject.$parent, 'dmn:DecisionService');
  const movingDecisionFromDecisionServiceToAnotherDecisionService = is(businessObject, 'dmn:Decision') && is(parent, 'dmn:DecisionService') && is(businessObject.$parent, 'dmn:DecisionService') && businessObject.$parent !== parent;
  if (decisionFromDefinitionsToDecisionService) {
    this.moveDecisionFromDefinitionsToDecisionService(businessObject, parent, element, parentElement);
  } else if (decisionFromDecisionServiceToDefinitions) {
    this.moveDecisionFromDecisionServiceToDefinitions(businessObject, businessObject.$parent, parent);
  } else if (creatingDecisionInDecisionService) {
    this.createDecisionInDecisionService(businessObject, parent, parent.$parent, element, parentElement);
  } else if (deletingDecisionFromDecisionService) {
    this.deleteDecisionFromDecisionService(businessObject, businessObject.$parent, businessObject.$parent.$parent);
  } else if (movingDecisionFromDecisionServiceToAnotherDecisionService) {
    this.moveDecisionFromDecisionServiceToAnotherDecisionService(businessObject, businessObject.$parent, parent, element, parentElement);
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
DrdUpdater.prototype.moveDecisionFromDefinitionsToDecisionService = function (decision, decisionService, element, parentElement) {
  this._createEncapsulatedDecision(decision, decisionService);
  this._eventuallyCreateOutputDecision(decision, decisionService, element, parentElement);
  decision.$parent = decisionService;
};
DrdUpdater.prototype.moveDecisionFromDecisionServiceToDefinitions = function (decision, decisionService, definitions) {
  this._removeOutputDecision(decision, decisionService);
  this._removeEncapsulatedDecision(decision, decisionService);
  decision.$parent = definitions;
};
DrdUpdater.prototype.createDecisionInDecisionService = function (decision, decisionService, definitions, element, parentElement) {
  this._createEncapsulatedDecision(decision, decisionService);
  this._eventuallyCreateOutputDecision(decision, decisionService, element, parentElement);
  decision.$parent = decisionService;

  // add to definitions as drgElement
  const drgElement = definitions.get('drgElement');
  drgElement.push(decision);
};
DrdUpdater.prototype.deleteDecisionFromDecisionService = function (decision, decisionService, definitions) {
  this._removeOutputDecision(decision, decisionService);
  this._removeEncapsulatedDecision(decision, decisionService);

  // remove from definitions as drgElement
  const drgElement = definitions.get('drgElement');
  collectionRemove(drgElement, decision);
};
DrdUpdater.prototype.moveDecisionFromDecisionServiceToAnotherDecisionService = function (decision, oldDecisionService, newDecisionService, element, parentElement) {
  this._removeOutputDecision(decision, oldDecisionService);
  this._removeEncapsulatedDecision(decision, oldDecisionService);
  this._createEncapsulatedDecision(decision, newDecisionService);
  this._eventuallyCreateOutputDecision(decision, newDecisionService, element, parentElement);
  decision.$parent = newDecisionService;
};
DrdUpdater.prototype._eventuallyCreateOutputDecision = function (decision, decisionService, element, parentElement) {
  const isSplit = decisionService.isSplit;
  if (!isSplit) {
    this._createOutputDecision(decision, decisionService);
  } else {
    const isOutputDecision = element.y < parentElement.y + parentElement.height / 2;
    if (isOutputDecision) {
      this._createOutputDecision(decision, decisionService);
    }
  }
};
DrdUpdater.prototype._createOutputDecision = function (decision, decisionService) {
  const outputDecisions = decisionService.get('outputDecision');
  const outputDecision = this._drdFactory.create('dmn:DMNElementReference', {
    href: '#' + decision.id
  });
  outputDecisions.push(outputDecision);
  outputDecision.$parent = decisionService;
};
DrdUpdater.prototype._createEncapsulatedDecision = function (decision, decisionService) {
  const encapsulatedDecisions = decisionService.get('encapsulatedDecision');
  const encapsulatedDecision = this._drdFactory.create('dmn:DMNElementReference', {
    href: '#' + decision.id
  });
  encapsulatedDecisions.push(encapsulatedDecision);
  encapsulatedDecision.$parent = decisionService;
};
DrdUpdater.prototype._removeOutputDecision = function (decision, decisionService) {
  const outputDecisions = decisionService.get('outputDecision');
  const deleteIndexOutput = outputDecisions.findIndex(d => d.href === '#' + decision.id);
  if (deleteIndexOutput < 0) {
    return;
  }
  outputDecisions.splice(deleteIndexOutput, 1);
};
DrdUpdater.prototype._removeEncapsulatedDecision = function (decision, decisionService) {
  const encapsulatedDecisions = decisionService.get('encapsulatedDecision');
  const deleteIndexEncapsulated = encapsulatedDecisions.findIndex(d => d.href === '#' + decision.id);
  if (deleteIndexEncapsulated < 0) {
    return;
  }
  encapsulatedDecisions.splice(deleteIndexEncapsulated, 1);
};
DrdUpdater.prototype.computeMinResizeBox = function (context) {
  var shape = context.shape,
    direction = context.direction,
    minDimensions,
    childrenBounds;
  minDimensions = context.minDimensions || {
    width: DEFAULT_MIN_WIDTH,
    height: DEFAULT_MIN_WIDTH
  };

  // get children bounds
  childrenBounds = computeChildrenBBox(shape, context.childrenBoxPadding);

  // get correct minimum bounds from given resize direction
  // basically ensures that the minBounds is max(childrenBounds, minDimensions)
  return getMinResizeBounds(direction, shape, minDimensions, childrenBounds);
};
//# sourceMappingURL=DrdUpdater.js.map