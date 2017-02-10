/* Configuration */
const room = '';
const team = '';

// État
let grid;
let direction;

// Joueurs
let players;
let me;
let them;

// Délai
let delay;
let lastTime;

function getGrid(grid, x, y) {
  if (y >= 0 && x >= 0 && y < grid.length && x < grid[y].length) {
    return grid[y][x];
  }

  return null;
}

function setGrid(grid, x, y, value) {
  if (y >= 0 && x >= 0 && y < grid.length && x < grid[y].length) {
    grid[y][x] = value;
  }
}

function start(config) {
  grid = Array(config.h).fill().map(() => Array(config.w).fill(0));

  // Joueurs
  players = config.players;

  players.forEach((player) => {
    player.id === config.me ? me = player : them = player;

    grid[player.y][player.x] = player.id;
  });

  // Obstacles
  config.obstacles.forEach((ob) => {
    for (let x = (ob.x + ob.w) - 1; x >= ob.x; x -= 1) {
      for (let y = (ob.y + ob.h) - 1; y >= ob.y; y -= 1) {
        setGrid(grid, x, y, -1);
      }
    }
  });
}

function floodFill(grid, initNode) {
  let q = [initNode];

  // Distance
  let dist = 0;
  const distGrid = Array(grid.length).fill().map(() => Array(grid[0].length));

  setGrid(distGrid, initNode.x, initNode.y, dist);

  while (q.length) {
    const tempQ = [];
    dist += 1;

    while (q.length) {
      const node = q.pop();

      const neighbors = [{ x: node.x, y: node.y - 1 },
                         { x: node.x - 1, y: node.y },
                         { x: node.x, y: node.y + 1 },
                         { x: node.x + 1, y: node.y }];

      for (let i = 0, l = neighbors.length; i < l; i += 1) {
        const n = neighbors[i];

        if (!getGrid(distGrid, n.x, n.y) && getGrid(grid, n.x, n.y) === 0) {
          distGrid[n.y][n.x] = dist;
          tempQ.push(n);
        }
      }
    }

    q = tempQ;
  }

  return distGrid;
}

function evalPos(grid, me, them) {
  let score = 0;

  // Grilles de distance
  const myGrid = floodFill(grid, { x: me.x, y: me.y });
  const theirGrid = floodFill(grid, { x: them.x, y: them.y });

  for (let y = 0, h = grid.length; y < h; y += 1) {
    for (let x = 0, w = grid[y].length; x < w; x += 1) {
      if (!theirGrid[y][x] && myGrid[y][x]) {
        score += 1;
        continue;
      }

      if (!myGrid[y][x] && theirGrid[y][x]) {
        score -= 1;
        continue;
      }

      (theirGrid[y][x] - myGrid[y][x]) >= 0 ? score += 1 : score -= 1;
    }
  }

  return score;
}

function setPlayer(player, direction) {
  player.direction = direction;

  switch (player.direction) {
    case 'u': player.y -= 1; break;
    case 'l': player.x -= 1; break;
    case 'd': player.y += 1; break;
    case 'r': player.x += 1; break;
  }
}

function mDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

const genMoves = function genMoves(cGrid, me, them, firstMove) {
  const moves = ['u', 'l', 'd', 'r'];

  if (firstMove) {
    moves.splice(0, 0, moves.splice(moves.indexOf(firstMove), 1)[0]);
  }

  const computedMoves = moves.map((move) => {
    const cMe = Object.assign({}, me);
    setPlayer(cMe, move);

    return cMe;
  });

  const legalMoves = computedMoves.filter(move =>
    // getGrid(grid, move.x, move.y) === 0 &&
    getGrid(cGrid, move.x, move.y) === 0
  );

  const sortedMoves = legalMoves.sort((m1, m2) =>
    mDistance({ x: m1.x, y: m1.y }, { x: them.x, y: them.y }) -
    mDistance({ x: m2.x, y: m2.y }, { x: them.x, y: them.y })
  );

  return sortedMoves;
};

function calcDelay(thisTime) {
  if (lastTime) {
    const deltaTime = thisTime - lastTime;

    if (deltaTime > 0) {
      delay = deltaTime;
    }
  }

  lastTime = thisTime;
}

function alphaBeta(grid, me, them, alpha, beta, depth, firstMove) {
  const legalMoves = genMoves(grid, me, them, firstMove);

  if (depth === 0 || legalMoves.length === 0) {
    alpha = evalPos(grid, me, them);
    return [alpha, undefined];
  }

  let bestMove = legalMoves[0];

  for (const move of legalMoves) {
    setGrid(grid, move.x, move.y, move.id);
    const score = -alphaBeta(grid, them, move, -beta, -alpha, depth - 1, bestMove)[0];
    setGrid(grid, move.x, move.y, 0);

    if (score > alpha) {
      alpha = score;
      bestMove = move.direction;

      if (alpha >= beta) {
        return [alpha, bestMove];
      }
    }
  }

  return [alpha, bestMove];
}

function next(prevMoves) {
  const startTime = process.hrtime();

  if (prevMoves.length) {
    // Calcul du délai entre chaque tour
    if (!delay) {
      calcDelay(startTime[1]);
    }

    // Mise à jour (joueurs + grille)
    players.forEach((player) => {
      const prevMove = prevMoves.find(move => move.id === player.id);

      setPlayer(player, prevMove.direction);
      setGrid(grid, player.x, player.y, player.id);
    });
  }

  // Prise de décision
  if (!delay) {
    const cGrid = grid.map(arr => arr.slice());
    direction = alphaBeta(cGrid, me, them, -Infinity, Infinity, 2, direction)[1];
  } else {
    for (let depth = 1; process.hrtime(startTime)[1] < (delay * (50 / 100)); depth += 1) {
      const cGrid = grid.map(arr => arr.slice());
      direction = alphaBeta(cGrid, me, them, -Infinity, Infinity, depth, direction)[1];
    }
  }

  // console.log(`Time for alphaBeta: ${Math.round(process.hrtime(startTime)[1] * 1e-6)}ms. Delay: ${delay * 1e-6}ms.`);

  return direction;
}

function end(winnerID) {
  if (winnerID === me.id) {
    console.log('Match gagné');
  } else if (winnerID === them.id) {
    console.log('Match perdu');
  } else {
    console.log('Match nul');
  }
}

// Ne pas modifier
module.exports = { room, team, start, next, end };
