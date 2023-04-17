// https://tetris.wiki/Super_Rotation_System
// https://tetris.wiki/Playfield

var score = 0;
var level = 0;
var totalLines = 0;
var highscore = 0;

var fallSpeed = 500;

var init  = false;

function getBestScore() {
    return 0;
    var score = 0;
    if (localStorage.getItem('tetris-high-score') === null) {
        localStorage['tetris-high-score'] = score.toString();
        return score;
    } else {
        score = localStorage['tetris-high-score'];
        return score.parseInt();
    }
}

function setBestScore(score) {
    return;
    if (localStorage.getItem('tetris-high-score') === null) {
        localStorage['tetris-high-score'] = score.toString();
        return true;
    } else {
        var oldScore = localStorage['tetris-high-score'].parseInt();
        if (score > oldScore) {
            localStorage['tetris-high-score'] = score.toString();
            return true;
        }
        return false;
    }
}

// ----------------------------------------
// Game stuff
// ----------------------------------------

const FIELD_WIDTH  = 10;
const FIELD_HEIGHT = 22; // 20 are visible


function newField(w, h) {
    let field = new Array(w);
    for (var i = 0; i < w; i++) {
        let y = new Array(h);
        field[i] = y;
        for (var j = 0; j < h; j++) {
            y[j] = null;
        }
    }
    return field;
}


function fieldAdd(field, tet) {
    var pos   = tet["pos"];
    var color = tet["color"];
    for (var i = 0; i < pos.length; i++) {
        var x = pos[i][0];
        var y = pos[i][1];
        field[x][y] = color;
    }
}

// Tetromino is keps separate while it's still falling and then integrated
// once it touches the another block.
var field             = newField(FIELD_WIDTH, FIELD_HEIGHT);
var falling_tetromino = {color: "#FFFFFF", pos: [[0, 0], [0, 0], [0, 0], [0, 0]]};
var next_tetromino    = {color: "#FFFFFF", pos: [[0, 0], [0, 0], [0, 0], [0, 0]]};

const ROT1 = 0;
const ROT2 = 1;
const ROT3 = 2;
const ROT4 = 3;

const I_tet = {piece: 'I', color: "#31c7ef", pos: [[4, 1], [5, 1], [6, 1], [7, 1]], rotation: ROT1};
const O_tet = {piece: 'O', color: "#f7d308", pos: [[5, 0], [6, 0], [5, 1], [6, 1]], rotation: ROT1};
const T_tet = {piece: 'T', color: "#ad4d9c", pos: [[5, 0], [4, 1], [5, 1], [6, 1]], rotation: ROT1};
const S_tet = {piece: 'S', color: "#42b642", pos: [[5, 0], [6, 0], [4, 1], [5, 1]], rotation: ROT1};
const Z_tet = {piece: 'Z', color: "#ef2029", pos: [[4, 0], [5, 0], [5, 1], [6, 1]], rotation: ROT1};
const J_tet = {piece: 'J', color: "#5a65ad", pos: [[4, 0], [4, 1], [5, 1], [6, 1]], rotation: ROT1};
const L_tet = {piece: 'L', color: "#ef7921", pos: [[6, 0], [4, 1], [5, 1], [6, 1]], rotation: ROT1};

// common offsets // rename to TRANSLATE_UP etc.
const MOVE_DOWN_OFFSET  = [[ 0, 1], [ 0, 1], [ 0, 1], [ 0, 1]];
const MOVE_UP_OFFSET    = [[ 0,-1], [ 0,-1], [ 0,-1], [ 0,-1]];
const MOVE_LEFT_OFFSET  = [[-1, 0], [-1, 0], [-1, 0], [-1, 0]];
const MOVE_RIGHT_OFFSET = [[ 1, 0], [ 1, 0], [ 1, 0], [ 1, 0]];

// rotation offsets for specific tetrominos / translations
// I
const I_TO_ROT2 = [[ 1,  1], [ 0, 0], [-1, -1], [-2, -2]];
const I_TO_ROT1 = [[-1, -1], [ 0, 0], [ 1,  1], [ 2,  2]];

