export default function DivideDecisionServiceHandler(modeling, elementFactory) {
  this._modeling = modeling;
  this._elementFactory = elementFactory;
}

DivideDecisionServiceHandler.$inject = [ 'modeling', 'elementFactory' ];

DivideDecisionServiceHandler.prototype.preExecute = function(context) {
  const { shape } = context;
  const bo = getSemantic(shape);
  const outputDecisions = bo.get('outputDecision');
  const encapsulatedDecisions = bo.get('encapsulatedDecision');
  const isSplitWithEncapsulated = bo.isSplit &&
    outputDecisions.length < encapsulatedDecisions.length;

  if (isSplitWithEncapsulated) {
    this._fillOutputDecisions(outputDecisions, encapsulatedDecisions);
    this._resizeShapeToCurrent(shape);
  } else {
    this._resizeDecisionService(shape, bo);
  }

  toggleIsSplit(bo);
};

DivideDecisionServiceHandler.prototype._fillOutputDecisions = function(
    outputDecisions, encapsulatedDecisions
) {
  encapsulatedDecisions.forEach((encapsulatedDecision) => {
    if (!outputDecisions.some(outputDecision =>
      outputDecision.href === encapsulatedDecision.href
    )) {
      outputDecisions.push(encapsulatedDecision);
    }
  });
};

DivideDecisionServiceHandler.prototype._resizeShapeToCurrent = function(shape) {
  this._modeling.resizeShape(shape, {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height
  });
};

DivideDecisionServiceHandler.prototype._resizeDecisionService = function(shape, bo) {
  const newHeight = bo.isSplit ? shape.height / 2 : shape.height * 2;
  const newBounds = {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: newHeight
  };

  this._modeling.resizeShape(shape, newBounds);
};

function toggleIsSplit(bo) {
  bo.isSplit = !bo.isSplit;
}

function getSemantic(shape) {
  return shape.businessObject;
}
