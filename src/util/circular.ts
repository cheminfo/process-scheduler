import { IProcessOptions } from '..';

// nodes array of objects with an id and a deps array
export default function circular(nodes: Map<string, IProcessOptions>) {
  for (const node of nodes.values()) {
    if (oneHasCircular(node, nodes, [])) {
      return true;
    }
  }
  return false;
}

function oneHasCircular(
  node: IProcessOptions,
  nodes: Map<string, IProcessOptions>,
  visitedNodes: string[]
) {
  if (!node) {
    return false;
  }
  if (visitedNodes.indexOf(node.id) !== -1) {
    return true;
  }
  visitedNodes.push(node.id);
  const deps = node.deps;
  if (!deps || deps.length === 0) {
    return false;
  }

  for (const dep of deps) {
    const nextNode = nodes.get(dep);
    if (!nextNode) {
      // todo error?
      continue;
    }
    if (oneHasCircular(nextNode, nodes, visitedNodes)) {
      return true;
    }
  }
  return false;
}
