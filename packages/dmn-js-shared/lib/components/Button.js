import { createVNode } from "inferno";
import { Component } from 'inferno';
export default class Button extends Component {
  constructor(props, context) {
    super(props, context);
  }
  onClick = event => {
    const {
      onClick
    } = this.props;
    if (typeof onClick !== 'function') {
      return;
    }
    onClick(event);
  };
  onMouseDown = event => {
    const {
      onMouseDown
    } = this.props;
    if (typeof onMouseDown !== 'function') {
      return;
    }
    onMouseDown(event);
  };
  onMouseUp = event => {
    const {
      onMouseUp
    } = this.props;
    if (typeof onMouseUp !== 'function') {
      return;
    }
    onMouseUp(event);
  };
  render() {
    const {
      className
    } = this.props;
    return createVNode(1, "button", [className || '', 'button'].join(' '), this.props.children, 0, {
      "onClick": this.onClick,
      "onMouseDown": this.onMouseDown,
      "onMouseUp": this.onMouseUp
    });
  }
}
//# sourceMappingURL=Button.js.map