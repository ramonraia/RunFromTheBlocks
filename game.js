// Firebase settings. For compatibility only, not used in this game.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ROWS = 30; // Increased to 30
const COLS = 15; // Increased to 15
const BLOCK_SIZE = 20; // Decreased for wider grid
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// DOM elements
const mainContainer = document.querySelector('.main-container');
const menuScreen = document.getElementById('menuScreen');
const pauseScreen = document.getElementById('pauseScreen');
const gameMessageElement = document.getElementById('gameMessage');
const countdownMessageElement = document.getElementById('countdownMessage');
const countdownTextElement = document.getElementById('countdownText');
const polyominoLevelMessageElement = document.getElementById('polyominoLevelMessage');
const polyominoLevelTextElement = document.getElementById('polyominoLevelText');
const playerScoreDisplay = document.getElementById('playerScoreDisplay');
const linesRemainingDisplay = document.getElementById('linesRemainingDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const runnerStatusContainer = document.getElementById('runnerStatusContainer');
const specialActionProgress = document.getElementById('specialActionProgress');
const specialActionContainer = document.getElementById('specialActionContainer');

// Menu inputs
const runnerCountSelect = document.getElementById('runnerCountSelect');
const linesInput = document.getElementById('linesInput');
const maxShotsInput = document.getElementById('maxShotsInput');
const rechargeTimeInput = document.getElementById('rechargeTimeInput');
const speedSelect = document.getElementById('speedSelect');
const timeInput = document.getElementById('timeInput');
const polyominoStartSelect = document.getElementById('polyominoStartSelect');
const polyominoEndSelect = document.getElementById('polyominoEndSelect');
const polyominoTimeInput = document = document.getElementById('polyominoTimeInput');
const specialActionCheck = document.getElementById('specialActionCheck');
const specialActionTimeInput = document.getElementById('specialActionTimeInput');
const clearLinesCheck = document.getElementById('clearLinesCheck');

// Menu buttons
const startGameButton = document.getElementById('startGameButton');
const resumeButton = document.getElementById('resumeButton');
const backToMenuButton = document.getElementById('backToMenuButton');

// Game state variables
let gameGrid = createGrid();
let fallingBlocks = []; // Agora um array para múltiplos blocos
let currentBlock; // O bloco controlado pelo jogador, agora será um dos fallingBlocks
let characters = [];
let projectiles = [];
let gameOver = true;
let isPaused = false;
let score = 0;
let linesRemaining = 5;
let dropInterval = 500;
let speedIntervalId;
let gameTime = 300;
let countdownIntervalId;
let maxShotsPerRunner = 7;
let shotRechargeTime = 30000;
let clearLinesEnabled = true;

// State variables for fluid and simultaneous controls
let keysPressed = {};
let blockMoveCounter = 0;
const blockMoveInterval = 100; // Intervalo de movimento do bloco
let runnerMoveCounter = 0;
const runnerMoveInterval = 50; // Intervalo de movimento dos corredores
let lastRechargeTime = 0;

// State variables for menu navigation
let menuOptions = [];
let focusedMenuElementIndex = 0;
let pauseMenuOptions = [];
let focusedPauseMenuElementIndex = 0;

// New state variables for polyomino progression
let currentPolyominoLevel = 5;
let startingPolyominoLevel = 5;
let endingPolyominoLevel = 5;
let polyominoProgressionTime = 90; // 1.5 minutes in seconds
let polyominoLevelUpIntervalId;

// New state variables for the Q action
let isSpecialActionEnabled = false;
let specialActionCooldownTime = 60000; // 60 seconds
let lastSpecialActionTime = 0;
let isSpecialActionReady = false;
let specialActionActive = false;
let specialActionDropInterval = 50;
let specialActionDropCounter = 0;
let compactedGrid = [];

// Updated colors array
const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6',
    '#9c27b0', '#f472b6', '#fcd34d', '#be185d', '#14b8a6', '#22d3ee', '#84cc16',
    '#facc15', '#06b6d4', '#f43f5e', '#d97706'
];

