export default function DivideDecisionServiceHandler(modeling, elementFactory) {
  this._modeling = modeling;
  this._elementFactory = elementFactory;
}
DivideDecisionServiceHandler.$inject = ['modeling', 'elementFactory'];
DivideDecisionServiceHandler.prototype.preExecute = function (context) {
  const {
    shape
  } = context;
  this._resizeDecisionService(shape);
  shape.businessObject.isSplit = !shape.businessObject.isSplit;
};
DivideDecisionServiceHandler.prototype._resizeDecisionService = function (shape) {
  let newHeight, newBounds;
  if (shape.businessObject.isSplit) {
    newHeight = shape.height / 2;
    newBounds = {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: newHeight
    };
  } else {
    newHeight = shape.height * 2;
    newBounds = {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: newHeight
    };
  }
  this._modeling.resizeShape(shape, newBounds);
};
//# sourceMappingURL=DivideDecisionServiceHandler.js.map