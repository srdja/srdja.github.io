/*
  Copyright 2020 Srđan Panić

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var canvas;
var context;
var init = false;

const GRID_WIDTH  = 150;
const GRID_HEIGHT = 200;
var   grid;

var   color = '#FF00FF';

var cellSize;


function newGrid(w, h) {
    var grid = new Array(w);
    for (var i = 0; i < w; i++) {
        var y = new Array(h);
        grid[i] = y;
        for (var j = 0; j < h; j++) {
            y[j] = [0, 0];
        }
    }
    return grid;
}


function getCellSize(canvasWidth, canvasHeight) {
    var w = canvasWidth / GRID_WIDTH;
    var h = canvasHeight / GRID_HEIGHT;
    if (w < h)
        return w;
    return h;
}


function setPoint(grid, x, y) {
    var oX = 20;
    var oY = 20;
    grid[oX + x][oY + y][0] = 1;
}


function setPatternGliderGun(grid, width, height) {
    setPoint(grid, 0, 5);
    setPoint(grid, 0, 6);
    setPoint(grid, 1, 5);
    setPoint(grid, 1, 6);
    setPoint(grid, 10, 5);
    setPoint(grid, 10, 6);
    setPoint(grid, 10, 7);
    setPoint(grid, 11, 4);
    setPoint(grid, 11, 8);
    setPoint(grid, 12, 3);
    setPoint(grid, 12, 9);
    setPoint(grid, 13, 3);
    setPoint(grid, 13, 9);
    setPoint(grid, 14, 6);
    setPoint(grid, 15, 4);
    setPoint(grid, 15, 8);
    setPoint(grid, 16, 5);
    setPoint(grid, 16, 6);
    setPoint(grid, 16, 7);
    setPoint(grid, 17, 6);
    setPoint(grid, 20, 3);
    setPoint(grid, 20, 4);
    setPoint(grid, 20, 5);
    setPoint(grid, 21, 3);
    setPoint(grid, 21, 4);
    setPoint(grid, 21, 5);
    setPoint(grid, 22, 2);
    setPoint(grid, 22, 6);
    setPoint(grid, 24, 1);
    setPoint(grid, 24, 2);
    setPoint(grid, 24, 6);
    setPoint(grid, 24, 7);
    setPoint(grid, 34, 3);
    setPoint(grid, 34, 4);
    setPoint(grid, 35, 3);
    setPoint(grid, 35, 4);
}


function setPatternPulsar(grid, width, heigth) {
    setPoint(grid, 3, 1);
    setPoint(grid, 4, 1);
    setPoint(grid, 5, 1);
    setPoint(grid, 9, 1);
    setPoint(grid, 10, 1);
    setPoint(grid, 11, 1);
    setPoint(grid, 1, 3);
    setPoint(grid, 6, 3);
    setPoint(grid, 8, 3);
    setPoint(grid, 13, 3);
    setPoint(grid, 1, 4);
    setPoint(grid, 6, 4);
    setPoint(grid, 8, 4);
    setPoint(grid, 13, 4);
    setPoint(grid, 1, 5);
    setPoint(grid, 6, 5);
    setPoint(grid, 8, 5);
    setPoint(grid, 13, 5);
    setPoint(grid, 3, 6);
    setPoint(grid, 4, 6);
    setPoint(grid, 5, 6);
    setPoint(grid, 9, 6);
    setPoint(grid, 10, 6);
    setPoint(grid, 11, 6);
    setPoint(grid, 3, 8);
    setPoint(grid, 4, 8);
    setPoint(grid, 5, 8);
    setPoint(grid, 9, 8);
    setPoint(grid, 10, 8);
    setPoint(grid, 11, 8);
    setPoint(grid, 1, 9);
    setPoint(grid, 6, 9);
    setPoint(grid, 8, 9);
    setPoint(grid, 13, 9);
    setPoint(grid, 1, 10);
    setPoint(grid, 6, 10);
    setPoint(grid, 8, 10);
    setPoint(grid, 13, 10);
    setPoint(grid, 1, 11);
    setPoint(grid, 6, 11);
    setPoint(grid, 8, 11);
    setPoint(grid, 13, 11);
    setPoint(grid, 3, 13);
    setPoint(grid, 4, 13);
    setPoint(grid, 5, 13);
    setPoint(grid, 9, 13);
    setPoint(grid, 10, 13);
    setPoint(grid, 11, 13);
}


function initLifeEvents() {
    window.addEventListener('resize', function(event) {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        cellSize      = getCellSize(canvas.width, canvas.height);

        grid = newGrid(GRID_WIDTH, GRID_HEIGHT);
        setPatternGliderGun(grid, GRID_WIDTH, GRID_HEIGHT);
    });
}


function startLife() {
    window.requestAnimationFrame(lifeLoop);
}

// include abs position, pattern, and color
function initLife(canvasName, animColor, pattern) {
    canvas        = document.getElementById(canvasName);
    context       = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    init          = true;
    grid          = newGrid(GRID_WIDTH, GRID_HEIGHT);
    cellSize      = getCellSize(canvas.width, canvas.height);
    color         = animColor;

    context.translate(0.5, 0.5); // defuzz

    if (pattern === 0)
        setPatternGliderGun(grid, GRID_WIDTH, GRID_HEIGHT);
    else
        setPatternPulsar(grid, GRID_WIDTH, GRID_HEIGHT);;
    initLifeEvents();
    startLife();
}


function lifeColorThemeChanged() {
    // pull new color theme values
}


function lifeDraw(grid, offsetX, offsetY, color) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (var w = 0; w < GRID_WIDTH; w++) {
        for (var h = 0; h < GRID_HEIGHT; h++) {
            if (grid[w][h][0] == 1) {
                context.fillStyle = color;
                context.fillRect(offsetX + (cellSize * w),
                                 offsetY + (cellSize * h),
                                 cellSize,
                                 cellSize);
            }
        }
    }
}


function lifeStep(grid) {
    // Compute new state. Treat the outer cells as a border
    // to avoid messy bounds checks.
    for (var w = 1; w < GRID_WIDTH - 2; w++) {
        for (var h = 1; h < GRID_HEIGHT - 2; h++) {
            var neighbors = 0;
            neighbors += grid[w - 1][h - 1][0];
            neighbors += grid[w    ][h - 1][0];
            neighbors += grid[w + 1][h - 1][0];

            neighbors += grid[w - 1][h + 1][0];
            neighbors += grid[w    ][h + 1][0];
            neighbors += grid[w + 1][h + 1][0];

            neighbors += grid[w + 1][h    ][0];
            neighbors += grid[w - 1][h    ][0];

            if (grid[w][h][0] == 1) { // live cells
                if (neighbors < 2 || neighbors > 3) {
                    grid[w][h][1] = 0;
                } else if (neighbors == 2 || neighbors == 3) {
                    grid[w][h][1] = 1;
                }
            } else { // dead cells
                if (neighbors == 3) {
                    grid[w][h][1] = 1;
                } else {
                    grid[w][h][1] = 0;
                }
            }
        }
    }

    // apply new state
    for (var w = 2; w < GRID_WIDTH - 2; w++) {
        for (var h = 2; h < GRID_HEIGHT - 2; h++) {
            grid[w][h][0] = grid[w][h][1];
        }
    }
}


function lifeLoop() {
    if (!init) {
        window.requestAnimationFrame(lifeLoop);
        return;
    }
    lifeStep(grid);
    //    lifeDraw(grid, 250, 50, color);
    lifeDraw(grid, 250, 200, color);

    setTimeout(function () {
        window.requestAnimationFrame(lifeLoop);
    }, 1000 / 12);
}
