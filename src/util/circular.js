'use strict';

// nodes array of objects with an id and a deps array
module.exports = function (nodes) {
  var keys = nodes.keys();
  for (let key of keys) {
    let node = nodes.get(key);
    if (oneHasCircular(node, nodes, [])) return true;
  }
  return false;
};

function oneHasCircular(node, nodes, visitedNodes) {
  if (!node) {
    return false;
  }
  if (visitedNodes.indexOf(node.id) !== -1) {
    return true;
  }
  visitedNodes.push(node.id);
  var deps = node.deps;
  if (!deps || deps.length === 0) return false;

  for (let i = 0; i < deps.length; i++) {
    var nextNode = nodes.get(deps[i]);
    var hasCircular = oneHasCircular(nextNode, nodes, visitedNodes);
    if (hasCircular) {
      return true;
    }
  }
  return false;
}
