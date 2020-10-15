/// <reference path="../types/Data.d.ts" />
/// <reference path="../types/DataObj.d.ts" />
import { Environment } from "../environments/Environment";
import type { KDTree } from "../helpers/KDTree";
import uuid from "../utils/uuid";
import { Rule } from "../helpers/Rule";

declare interface RuleObj {
  rule: Function | Rule;
  args: Array<any>;
}

class Agent implements DataObj {
  /**
   * @member {Environment|null} environment
   * @member {RuleObj[]} rules
   * @member {RuleObj[]} queue
   * @member {Object} data
   */
  environment: Environment = null;
  rules: Array<RuleObj> = [];
  queue: Array<RuleObj> = [];
  data: Data = {};
  id: string = uuid();

  // This is used as a temporary store for data that
  // gets returned from rules. When enqueued rules are executed,
  // even if there aren't any enqueued rules, .set gets called
  // on any data that was placed here.
  __newData: Data = {};

  // When agent.get('key') is called, this pseudo-private member is set to 'key'.
  // Once it is retrieved, it is reset to null. If agent.get('key') is called before
  // this has been reset, that means that there is an infinite loop, and the call
  // will throw an error.
  __retrievingData: string = null;

  __subtree: KDTree = null;

  constructor(data: Data = {}) {
    this.set(data);
  }

  // Given a data object, a name, and a function value,
  // force the object to call the function whenever data[name] is referenced
  _setFunctionValue(data: Data, name: string, fn: Function): void {
    Object.defineProperty(data, name, {
      get: () => fn(this),
      configurable: true
    });
  }

  /**
   * Retrieve an arbitrary piece of data associated
   * with this agent by name.
   * @param {string} name
   */
  get(name: string): any {
    // return null if it doesn't exist
    if (!this.data.hasOwnProperty(name)) return null;
    // avoid infinite loops and give the user a hint if one is encountered
    if (this.__retrievingData === name) {
      throw new Error(
        `A reference to an agent's \`${name}\` resulted in a recursive call to get that same data.\n\nThis results in an infinite loop, since the agent will keep requesting that data, which requests itself, and so on forever. You should probably try to restructure your data function so this doesn't happen!`
      );
    }
    this.__retrievingData = name;
    const data = this.data[name];

    // Once the data has been retrieved, reset the pseudo-private member
    this.__retrievingData = null;
    return data;
  }

  /**
   * Retrieve all the data associated with this agent
   * (useful for destructuring properties).
   */
  getData(): Data {
    return this.data;
  }

  /**
   * Set a piece of data associated with this agent.
   * Name should be a string while value can be any valid type.
   * Alternatively, the first parameter can be an object, which merges
   * the current data with the new data (adding new values and overwriting existing).
   * Ex. agent.set('x', 5); agent.set('color', 'red');
   * @param {string|Data} name
   * @param {*} value
   */
  set(name: string | Data, value?: any): void {
    // helper function to set key-value pair depending on whether value
    // is a function (callable) or not
    const setKeyValue = (key: string, value: any) => {
      if (typeof value === "function") {
        this._setFunctionValue(this.data, key, value);
      } else {
        this.data[key] = value;
        if (this.environment && this.environment.opts.torus) {
          const { width, height } = this.environment;
          if (key === "x" && value > width) this.data[key] -= width;
          if (key === "x" && value < 0) this.data[key] += width;
          if (key === "y" && value > height) this.data[key] -= height;
          if (key === "y" && value < 0) this.data[key] += height;
        }

        if (this.environment && this.environment.helpers.kdtree) {
          let subtree = this.__subtree;
          let bbox = subtree.bbox;
          // if the agent is no longer contained within its
          // subtree's bounding box, then
          // traverse the tree and mark the highest level
          // tree that will need to rebalance, starting with the parent
          // of the agent's current subtree
          while (!bbox.contains(this)) {
            if (subtree === this.environment.helpers.kdtree) break;
            subtree = subtree.parent;
            bbox = subtree.bbox;
          }
          subtree.needsUpdating = true;
        }
      }
    };

    // if just receiving a single key-value pair, simply set it
    if (typeof name === "string") {
      setKeyValue(name, value);
      // if receiving an object of key-value pairs (i.e. data object),
      // loop over keys and call setKeyValue for each
    } else {
      Object.keys(name).forEach(key => {
        const value = name[key];
        setKeyValue(key, value);
      });
    }
  }

  /**
   * Increment a numeric (assume integer) piece of data
   * associated with this agent. If `n` is included, increments by
   * `n`. If the value has not yet been set, initializes it to 1.
   * @param {string} name
   * @param {number} n
   */
  increment(name: string, n: number = 1): void {
    if (!this.get(name)) this.set(name, 0);
    this.set(name, this.get(name) + n);
  }

  /**
   * Decrement a numeric (assume integer) piece of data
   * associated with this agent. If `n` is included, decrements by
   * `n`. If the value has not yet been set,
   * initializes it to -1.
   * @param {string} name
   */
  decrement(name: string, n: number = 1): void {
    this.increment(name, -n);
  }

  /**
   * Add a rule to be executed during the agent's
   * environment's tick cycle. When executed, the
   * @param {Function | Rule} rule
   */
  addRule(rule: Function | Rule, ...args: Array<any>): void {
    this.rules.push({
      args,
      rule
    });
  }

  /**
   * Enqueue a function to be executed at the end of
   * the agent's environment's tick cycle (for example,
   * if agents in an environment should perform their
   * calculations and updates separately). Additional/external
   * data passed in as arguments to the enqueued function will
   * be remembered and passed through when the function is executed.
   *
   * The `queue` array is cleared at the very end of
   * the environment's tick cycle.
   * @param {Function} enqueuedRule
   */
  enqueue(rule: Function, ...args: Array<any>): void {
    this.queue.push({
      args,
      rule
    });
  }

  /**
   * From a RuleObj, execute a single rule (function or structured Rule).
   * @param {RuleObj} ruleObj
   */
  executeRule(ruleObj: RuleObj): Data {
    const { rule, args } = ruleObj;
    if (rule instanceof Rule) {
      rule.call(this);
      return {};
    } else {
      const data = rule(this, ...args);
      return data || {};
    }
  }

  /**
   * Execute all rules.
   */
  executeRules() {
    this.rules.forEach(ruleObj => {
      Object.assign(this.__newData, this.executeRule(ruleObj));
    });
  }

  /**
   * Execute all enqueued rules.
   */
  executeEnqueuedRules() {
    // if new data from the rules
    // exists, set it
    this.set(this.__newData);
    this.__newData = {};

    // run through the queue
    while (this.queue.length > 0) {
      const ruleObj = this.queue.shift();
      const data = this.executeRule(ruleObj);
      if (data) this.set(data);
    }
  }
}

export { Agent };
