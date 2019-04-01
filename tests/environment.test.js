const { Agent, Environment } = require("../dist/flocc");

const environment = new Environment();

it("Has zero agents upon instantiating.", () => {
  expect(environment.getAgents()).toHaveLength(0);
});

it("Has zero width and height upon instantiating.", () => {
  expect(environment.width).toEqual(0);
  expect(environment.height).toEqual(0);
});

it("Correctly gets and sets data.", () => {
  environment.set("x", 12);
  environment.set("y", 23);

  expect(environment.get("x")).toEqual(12);
  expect(environment.get("y")).toEqual(23);
  expect(environment.getData()).toEqual({ x: 12, y: 23 });

  expect(environment.get("z")).toBeNull();

  const { x } = environment.getData();
  expect(x).toBe(12);
});

it("Correctly adds agents.", () => {
  const a0 = new Agent();
  environment.addAgent(a0);
  expect(environment.getAgents()).toHaveLength(1);
  expect(a0.environment).toEqual(environment);

  // does nothing if attempting to add non-agent
  environment.addAgent(null);
  expect(environment.getAgents()).toHaveLength(1);

  for (let i = 0; i < 5; i++) environment.addAgent(new Agent());
  expect(environment.getAgents()).toHaveLength(6);
});

it("Correctly removes agents.", () => {
  const a0 = environment.getAgents()[0];
  environment.removeAgent(a0);
  expect(environment.getAgents()).toHaveLength(5);
  expect(a0.environment).toBe(null);

  environment.clear();
  expect(environment.getAgents()).toHaveLength(0);

  // removing an agent not in the environment does nothing
  environment.removeAgent(a0);
  expect(environment.getAgents()).toHaveLength(0);
});

it("Correctly retrieves agents by ID.", () => {
  const a0 = new Agent();
  const { id } = a0;
  environment.addAgent(a0);
  expect(environment.getAgentById(id)).toBe(a0);
  environment.clear();
});

it("Correctly removes agents by ID.", () => {
  const a0 = new Agent();
  const { id } = a0;
  environment.addAgent(a0);
  expect(environment.getAgents()).toHaveLength(1);
  environment.removeAgentById(id);
  expect(environment.getAgents()).toHaveLength(0);
});