// T
const T_TO_ROT2 = [[-1,  1], [ 1,  1], [ 0,  0], [-1, -1]];
const T_TO_ROT3 = [[ 1,  1], [ 1, -1], [ 0,  0], [-1,  1]];
const T_TO_ROT4 = [[ 1, -1], [-1, -1], [ 0,  0], [ 1,  1]];
const T_TO_ROT1 = [[-1, -1], [-1,  1], [ 0,  0], [ 1, -1]];

// S
const S_TO_ROT2 = [[-1,  1], [-2,  0], [ 1,  1], [ 0,  0]];
const S_TO_ROT1 = [[ 1, -1], [ 2,  0], [-1, -1], [ 0,  0]];

// Z
const Z_TO_ROT2 = [[0, 2], [-1, 1], [0,0], [-1,-1]];
const Z_TO_ROT1 = [[0, -2], [1,-1], [0,0], [1,1]];


// J
const J_TO_ROT2 = [[0,2], [1,1], [0,0], [-1,-1]];
const J_TO_ROT3 = [[2,0], [1,-1], [0,0], [-1,1]];
const J_TO_ROT4 = [[0,-2], [-1,-1],[0,0],[1,1]];
const J_TO_ROT1 = [[-2,0],[-1,1],[0,0],[1,-1]];

// L
const L_TO_ROT2 = [[-2, 0], [1,1], [0,0], [-1,-1]];
const L_TO_ROT3 = [[0,2],[1,-1],[0,0],[-1,1]];
const L_TO_ROT4 = [[2,0],[-1,-1],[0,0], [1,1]];
const L_TO_ROT1 = [[0,-2],[-1,1],[0,0], [1,-1]];


const BAG_PROTO = [I_tet, O_tet, T_tet, S_tet, Z_tet, J_tet, L_tet];
var   bag       = [];


function newTetBag() {
    var b = JSON.parse(JSON.stringify(BAG_PROTO))
    for (var i = 0; i < b.length; i++) {
        var swap_at = Math.floor(Math.random() * (i + 1));
        var tmp = b[swap_at];
        b[swap_at] = b[i];
        b[i] = tmp;
    }
    return b;
}


function drawFromBag() {
    if (bag.length == 0) {
        bag = newTetBag();
    }
    return bag.shift();
}


function applyMove(origin, offset) {
    return origin.map((point, i) =>
                      [point[0] + offset[i][0],
                       point[1] + offset[i][1]]);
}


function tetCollidesWithLeftWall(pos, f) {
    return pos.reduce((total, val, i, ar) => {
        return val[0] < 0 || total;
    }, false);
}


function tetCollidesWithRightWall(pos, f) {
    return pos.reduce((total, val, i, ar) => {
        return val[0] >= FIELD_WIDTH || total;
    }, false);
}


function tetCollidesWithFloor(pos, f) {
    return pos.reduce((total, val, i, ar) => {
        return val[1] >= FIELD_HEIGHT || total;
    }, false);
}


function tetCollidesWithField(pos, f) {
    return pos.reduce((total, val, i, ar) => {
        var x = val[0];
        var y = val[1];
        return f[x][y] != null || total;
    }, false);
}


function tetMoveDown(t, f) { // should take a field param
    var pos = t["pos"];

    var move = applyMove(pos, MOVE_DOWN_OFFSET);

    if (tetCollidesWithFloor(move, f) ||
        tetCollidesWithField(move, f)) {
        return false;
    }
    t["pos"] = move;
    return true;
}


function tetMoveLeft(t, f) {
    var pos = t["pos"];

    var move = applyMove(pos, MOVE_LEFT_OFFSET);

    if (tetCollidesWithLeftWall(move, f) ||
        tetCollidesWithField(move, f))
        return false;

    t["pos"] = move;
    return true;
}


function tetMoveRight(t, f) {
    var pos = t["pos"];

    var move = applyMove(pos, MOVE_RIGHT_OFFSET);

    if (tetCollidesWithRightWall(move, f) ||
        tetCollidesWithField(move, f))
        return false;

    t["pos"] = move;
    return true;
}

// ----
// TODO: check collision against the floor
// ----