// Corrected and expanded shapes array to include polyominoes from level 1 to 7
const shapes = [
    // Level 1: Monomino (1 block)
    [
        [[1]]
    ],
    // Level 2: Dominoes (2 blocks)
    [
        [[1, 1]]
    ],
    // Level 3: Trominoes (3 blocks)
    [
        [[1, 1, 1]],
        [[1, 0], [1, 1]]
    ],
    // Level 4: Tetrominoes (4 blocks)
    [
        [[1, 1, 1, 1]],
        [[1, 1], [1, 1]],
        [[1, 1, 0], [0, 1, 1]],
        [[0, 1, 1], [1, 1, 0]],
        [[1, 1, 1], [0, 1, 0]],
        [[1, 0, 0], [1, 1, 1]],
        [[0, 0, 1], [1, 1, 1]]
    ],
    // Level 5: Pentominoes (5 blocks)
    [
        [[0, 1, 1], [1, 1, 0], [0, 1, 0]], // F
        [[1, 1, 1, 1, 1]], // I
        [[1, 0, 0, 0], [1, 1, 1, 1]], // L
        [[1, 1, 0], [1, 1, 0], [1, 0, 0]], // P
        [[0, 1, 1, 0], [1, 1, 0, 0], [1, 0, 0, 0]], // N
        [[0, 1, 0], [1, 1, 1], [0, 1, 0]], // T
        [[1, 0, 1], [1, 1, 1]], // U
        [[1, 0, 0], [1, 0, 0], [1, 1, 1]], // V
        [[1, 0, 0], [1, 1, 0], [0, 1, 1]], // W
        [[0, 1, 0], [1, 1, 1], [0, 1, 0]], // X
        [[0, 1, 0, 0], [1, 1, 1, 1]], // Y
        [[1, 1, 0], [0, 1, 0], [0, 1, 1]] // Z
    ],
    // Level 6: Hexominoes (6 blocks) - a representative subset
    [
        [[0, 1, 1, 0], [1, 1, 1, 1]],
        [[0, 1, 0], [1, 1, 1], [0, 1, 0], [0, 1, 0]],
        [[0, 1, 1], [1, 1, 0], [1, 0, 0], [1, 0, 0]],
        [[1, 1, 1, 1], [1, 1, 0, 0]],
        [[1, 1, 1], [1, 0, 0], [1, 1, 0]]
    ],
    // Level 7: Heptominoes (7 blocks) - a representative subset
    [
        [[1, 1, 1, 1, 1, 1, 1]], // I
        [[1, 0, 0, 0], [1, 1, 1, 1], [1, 0, 0, 0]], // L
        [[1, 0, 0, 0], [1, 0, 0, 0], [1, 1, 1, 1], [1, 0, 0, 0]],
        [[1, 1, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 1, 1]],
        [[1, 1, 1], [1, 0, 1], [1, 1, 1]], // H
        [[0, 1, 1], [1, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]],
        [[1, 1, 1], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]],
        [[1, 1, 1, 1, 0], [0, 0, 1, 0, 0], [0, 0, 1, 1, 0]],
        [[0, 0, 1, 0], [0, 1, 1, 1], [1, 1, 1, 0]], // S
        [[0, 1, 0], [1, 1, 1], [0, 1, 0], [0, 1, 0], [0, 1, 0]],
        [[1, 1, 1, 1], [1, 0, 0, 1], [1, 0, 0, 1]],
        [[0, 0, 1], [0, 0, 1], [1, 1, 1], [1, 0, 0], [1, 0, 0]],
        [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [0, 0, 1, 0]],
        [[1, 1, 1], [1, 1, 1], [1, 0, 0]],
        [[0, 0, 1, 1], [1, 1, 1, 0], [0, 1, 0, 0]]
    ]
];

function createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function newBlock(isControlled = true) {
    const levelShapes = shapes[currentPolyominoLevel - 1];
    const shapeIndex = Math.floor(Math.random() * levelShapes.length);
    const shape = JSON.parse(JSON.stringify(levelShapes[shapeIndex]));
    const colorIndex = (currentPolyominoLevel - 1 + shapeIndex) % colors.length;
    const color = colors[colorIndex];
    const newBlock = {
        shape: shape,
        color: color,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: -shape.length,
        isFalling: true,
        isControlled: isControlled, // Novo atributo para verificar se o bloco é controlável
        dropCounter: 0,
        dropInterval: dropInterval
    };

    if (isControlled) {
        fallingBlocks.push(newBlock);
        return newBlock;
    } else {
        // Bloco não controlado (para jogadores eliminados)
        fallingBlocks.push(newBlock);
        return newBlock;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (gameGrid[r][c] !== 0) {
                ctx.fillStyle = gameGrid[r][c];
                ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#2d3748';
                ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }

    fallingBlocks.forEach(block => {
        if (block && block.isFalling) {
            for (let r = 0; r < block.shape.length; r++) {
                for (let c = 0; c < block.shape[r].length; c++) {
                    if (block.shape[r][c] !== 0) {
                        ctx.fillStyle = block.color;
                        ctx.fillRect((block.x + c) * BLOCK_SIZE, (block.y + r) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.strokeStyle = '#2d3748';
                        ctx.strokeRect((block.x + c) * BLOCK_SIZE, (block.y + r) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    }
                }
            }
        }
    });

    characters.forEach(character => {
        if (!character.isEliminated) {
            ctx.fillStyle = character.color;
            ctx.fillRect(character.x, character.y, character.width, character.height);
        }
    });

    projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });
}

function checkBlockCollision(block, offsetX = 0, offsetY = 0) {
    // Check collision with the game grid
    for (let r = 0; r < block.shape.length; r++) {
        for (let c = 0; c < block.shape[r].length; c++) {
            if (block.shape[r][c] !== 0) {
                const newX = block.x + c + offsetX;
                const newY = block.y + r + offsetY;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && gameGrid[newY][newX] !== 0)) {
                    return true;
                }
            }
        }
    }

    // Check collision with other falling blocks
    for (const otherBlock of fallingBlocks) {
        if (otherBlock !== block && otherBlock.isFalling) {
            for (let r = 0; r < otherBlock.shape.length; r++) {
                for (let c = 0; c < otherBlock.shape[r].length; c++) {
                    if (otherBlock.shape[r][c] !== 0) {
                        for (let br = 0; br < block.shape.length; br++) {
                            for (let bc = 0; bc < block.shape[br].length; bc++) {
                                if (block.shape[br][bc] !== 0) {
                                    const blockPieceX = block.x + bc + offsetX;
                                    const blockPieceY = block.y + br + offsetY;
                                    const otherBlockPieceX = otherBlock.x + c;
                                    const otherBlockPieceY = otherBlock.y + r;
                                    if (blockPieceX === otherBlockPieceX && blockPieceY === otherBlockPieceY) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}

function checkLandingCollision(character) {
    if (character.isEliminated) return;

    character.isStanding = false;

    const nextY = character.y + character.velocityY;

    const charBottomRow = Math.floor((nextY + character.height) / BLOCK_SIZE);
    const charCol = character.col;
    if (charBottomRow < ROWS && charCol >= 0 && charCol < COLS && gameGrid[charBottomRow][charCol] !== 0) {
        character.y = charBottomRow * BLOCK_SIZE - character.height;
        character.isStanding = true;
        character.velocityY = 0;
    }

    fallingBlocks.forEach(block => {
        if (block && block.isFalling) {
            for (let r = 0; r < block.shape.length; r++) {
                for (let c = 0; c < block.shape[r].length; c++) {
                    if (block.shape[r][c] !== 0) {
                        const blockTopY = (block.y + r) * BLOCK_SIZE;
                        const blockLeftX = (block.x + c) * BLOCK_SIZE;
                        const blockRightX = blockLeftX + BLOCK_SIZE;

                        if (nextY + character.height >= blockTopY && nextY + character.height < blockTopY + character.velocityY + 1) {
                            if (character.x < blockRightX && character.x + character.width > blockLeftX) {
                                character.y = blockTopY - character.height;
                                character.isStanding = true;
                                character.velocityY = 0;
                            }
                        }
                    }
                }
            }
        }
    });

    // New logic: Clamp character's Y position at the top of the canvas
    if (character.y < 0) {
        character.y = 0;
        character.velocityY = 0;
    }
    
    // Original logic for the bottom of the canvas
    if (character.y + character.height >= canvas.height) {
        character.y = canvas.height - character.height;
        character.isStanding = true;
        character.velocityY = 0;
    }
}

function checkCharacterHorizontalCollision(character, dir) {
    if (character.isEliminated) return true;

    const charTopRow = Math.floor(character.y / BLOCK_SIZE);
    const charBottomRow = Math.floor((character.y + character.height - 1) / BLOCK_SIZE);
    const nextCol = character.col + dir;

    if (nextCol < 0 || nextCol >= COLS) {
        return true;
    }

    let isBlocked = false;

    for (let r = charTopRow; r <= charBottomRow; r++) {
        if (r >= 0 && r < ROWS && gameGrid[r][nextCol] !== 0) {
            isBlocked = true;
            break;
        }
    }

    if (isBlocked) {
        const spaceAboveIsClear = (charTopRow - 1 >= 0 && gameGrid[charTopRow - 1][nextCol] === 0);
        if (spaceAboveIsClear) {
            character.y = (charTopRow - 1) * BLOCK_SIZE;
            return false;
        }
        return true;
    }

    fallingBlocks.forEach(block => {
        if (block && block.isFalling) {
            const blockGridX = Math.floor(block.x);
            const blockGridY = Math.floor(block.y);

            for (let r = 0; r < block.shape.length; r++) {
                for (let c = 0; c < block.shape[r].length; c++) {
                    if (block.shape[r][c] !== 0) {
                        const blockPieceX = blockGridX + c;
                        const blockPieceY = blockGridY + r;

                        if (nextCol === blockPieceX) {
                            for (let charRow = charTopRow; charRow <= charBottomRow; charRow++) {
                                if (charRow === blockPieceY) {
                                    isBlocked = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (isBlocked) break;
            }
        }
    });

    return isBlocked;
}

function checkCrushCollision(block, offsetX = 0, offsetY = 0) {
    const potentialCrushers = [];
    for (let r = 0; r < block.shape.length; r++) {
        for (let c = 0; c < block.shape[r].length; c++) {
            if (block.shape[r][c] !== 0) {
                const blockCol = block.x + c + offsetX;
                const blockRow = block.y + r + offsetY;

                for (const character of characters) {
                    if (character.isEliminated) continue;

                    const charCol = character.col;
                    const charTopRow = Math.floor(character.y / BLOCK_SIZE);
                    const charBottomRow = Math.floor((character.y + character.height - 1) / BLOCK_SIZE);

                    if (blockCol === charCol && blockRow === charTopRow) {
                        potentialCrushers.push(character);
                    } else if (blockCol === charCol && blockRow > charTopRow && blockRow <= charBottomRow) {
                        eliminateRunner(character);
                        return true;
                    }
                }
            }
        }
    }
    for (const character of potentialCrushers) {
        if (character.isStanding) {
            return true;
        }
    }

    return false;
}

function checkAndPushRunners(block, dir) {
    // Step 1: Check if the block can move to the new position first.
    if (checkBlockCollision(block, dir, 0)) {
        // If the block can't move, it can't push or crush anyone.
        return false;
    }

    // Step 2: Now that we know the block can move, check for runner interactions.
    let blockMoved = true;
    for (const character of characters) {
        if (character.isEliminated) continue;

        const charCol = character.col;
        const charRow = Math.floor(character.y / BLOCK_SIZE);
        const nextCharCol = charCol + dir;
        const isBlockedByGrid = nextCharCol < 0 || nextCharCol >= COLS || (gameGrid[charRow] && gameGrid[charRow][nextCharCol] !== 0);

        // Find the block's solid piece that is adjacent to the runner
        let pushingBlockPiece = null;
        for (let r = 0; r < block.shape.length; r++) {
            for (let c = 0; c < block.shape[r].length; c++) {
                if (block.shape[r][c] !== 0) {
                    const blockCol = block.x + c;
                    const blockRow = block.y + r;
                    if (blockCol + dir === charCol && blockRow === charRow) {
                        pushingBlockPiece = { r, c };
                        break;
                    }
                }
            }
            if (pushingBlockPiece) break;
        }

        if (pushingBlockPiece) {
            let isPushedIntoMovingBlock = false;
            for (let br = 0; br < block.shape.length; br++) {
                for (let bc = 0; bc < block.shape[br].length; bc++) {
                    if (block.shape[br][bc] !== 0) {
                        if (block.x + bc + dir === nextCharCol && block.y + br === charRow) {
                            isPushedIntoMovingBlock = true;
                            break;
                        }
                    }
                }
                if (isPushedIntoMovingBlock) break;
            }

            if (isBlockedByGrid || isPushedIntoMovingBlock) {
                eliminateRunner(character);
            } else {
                character.col = nextCharCol;
                character.x = character.col * BLOCK_SIZE;
            }
        }
    }

    // Finally, move the block now that all runner interactions for the move have been processed.
    block.x += dir;
    return blockMoved;
}

function checkLineClears() {
    if (!clearLinesEnabled) return;

    let clearedCount = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
        const isLineFull = gameGrid[r].every(cell => cell !== 0);
        if (isLineFull) {
            gameGrid.splice(r, 1);
            const newRow = Array(COLS).fill(0);
            gameGrid.unshift(newRow);
            clearedCount++;
            r++;
        }
    }

    if (clearedCount > 0) {
        linesRemaining -= clearedCount;
        if (linesRemaining < 0) linesRemaining = 0;
        const linesSpan = linesRemainingDisplay.querySelector('span:last-child');
        linesSpan.textContent = linesRemaining;

        if (linesRemaining <= 0) {
            endGame(`The Block Controller wins!`);
            return;
        }
    }
}

function solidifyBlock(block) {
    const isBlockEmpty = block.shape.flat().every(cell => cell === 0);
    if (isBlockEmpty) {
        return;
    }

    for (let r = 0; r < block.shape.length; r++) {
        for (let c = 0; c < block.shape[r].length; c++) {
            if (block.shape[r][c] !== 0) {
                const newX = block.x + c;
                const newY = block.y + r;

                for (const character of characters) {
                    if (character.isEliminated) continue;

                    const charCol = character.col;
                    const charRow = Math.floor(character.y / BLOCK_SIZE);

                    if (newX === charCol && newY === charRow) {
                        eliminateRunner(character);
                    }
                }
            }
        }
    }

    for (let r = 0; r < block.shape.length; r++) {
        for (let c = 0; c < block.shape[r].length; c++) {
            if (block.shape[r][c] !== 0) {
                const newY = block.y + r;
                const newX = block.x + c;
                if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
                    gameGrid[newY][newX] = block.color;
                } else {
                    endGame("The Runners win! The block went out of bounds.");
                    return;
                }
            }
        }
    }
    // Remove o bloco do array
    const index = fallingBlocks.indexOf(block);
    if (index > -1) {
        fallingBlocks.splice(index, 1);
    }

    // Se não houver mais blocos controlados, cria um novo
    const controlledBlocks = fallingBlocks.filter(b => b.isControlled);
    if (controlledBlocks.length === 0) {
        currentBlock = newBlock();
    }
    
    checkLineClears();
}

function startSpecialAction() {
    if (!isSpecialActionEnabled || !isSpecialActionReady || specialActionActive) {
        return;
    }

    isSpecialActionReady = false;
    lastSpecialActionTime = Date.now();
    specialActionProgress.classList.remove('ready');

    showCountdown(3, () => {
        specialActionActive = true;
        
        let oldGrid = JSON.parse(JSON.stringify(gameGrid));
        compactedGrid = createGrid();
        for (let c = 0; c < COLS; c++) {
            let blocksInCol = [];
            for (let r = ROWS - 1; r >= 0; r--) {
                if (oldGrid[r][c] !== 0) {
                    blocksInCol.push(oldGrid[r][c]);
                }
            }
            let fillFromRow = ROWS - 1;
            for (const block of blocksInCol) {
                compactedGrid[fillFromRow][c] = block;
                fillFromRow--;
            }
        }
        
        specialActionDropCounter = 0;
        fallingBlocks.forEach(b => b.isFalling = false);
    });
}

function processSpecialAction(deltaTime) {
    if (!specialActionActive) return;

    specialActionDropCounter += deltaTime;

    if (specialActionDropCounter >= specialActionDropInterval) {
        specialActionDropCounter = 0;
        
        let blocksStillFalling = false;
        let nextGrid = createGrid();

        for (let r = ROWS - 1; r >= 0; r--) {
            for (let c = 0; c < COLS; c++) {
                if (gameGrid[r][c] !== 0) {
                    let targetRow = r;
                    // Find the lowest empty space in the new grid
                    while (targetRow + 1 < ROWS && nextGrid[targetRow + 1][c] === 0) {
                        targetRow++;
                    }

                    // Check for crush collision before moving the block
                    for (const character of characters) {
                        if (!character.isEliminated && character.col === c && Math.floor(character.y / BLOCK_SIZE) === r + 1) {
                            eliminateRunner(character);
                        }
                    }

                    if (targetRow > r) {
                        // Move the block down one step
                        nextGrid[r + 1][c] = gameGrid[r][c];
                        blocksStillFalling = true;
                    } else {
                        // The block can't move, so it stays
                        nextGrid[r][c] = gameGrid[r][c];
                    }
                }
            }
        }
        
        gameGrid = nextGrid;

        if (!blocksStillFalling) {
            specialActionActive = false;
            checkLineClears();
            fallingBlocks.forEach(b => b.isFalling = true);
            return;
        }
    }
}


function showCountdown(seconds, callback) {
    countdownMessageElement.style.display = 'flex';
    let count = seconds;
    countdownTextElement.textContent = count;

    const countdownInterval = setInterval(() => {
        if (count > 1) {
            count--;
            countdownTextElement.textContent = count;
        } else {
            clearInterval(countdownInterval);
            countdownMessageElement.style.display = 'none';
            callback();
        }
    }, 1000);
}

function showPolyominoLevelUpMessage() {
    polyominoLevelMessageElement.style.display = 'flex';
    polyominoLevelTextElement.textContent = `POLYOMINOES UPGRADED TO LEVEL ${currentPolyominoLevel}!`;
    
    setTimeout(() => {
        polyominoLevelMessageElement.style.display = 'none';
    }, 3000);
}

let lastTime = 0;
let dropCounter = 0;

function gameLoop(time = 0) {
    if (gameOver || isPaused) {
        if (isPaused) {
            draw();
        }
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (specialActionActive) {
        processSpecialAction(deltaTime);
    } else {
        fallingBlocks.forEach(block => {
            block.dropCounter += deltaTime;
            if (block.dropCounter > block.dropInterval) {
                if (checkCrushCollision(block, 0, 1)) {
                    let activeRunners = characters.filter(c => !c.isEliminated).length;
                    if (activeRunners === 0) {
                        endGame("The Block Controller wins! All runners were crushed.");
                        return;
                    }
                }
                if (!checkBlockCollision(block, 0, 1)) {
                    block.y++;
                } else {
                    solidifyBlock(block);
                }
                block.dropCounter = 0;
            }
        });
    }
    
    blockMoveCounter += deltaTime;
    if (blockMoveCounter > blockMoveInterval) {
        const controlledBlocks = fallingBlocks.filter(b => b.isControlled);
        if (controlledBlocks[0]) {
            if (keysPressed['a'] || keysPressed['A']) { move(controlledBlocks[0], -1); }
            if (keysPressed['d'] || keysPressed['D']) { move(controlledBlocks[0], 1); }
            if (keysPressed['s'] || keysPressed['S']) { softDrop(controlledBlocks[0]); }
        }
        if (controlledBlocks[1]) {
            if (keysPressed['f'] || keysPressed['F']) { move(controlledBlocks[1], -1); }
            if (keysPressed['h'] || keysPressed['H']) { move(controlledBlocks[1], 1); }
            if (keysPressed['g'] || keysPressed['G']) { softDrop(controlledBlocks[1]); }
        }
        if (controlledBlocks[2]) {
            if (keysPressed['j'] || keysPressed['J']) { move(controlledBlocks[2], -1); }
            if (keysPressed['l'] || keysPressed['L']) { move(controlledBlocks[2], 1); }
            if (keysPressed['k'] || keysPressed['K']) { softDrop(controlledBlocks[2]); }
        }
        blockMoveCounter = 0;
    }

    runnerMoveCounter += deltaTime;
    if (runnerMoveCounter > runnerMoveInterval) {
        if (characters[0] && !characters[0].isEliminated) {
            if (keysPressed['ArrowLeft']) { moveCharacter(characters[0], -1); }
            if (keysPressed['ArrowRight']) { moveCharacter(characters[0], 1); }
        }
        if (characters[1] && !characters[1].isEliminated) {
            if (keysPressed['f'] || keysPressed['F']) { moveCharacter(characters[1], -1); }
            if (keysPressed['h'] || keysPressed['H']) { moveCharacter(characters[1], 1); }
        }
        if (characters[2] && !characters[2].isEliminated) {
            if (keysPressed['j'] || keysPressed['J']) { moveCharacter(characters[2], -1); }
            if (keysPressed['l'] || keysPressed['L']) { moveCharacter(characters[2], 1); }
        }
        runnerMoveCounter = 0;
    }

    characters.forEach(character => {
        if (character.isEliminated) return;

        character.velocityY += character.gravity;
        character.y += character.velocityY;

        // NEW: Check for collision with the falling block's bottom while jumping
        fallingBlocks.forEach(block => {
            if (block && block.isFalling && character.velocityY < 0) {
                const charHeadY = character.y;
                const charCol = character.col;

                for (let r = 0; r < block.shape.length; r++) {
                    for (let c = 0; c < block.shape[r].length; c++) {
                        if (block.shape[r][c] !== 0) {
                            const blockPieceX = (block.x + c) * BLOCK_SIZE;
                            const blockPieceY = (block.y + r) * BLOCK_SIZE;

                            // Check if the character's head is inside the falling block piece
                            if (charHeadY <= blockPieceY + BLOCK_SIZE &&
                                charHeadY >= blockPieceY &&
                                character.x < blockPieceX + BLOCK_SIZE &&
                                character.x + character.width > blockPieceX) {
                                
                                eliminateRunner(character);
                                return; 
                            }
                        }
                    }
                }
            }
        });
        
        checkLandingCollision(character);

        // Runner is eliminated if they fall off the bottom of the screen.
        if (character.y > canvas.height) {
            eliminateRunner(character);
        }
    });

    projectiles.forEach((p, index) => {
        p.y += p.velocityY;

        const pCol = Math.floor((p.x + p.width / 2) / BLOCK_SIZE);
        const pRow = Math.floor(p.y / BLOCK_SIZE);

        let hitBlock = false;
        fallingBlocks.forEach(block => {
            if (block && block.isFalling) {
                const blockGridX = Math.floor(block.x);
                const blockGridY = Math.floor(block.y);
                const relativeCol = pCol - blockGridX;
                const relativeRow = pRow - blockGridY;
        
                if (relativeCol >= 0 && relativeCol < block.shape[0].length &&
                    relativeRow >= 0 && relativeRow < block.shape.length &&
                    block.shape[relativeRow][relativeCol] !== 0) {
        
                    block.shape[relativeRow][relativeCol] = 0;
                    score++;
                    projectiles.splice(index, 1);
                    hitBlock = true;
                    
                    const isBlockEmpty = block.shape.flat().every(cell => cell === 0);
                    if (isBlockEmpty) {
                        const blockIndex = fallingBlocks.indexOf(block);
                        if (blockIndex > -1) {
                            fallingBlocks.splice(blockIndex, 1);
                        }
                    }
                    return;
                }
            }
        });
        if (hitBlock) return;

        if (pRow >= 0 && pRow < ROWS && pCol >= 0 && pCol < COLS && gameGrid[pRow][pCol] !== 0) {
            gameGrid[pRow][pCol] = 0;
            score++;
            projectiles.splice(index, 1);
            checkLineClears();
        } else if (p.y < 0) {
            projectiles.splice(index, 1);
        }
    });

    const now = Date.now();
    if (now - lastRechargeTime > shotRechargeTime) {
        characters.forEach(c => rechargeShots(c));
        lastRechargeTime = now;
    } else {
        const elapsed = now - lastRechargeTime;
        characters.forEach(c => {
            if (!c.isEliminated && c.shotsRemaining < maxShotsPerRunner) {
                const progress = (elapsed / shotRechargeTime) * 100;
                const progressBar = document.getElementById(`recharge-progress-${c.id}`);
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
            }
        });
    }
    
    if (isSpecialActionEnabled) {
        const elapsedSinceQ = now - lastSpecialActionTime;
        const progressQ = Math.min(100, (elapsedSinceQ / specialActionCooldownTime) * 100);
        specialActionProgress.style.width = `${progressQ}%`;
        if (progressQ >= 100 && !isSpecialActionReady) {
            isSpecialActionReady = true;
            specialActionProgress.classList.add('ready');
        } else if (progressQ < 100 && isSpecialActionReady) {
            isSpecialActionReady = false;
            specialActionProgress.classList.remove('ready');
        }
    }

    playerScoreDisplay.querySelector('span:last-child').textContent = score;

    draw();
    requestAnimationFrame(gameLoop);
}

function rotate(block) {
    if (!block) return;
    const rotatedShape = rotateMatrix(block.shape);
    const tempBlock = { ...block, shape: rotatedShape };

    if (!checkBlockCollision(tempBlock)) {
        block.shape = rotatedShape;
    }
}

function rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotatedMatrix = Array.from({ length: cols }, () => Array(rows).fill(0));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            rotatedMatrix[c][rows - 1 - r] = matrix[r][c];
        }
    }

    return rotatedMatrix;
}

function move(block, dir) {
    if (!block || !block.isControlled) return;
    checkAndPushRunners(block, dir);
}

function moveCharacter(character, dir) {
    if (character && !character.isEliminated && !checkCharacterHorizontalCollision(character, dir)) {
        character.col += dir;
        character.x = character.col * BLOCK_SIZE;
    }
}

function softDrop(block) {
    if (!block) return;
    if (checkCrushCollision(block, 0, 1)) {
        let activeRunners = characters.filter(c => !c.isEliminated).length;
        if (activeRunners === 0) {
            endGame("The Block Controller wins! All runners were crushed.");
            return;
        }
    }
    if (!checkBlockCollision(block, 0, 1)) {
        block.y++;
    } else {
        solidifyBlock(block);
    }
}

function jump(character) {
    const jumpStrength = 10;
    if (character && !character.isEliminated && character.isStanding) {
        character.velocityY = -jumpStrength;
        character.isStanding = false;
    }
}

// Lógica de tiro e quebra de bloco simultânea
function shoot(character) {
    if (character && !character.isEliminated) {
        const col = character.col;
        const row = Math.floor(character.y / BLOCK_SIZE);

        const spaceBelowIsBlocked = (row + 1 < ROWS && col >= 0 && col < COLS && gameGrid[row + 1][col] !== 0);

        // Sempre atirar, se houver munição
        if (character.shotsRemaining > 0) {
            character.shotsRemaining--;
            document.getElementById(`shots-remaining-${character.id}`).textContent = character.shotsRemaining;

            const projectile = {
                x: character.x,
                y: character.y - 5,
                width: BLOCK_SIZE,
                height: BLOCK_SIZE,
                color: character.color,
                velocityY: -10
            };
            projectiles.push(projectile);
        }

        // Quebrar o bloco abaixo, se houver um
        if (spaceBelowIsBlocked) {
            gameGrid[row + 1][col] = 0;
            score++;
            checkLineClears();
        }
    }
}

function rechargeShots(character) {
    if (!isPaused && !gameOver && !character.isEliminated && character.shotsRemaining < maxShotsPerRunner) {
        character.shotsRemaining++;
        document.getElementById(`shots-remaining-${character.id}`).textContent = character.shotsRemaining;
        const progressBar = document.getElementById(`recharge-progress-${character.id}`);
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    }
}

function eliminateRunner(character) {
    character.isEliminated = true;
    const statusElement = document.getElementById(`runner-status-${character.id}`);
    if (statusElement) {
        statusElement.classList.add('bg-red-800');
        statusElement.classList.remove('bg-gray-700');
        statusElement.innerHTML = `<h4>Runner ${character.id + 1}</h4><p class="text-red-300">Eliminated!</p>`;
    }
    
    // Adiciona um novo bloco para o jogador eliminado controlar
    const newBlockForPlayer = newBlock(true); // O novo bloco é controlado
    
    // Associa o bloco ao jogador eliminado
    character.block = newBlockForPlayer;

    const activeRunners = characters.filter(c => !c.isEliminated).length;
    if (activeRunners === 0) {
        // Agora o jogo só termina quando não houver mais blocos controlados
        // e o último bloco solidificar
    }
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseScreen.style.display = 'flex';
        pauseMenuOptions = document.querySelectorAll('.pause-menu-option');
        focusedPauseMenuElementIndex = 0;
        updatePauseMenuFocus();
        clearInterval(speedIntervalId);
        clearInterval(countdownIntervalId);
        clearInterval(polyominoLevelUpIntervalId);
    } else {
        pauseScreen.style.display = 'none';
        gameLoop();
        startProgressiveSpeed();
        startCountdown();
        startPolyominoProgression();
        lastRechargeTime = Date.now();
    }
}

function endGame(message) {
    gameOver = true;
    gameMessageElement.textContent = message;
    gameMessageElement.style.display = 'flex';
    clearInterval(speedIntervalId);
    clearInterval(countdownIntervalId);
    clearInterval(polyominoLevelUpIntervalId);
    setTimeout(showMenu, 3000);
}

function showMenu() {
    mainContainer.style.display = 'none';
    gameMessageElement.style.display = 'none';
    pauseScreen.style.display = 'none';
    countdownMessageElement.style.display = 'none';
    polyominoLevelMessageElement.style.display = 'none';
    specialActionContainer.style.display = 'none';
    menuScreen.style.display = 'flex';
    clearInterval(speedIntervalId);
    clearInterval(countdownIntervalId);
    clearInterval(polyominoLevelUpIntervalId);

    menuOptions = document.querySelectorAll('.menu-option');
    focusedMenuElementIndex = 0;
    updateMenuFocus();
}

function updateMenuFocus() {
    menuOptions.forEach((option, index) => {
        if (index === focusedMenuElementIndex) {
            option.classList.add('focused-menu-item');
            option.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            option.classList.remove('focused-menu-item');
        }
    });
}

function updatePauseMenuFocus() {
    pauseMenuOptions.forEach((option, index) => {
        if (index === focusedPauseMenuElementIndex) {
            option.classList.add('focused-menu-item');
        } else {
            option.classList.remove('focused-menu-item');
        }
    });
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

function startProgressiveSpeed() {
    speedIntervalId = setInterval(() => {
        if (!isPaused && !gameOver) {
            dropInterval = Math.max(100, dropInterval * 0.7);
            fallingBlocks.forEach(block => block.dropInterval = dropInterval);
        }
    }, 60000);
}

function startCountdown() {
    countdownIntervalId = setInterval(() => {
        if (!isPaused && !gameOver) {
            gameTime--;
            const timerSpan = timerDisplay.querySelector('span:last-child');
            timerSpan.textContent = formatTime(gameTime);
            if (gameTime <= 0) {
                endGame("The Runners win! Time ran out.");
            }
        }
    }, 1000);
}

function startPolyominoProgression() {
    if (startingPolyominoLevel < endingPolyominoLevel) {
        polyominoLevelUpIntervalId = setInterval(() => {
            if (!isPaused && !gameOver) {
                if (currentPolyominoLevel < endingPolyominoLevel) {
                    currentPolyominoLevel++;
                    showPolyominoLevelUpMessage();
                    console.log(`Polyomino level increased to: ${currentPolyominoLevel}`);
                } else {
                    clearInterval(polyominoLevelUpIntervalId);
                }
            }
        }, polyominoProgressionTime * 60 * 1000);
    }
}

function createRunnerStatusUI() {
    runnerStatusContainer.innerHTML = '';
    characters.forEach((character, index) => {
        const statusDiv = document.createElement('div');
        statusDiv.id = `runner-status-${index}`;
        statusDiv.className = 'player-status-item';
        statusDiv.innerHTML = `
            <h4 style="color:${character.color}">Runner ${index + 1}</h4>
            <p>Shots Remaining: <span id="shots-remaining-${index}">${character.shotsRemaining}</span></p>
            <div class="shot-recharge-bar mt-1">
                <div id="recharge-progress-${index}" class="shot-recharge-progress" style="width: 0%;"></div>
            </div>
        `;
        runnerStatusContainer.appendChild(statusDiv);
    });
}

function startGame() {
    menuScreen.style.display = 'none';
    mainContainer.style.display = 'flex';

    const runnerCount = parseInt(runnerCountSelect.value);
    const speedOptions = { 'slow': 800, 'medium': 500, 'fast': 300, 'very-fast': 150 };

    const parsedLines = parseInt(linesInput.value);
    const parsedMaxShots = parseInt(maxShotsInput.value);
    const parsedRechargeTime = parseInt(rechargeTimeInput.value);
    const selectedSpeed = speedSelect.value;
    const parsedTime = parseInt(timeInput.value);
    
    startingPolyominoLevel = parseInt(polyominoStartSelect.value);
    endingPolyominoLevel = parseInt(polyominoEndSelect.value);
    polyominoProgressionTime = parseFloat(polyominoTimeInput.value);
    isSpecialActionEnabled = specialActionCheck.checked;
    specialActionCooldownTime = parseInt(specialActionTimeInput.value) * 1000;
    clearLinesEnabled = clearLinesCheck.checked;

    linesRemaining = isNaN(parsedLines) || parsedLines <= 0 ? 70 : parsedLines;
    maxShotsPerRunner = isNaN(parsedMaxShots) || parsedMaxShots <= 0 ? 7 : parsedMaxShots;
    shotRechargeTime = isNaN(parsedRechargeTime) || parsedRechargeTime <= 0 ? 30000 : parsedRechargeTime * 1000;
    dropInterval = speedOptions[selectedSpeed] || 500;
    gameTime = isNaN(parsedTime) || parsedTime <= 0 ? 300 : parsedTime * 60;
    
    currentPolyominoLevel = startingPolyominoLevel;

    gameGrid = createGrid();
    gameOver = false;
    isPaused = false;
    score = 0;
    projectiles = [];
    characters = [];
    fallingBlocks = []; // Limpa o array de blocos caindo
    
    specialActionActive = false;
    isSpecialActionReady = false;

    const runnerColors = ['#fde047', '#a78bfa', '#4ade80'];
    for (let i = 0; i < runnerCount; i++) {
        characters.push({
            id: i,
            col: Math.floor(COLS / 2) - 2 + i * 2,
            x: (Math.floor(COLS / 2) - 2 + i * 2) * BLOCK_SIZE,
            y: canvas.height - BLOCK_SIZE,
            width: BLOCK_SIZE, height: BLOCK_SIZE,
            color: runnerColors[i],
            isStanding: false, velocityY: 0, gravity: 0.5, jumpStrength: 10,
            shotsRemaining: maxShotsPerRunner,
            isEliminated: false
        });
    }

    // Cria o primeiro bloco controlado por padrão
    currentBlock = newBlock();

    playerScoreDisplay.querySelector('span:last-child').textContent = score;
    linesRemainingDisplay.querySelector('span:last-child').textContent = linesRemaining;
    timerDisplay.querySelector('span:last-child').textContent = formatTime(gameTime);

    createRunnerStatusUI();

    startProgressiveSpeed();
    startCountdown();
    startPolyominoProgression();
    lastRechargeTime = Date.now();
    lastSpecialActionTime = Date.now(); // Start cooldown at the beginning of the game
    isSpecialActionReady = false;
    specialActionProgress.classList.remove('ready');
    specialActionContainer.style.display = isSpecialActionEnabled ? 'block' : 'none';

    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', e => {
    if (menuScreen.style.display === 'flex') {
        const focusedElement = menuOptions[focusedMenuElementIndex];
        if (!focusedElement) return;
        
        if (e.key === 'ArrowUp') {
            focusedMenuElementIndex = (focusedMenuElementIndex - 1 + menuOptions.length) % menuOptions.length;
            updateMenuFocus();
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            focusedMenuElementIndex = (focusedMenuElementIndex + 1) % menuOptions.length;
            updateMenuFocus();
            e.preventDefault();
        } else if (e.key === 'Enter') {
            if (focusedElement.tagName === 'BUTTON') {
                focusedElement.click();
            } else if (focusedElement.tagName === 'SELECT') {
                const event = new MouseEvent('mousedown');
                focusedElement.dispatchEvent(event);
            } else if (focusedElement.tagName === 'INPUT') {
                focusedElement.focus();
            }
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            if (focusedElement.tagName === 'SELECT') {
                const options = focusedElement.options;
                let selectedIndex = focusedElement.selectedIndex;
                if (e.key === 'ArrowLeft') {
                    selectedIndex = (selectedIndex - 1 + options.length) % options.length;
                } else {
                    selectedIndex = (selectedIndex + 1) % options.length;
                }
                focusedElement.selectedIndex = selectedIndex;
                e.preventDefault();
            } else if (focusedElement.tagName === 'INPUT' && focusedElement.type === 'number') {
                let value = parseFloat(focusedElement.value);
                const min = parseFloat(focusedElement.min) || 0;
                const max = parseFloat(focusedElement.max) || Infinity;
                const step = parseFloat(focusedElement.step) || 1;

                if (e.key === 'ArrowLeft') {
                    value = Math.max(min, value - step);
                } else {
                    value = Math.min(max, value + step);
                }
                focusedElement.value = value;
                e.preventDefault();
            } else if (focusedElement.tagName === 'INPUT' && focusedElement.type === 'checkbox') {
                focusedElement.checked = !focusedElement.checked;
                e.preventDefault();
            }
        }
        return;
    }

    if (pauseScreen.style.display === 'flex') {
        if (e.key === 'ArrowUp') {
            focusedPauseMenuElementIndex = (focusedPauseMenuElementIndex - 1 + pauseMenuOptions.length) % pauseMenuOptions.length;
            updatePauseMenuFocus();
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            focusedPauseMenuElementIndex = (focusedPauseMenuElementIndex + 1) % pauseMenuOptions.length;
            updatePauseMenuFocus();
            e.preventDefault();
        } else if (e.key === 'Enter') {
            pauseMenuOptions[focusedPauseMenuElementIndex].click();
            e.preventDefault();
        }
        return;
    }

    if (e.key === 'p' || e.key === 'P') {
        togglePause();
    }
    keysPressed[e.key] = true;

    if (!isPaused && !gameOver) {
        if (e.key === 'w' || e.key === 'W') {
            const block = fallingBlocks.find(b => b.isControlled);
            if (block && !specialActionActive) {
                rotate(block);
            }
        }
        if (isSpecialActionEnabled && (e.key === 'q' || e.key === 'Q')) {
            startSpecialAction();
        }
        if (characters[0] && (e.key === 'ArrowUp')) { jump(characters[0]); }
        if (characters[0] && (e.key === 'ArrowDown')) { shoot(characters[0]); }

        if (characters[1] && (e.key === 't' || e.key === 'T')) { jump(characters[1]); }
        if (characters[1] && (e.key === 'y' || e.key === 'Y')) { shoot(characters[1]); }

        if (characters[2] && (e.key === 'i' || e.key === 'I')) { jump(characters[2]); }
        if (characters[2] && (e.key === 'o' || e.key === 'O')) { shoot(characters[2]); }
    }
});

window.addEventListener('keyup', e => {
    keysPressed[e.key] = false;
});

startGameButton.addEventListener('click', startGame);
resumeButton.addEventListener('click', togglePause);
backToMenuButton.addEventListener('click', () => {
    gameOver = true;
    showMenu();
});

window.addEventListener('load', () => {
    linesInput.value = 70;
    polyominoStartSelect.value = 3;
    polyominoEndSelect.value = 7;
    polyominoTimeInput.value = 1;
    specialActionCheck.checked = true;

    showMenu();
});
