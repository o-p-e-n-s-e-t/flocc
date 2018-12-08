// @flow
import { Environment } from '../environments/Environment';

type Options = {
  width: number;
  height: number;
  trace: boolean;
};

class CanvasRenderer {

  /** @member Environment */
  environment: Environment;
  opts: Options;
  /** @member HTMLCanvasElement */
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor(environment: Environment, opts: Options = { width: 500, height: 500, trace: false }) {

    this.environment = environment;
    // $FlowFixMe
    environment.renderer = this;

    this.opts = opts;

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    this.width = opts.width;
    this.height = opts.height;

    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  mount(el: string | HTMLElement) {
    const container = (typeof el === 'string') ? document.querySelector(el) : el;
    if (container) container.appendChild(this.canvas);
  }

  render() {
    const { context, environment, width, height } = this;

    // if "trace" is truthy, don't clear the canvas with every frame
    // to trace the paths of agents
    if (!this.opts.trace) context.clearRect(0, 0, width, height);

    environment.getAgents().forEach(agent => {
      
      // $FlowFixMe -- TODO: not sure why .getData() is reading incorrectly here...?
      const { x, y, vx, vy, color, shape, size } = agent.getData();

      context.beginPath();
      context.moveTo(x, y);

      context.fillStyle = color || 'black';

      if (shape === 'arrow' && vx !== null && vy !== null) {

        const norm = Math.sqrt(vx ** 2 + vy ** 2);
        const _vx = 6 * (vx / norm);
        const _vy = 6 * (vy / norm);

        context.beginPath();

        context.moveTo(x + 1.5 * _vx, y + 1.5 * _vy);
        context.lineTo(x + _vy / 2, y - _vx / 2);
        context.lineTo(x - _vy / 2, y + _vx / 2);

      } else {

        context.arc(
          x, 
          y, 
          size || 1,
          0, 
          2 * Math.PI
        );
      }
      
      context.fill();
    });
  }
};

export { CanvasRenderer };