function tetRotateI(t, f) {
    var rot = t["rotation"];
    var pos = t["pos"];
    switch (rot) {
    case ROT2:
        // Try rotating
        var move = applyMove(pos, I_TO_ROT1);

        if (tetCollidesWithLeftWall(move, f)) {
            // Initial rotation collides with the left wall.
            // Try moving it right by one block.
            move = applyMove(pos, MOVE_RIGHT_OFFSET);

            // The wall kick makes it collide with the field.
            if (tetCollidesWithField(move, f))
                return false; // No rotation
            // The wall kick itself doesn't collide it with the
            // field.
            // Try rotating now.
            move = applyMove(move, I_TO_ROT1);

            // Check if the new rotation intersects with a field block.
            if (tetCollidesWithField(move, f)) {
                return false; // No rotation
            }
            t["pos"]      = move;
            t["rotation"] = ROT1;
            return true;
        } else if (tetCollidesWithRightWall(move, f)) {
            var move1 = applyMove(pos, MOVE_LEFT_OFFSET);
            var move2 = applyMove(move1, I_TO_ROT1);

            if (tetCollidesWithRightWall(move2, f)) {
                move1 = applyMove(move1, MOVE_LEFT_OFFSET);
                move2 = applyMove(move1, I_TO_ROT1);

                if (tetCollidesWithField(move2, f))
                    return false;

                t["pos"]      = move2;
                t["rotation"] = ROT1;
                return true;
            } else {
                if (tetCollidesWithField(move2, f))
                    return false;

                t["pos"]      = move2;
                t["rotation"] = ROT1;
                return true;
            }
        } else {
            // Unobstructed rotation
            if (tetCollidesWithField(move, f)) {
                return false; // No rotation
            }
            t["pos"]      = move;
            t["rotation"] = ROT1;
            return true;
        }
    case ROT1: // horizontal position
        // This alwasy rotates inwards, so no wall kicks.
        var move     = applyMove(pos, I_TO_ROT2);

        if (tetCollidesWithFloor(move, f)) {
            move = applyMove(pos, MOVE_UP_OFFSET);
            move = applyMove(move, I_TO_ROT2);
        }

        var collides = tetCollidesWithField(move, f);

        if (collides)
            return false;

        t["pos"]      = move;
        t["rotation"] = ROT2;
        break;
    }
    return true;
}


function tetRotateT(t, f) {
    var rot = t["rotation"];
    var pos = t["pos"];
    switch (rot) {
    case ROT1:
        // no wall kicks
        var move = applyMove(pos, T_TO_ROT2);
        if (tetCollidesWithFloor(move, f)) {
            move = applyMove(pos, MOVE_UP_OFFSET);
            move = applyMove(move, T_TO_ROT2);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"]      = move;
        t["rotation"] = ROT2;
        break;
    case ROT2:
        var move = applyMove(pos, T_TO_ROT3);
        if (tetCollidesWithRightWall(move, f)) {
            // needs a kick from the right wall
            move = applyMove(pos, MOVE_LEFT_OFFSET);
            move = applyMove(move, T_TO_ROT3);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"]      = move;
        t["rotation"] = ROT3;
        break;
    case ROT3:
        var move = applyMove(pos, T_TO_ROT4);
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"]      = move;
        t["rotation"] = ROT4;
        break;
    case ROT4:
        var move = applyMove(pos, T_TO_ROT1);
        if (tetCollidesWithLeftWall(move, f)) {
            // needs a kick from the right wall
            move = applyMove(pos, MOVE_RIGHT_OFFSET);
            move = applyMove(move, T_TO_ROT1);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"]      = move;
        t["rotation"] = ROT1;
        break;
    }
    return true;
}


function tetRotateS(t, f) {
    var rot = t["rotation"];
    var pos = t["pos"];
    switch (rot) {
    case ROT2:
        var move = applyMove(pos, S_TO_ROT1);
        if (tetCollidesWithRightWall(move, f)) {
            move = applyMove(pos, MOVE_LEFT_OFFSET);
            move = applyMove(move, S_TO_ROT1);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"] = move;
        t["rotation"] = ROT1;
        break;
    case ROT1:
        var move = applyMove(pos, S_TO_ROT2);
        if (tetCollidesWithFloor(move, f)) {
            move = applyMove(pos, MOVE_UP_OFFSET);
            move = applyMove(move, S_TO_ROT2);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"] = move;
        t["rotation"] = ROT2;
        break;
    }
    return true;
}


function tetRotateZ(t, f) {
    var rot = t["rotation"];
    var pos = t["pos"];
    switch (rot) {
    case ROT2:
        var move = applyMove(pos, Z_TO_ROT1);
        if (tetCollidesWithRightWall(move, f)) {
            move = applyMove(pos, MOVE_LEFT_OFFSET);
            move = applyMove(move, Z_TO_ROT1);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"] = move;
        t["rotation"] = ROT1;
        break;
    case ROT1:
        var move = applyMove(pos, Z_TO_ROT2);
        if (tetCollidesWithFloor(move, f)) {
            move = applyMove(pos, MOVE_UP_OFFSET);
            move = applyMove(move, Z_TO_ROT2);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"] = move;
        t["rotation"] = ROT2;
        break;
    }
    return true;
}


function tetRotateJ(t, f) {
    var rot = t["rotation"];
    var pos = t["pos"];
    switch (rot) {
    case ROT1:
        var move = applyMove(pos, J_TO_ROT2);
        if (tetCollidesWithFloor(move, f)) {
            move = applyMove(pos, MOVE_UP_OFFSET);
            move = applyMove(move, J_TO_ROT2);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"] = move;
        t["rotation"] = ROT2;
        break;
    case ROT2:
        var move = applyMove(pos, J_TO_ROT3);
        if (tetCollidesWithRightWall(move, f)) {
            move = applyMove(pos, MOVE_LEFT_OFFSET);
            move = applyMove(move, J_TO_ROT3);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"] = move;
        t["rotation"] = ROT3;
        break;
    case ROT3:
        var move = applyMove(pos, J_TO_ROT4);
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"] = move;
        t["rotation"] = ROT4;
        break;
    case ROT4:
        var move = applyMove(pos, J_TO_ROT1);
        if (tetCollidesWithLeftWall(move, f)) {
            move = applyMove(pos, MOVE_RIGHT_OFFSET);
            move = applyMove(move, J_TO_ROT1);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"] = move;
        t["rotation"] = ROT1;
        break;
    }
    return true;
}


function tetRotateL(t, f) {
    var rot = t["rotation"];
    var pos = t["pos"];
    switch (rot) {
    case ROT1:
        var move = applyMove(pos, L_TO_ROT2);
        if (tetCollidesWithFloor(move, f)) {
            move = applyMove(pos, MOVE_UP_OFFSET);
            move = applyMove(move, L_TO_ROT2);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"] = move;
        t["rotation"] = ROT2;
        break;
    case ROT2:
        var move = applyMove(pos, L_TO_ROT3);
        if (tetCollidesWithRightWall(move, f)) {
            move = applyMove(pos, MOVE_LEFT_OFFSET);
            move = applyMove(move, L_TO_ROT3);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"] = move;
        t["rotation"] = ROT3;
        break;
    case ROT3:
        var move = applyMove(pos, L_TO_ROT4);
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"] = move;
        t["rotation"] = ROT4;
        break;
    case ROT4:
        var move = applyMove(pos, L_TO_ROT1);
        if (tetCollidesWithLeftWall(move, f)) {
            move = applyMove(pos, MOVE_RIGHT_OFFSET);
            move = applyMove(move, L_TO_ROT1);
        }
        if (tetCollidesWithField(move, f)) {
            return false;
        }
        t["pos"] = move;
        t["rotation"] = ROT1;
        break;
    }
    return true;
}


function tetRotate(t, f) {
    var type = t["piece"];
    switch (type) {
    case 'I':
        tetRotateI(t, f);
        break;
    case 'T':
        tetRotateT(t, f);
        break;
    case 'S':
        tetRotateS(t, f);
        break;
    case 'Z':
        tetRotateZ(t, f);
        break;
    case 'J':
        tetRotateJ(t, f);
        break;
    case 'L':
        tetRotateL(t, f);
        break;
    }
}


function clearLines(f) {
    // Should probably split into more function like "clearCandidates"
    // and actuall clear. Probably useful for fansy animations.
    var lines = 0;
    var linesPos = [0,0,0,0];

    // find candidates
    for (let y = 0; y < FIELD_HEIGHT; y++) {
        var x = 0;
        while (x < FIELD_WIDTH) {
            if (f[x][y] == null)
                break;
            x++;
        }
        if (x == FIELD_WIDTH) {
            linesPos[lines++] = y;
        }
        if (lines == 4) {
            break;
        }
    }
    // clear and realign
    var line = 0;

    for (var line = 0; line < lines; line++) {
        // delete line and move everything down
        for (var y = linesPos[line]; y > 0; y--) {
            for (var x = 0; x < FIELD_WIDTH; x++) {
                f[x][y] = f[x][y-1];
                // I guess it could be optimized to stop once a
                // full empty line is encountered.
            }
        }
    }
    return lines;
}



function initTetris() {
    initCanvas();
    init = true;
    drawFrame();
    drawField(field);
    drawScore(score);
    drawLines(totalLines);
    drawLevel(level);
    drawHighScore(getBestScore());
}


// ----------------------------------------
// Input
// ----------------------------------------

const INPUT_EVENT_NONE       = 0;
const INPUT_EVENT_MOVE_LEFT  = 1;
const INPUT_EVENT_MOVE_RIGHT = 2;
const INPUT_EVENT_DROP       = 3;
const INPUT_EVENT_ROTATE_CCW = 4;

// should be another rotate and a down key and pause

var input_move_left  = INPUT_EVENT_NONE;
var input_move_right = INPUT_EVENT_NONE;
var input_move_side  = INPUT_EVENT_NONE;
var input_drop       = INPUT_EVENT_NONE;
var input_rotate     = INPUT_EVENT_NONE;

const rotate_repeat_speed        = 0;
const move_sideways_repeat_speed = 0;
const move_down_repeat_speed     = 0;

var fall_speed = 500;
var fall_in    = fall_speed;

var move_sideways_delay = 50;
var move_left_delay     = 0;
var move_right_delay    = 0;

// optimization
var fallingTetromino = drawFromBag();
var nextTetromino    = drawFromBag();

var gameOver = false;


function isGameOver(field) {
    // Check the top row. If a block is there, it's game over.
    for (var y = 0; y <= 2; y++) {
        for (var x = 0; x < FIELD_WIDTH; x++) {
            if (field[x][y] != null) {
                return true;
            }
        }
    }
    return false;
}


function updateGameState(deltaT) {
    if (gameOver) {
        drawGameOverScreen();
        return;
    }

    fall_in          -= deltaT;
    move_left_delay  -= deltaT;
    move_right_delay -= deltaT;

    // Do the automatic fall
    if (fall_in <= 0) {
        if (!tetMoveDown(fallingTetromino, field)) {
            if (isGameOver(field)) {
                gameOver = true;
            } else {   
                fieldAdd(field, fallingTetromino);         
                fallingTetromino = nextTetromino;
                nextTetromino    = drawFromBag();
            }
        } 
        fall_in = fall_speed;
    }

    if (input_drop == INPUT_EVENT_DROP) {
        input_drop = INPUT_EVENT_NONE;
        while (tetMoveDown(fallingTetromino, field))
            ;
        
        if (isGameOver(field)) {
            gameOver = true;
        } else {
            fieldAdd(field, fallingTetromino);
            fallingTetromino = nextTetromino;
            nextTetromino    = drawFromBag();
        }
    } else {
        // if both are pressed they will cancel each other out.
        if (input_move_right == INPUT_EVENT_MOVE_RIGHT && 
            move_right_delay <= 0) 
        { 
            tetMoveRight(fallingTetromino, field);
            move_right_delay = move_sideways_delay;
        }
        if (input_move_left == INPUT_EVENT_MOVE_LEFT && 
            move_left_delay <= 0) 
        {
            tetMoveLeft(fallingTetromino, field);
            move_left_delay = move_sideways_delay;
        }
        if (input_rotate == INPUT_EVENT_ROTATE_CCW) {
            tetRotate(fallingTetromino, field);
            input_rotate = INPUT_EVENT_NONE;
        }
    }
    var lines = 0;
    if ((lines = clearLines(field)) > 0) {
        switch (lines) {
        case 1: score += 40   * (level + 1); break;
        case 2: score += 100  * (level + 1); break;
        case 3: score += 300  * (level + 1); break;
        case 4: score += 1200 * (level + 1); break;
        }
        totalLines += lines;

        drawScore(score);
        setBestScore(score);
        drawHighScore(0);
        drawLines(totalLines);

        var newLevel = (totalLines - (totalLines % 10)) / 10;
        if (newLevel > 20) {
            newLevel = 20;
        }
        if (newLevel > level) {
            level = newLevel;
            fall_speed = fall_speed * 0.80;
        }
        drawLevel(level);
    }

    drawTetromino(fallingTetromino);
    drawPreview(nextTetromino);
    drawField(field);
}


document.addEventListener('keydown', function(event) {
    if ([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
        event.preventDefault();
    }
    if(event.keyCode == 37) {
        input_move_left = INPUT_EVENT_MOVE_LEFT;
    }
    else if(event.keyCode == 39) {
        input_move_right = INPUT_EVENT_MOVE_RIGHT;
    }
    else if (event.keyCode == 32) {
        input_drop = INPUT_EVENT_DROP;
    }
    else if (event.keyCode == 38) {
        input_rotate = INPUT_EVENT_ROTATE_CCW;
    }
});


document.addEventListener('keyup', function(event) {
    if(event.keyCode == 37) {
        move_left_delay = 0;
        input_move_left = INPUT_EVENT_NONE;
    }
    else if(event.keyCode == 39) {
        move_right_delay = 0;
        input_move_right = INPUT_EVENT_NONE;
    }
    else if (event.keyCode == 32) {
        input_drop = INPUT_EVENT_NONE;
    }
    else if (event.keyCode == 38) {
        input_rotate = INPUT_EVENT_NONE;
    }
});


document.addEventListener('click', function(event) {
    var x = event.clientX;
    var y = event.clientY;

    // Move left region
    if (y >= ctl1_origin_y && y <= (ctl1_origin_y + ctl_side) &&
        x >= ctl1_origin_x && x <= (ctl1_origin_x + ctl_side))
    {
        input_move_side = INPUT_EVENT_MOVE_LEFT;
    }
    else if (y >= ctl2_origin_y && y <= (ctl2_origin_y + ctl_side) &&
             x >= ctl2_origin_x && x <= (ctl2_origin_x + ctl_side))
    {
        input_move_side = INPUT_EVENT_MOVE_RIGHT;
    }
    else if (y >= ctl3_origin_y && y <= (ctl3_origin_y + ctl_side) &&
             x >= ctl3_origin_x && x <= (ctl3_origin_x + ctl_side))
    {
        input_drop = INPUT_EVENT_DROP;
    }
    else if (y >= ctl4_origin_y && y <= (ctl4_origin_y + ctl_side) &&
             x >= ctl4_origin_x && x <= (ctl4_origin_x + ctl_side))
    {
        input_rotate = INPUT_EVENT_ROTATE_CCW;
    }
});


function restartGame() {

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var   startT   = Date.now();
var   deltaT   = startT;
var   nowT     = startT;
var   fps      = 0;
const FPS_CAP  = 30;
const FRAME_MS = 1000 / FPS_CAP;


async function gameLoop() {
    if (!init) {
        window.requestAnimationFrame(gameLoop);
        return;
    }
    eraseField();
    updateGameState(deltaT);
    drawFPS(fps);

    deltaT = Date.now() - startT;

    if (deltaT < FRAME_MS) {
        await sleep(FRAME_MS - deltaT);
    }

    deltaT = Date.now() - startT;
    fps    = Math.round(1000 / deltaT);
    startT = Date.now();

    window.requestAnimationFrame(gameLoop);
}

initTetris();

window.addEventListener('resize', function(event) {
    canvasResize();
    drawFrame();
    drawField(field);
    drawScore(score);
    drawTetromino(fallingTetromino);
    drawPreview(nextTetromino);
    drawLines(totalLines);
    drawLevel(level);
    drawHighScore(getBestScore());
});

window.requestAnimationFrame(gameLoop);


// TODO: TAP FIELD TO START OR PAPUSE
