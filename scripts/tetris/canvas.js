var gui_color = "#FFFFFF";

var canvas;
var context;


var scale_ref       = 0;

// ----------------------------------------
// Window
// ----------------------------------------
var window_width    = 0;
var window_height   = 0;

var window_center_x = 0;
var window_center_y = 0;

var window_origin_x = 0;
var window_origin_y = 0;

var top_offset      = 40;
var side_offset     = 40;

// ----------------------------------------
// Field
// ----------------------------------------
var field_width     = 0;
var field_height    = 0;

var field_origin_x  = 0;
var field_origin_y  = 0;

// ----------------------------------------
// Controls
// ----------------------------------------
var ctl_side        = 0;

var ctl1_origin_x   = 0;
var ctl1_origin_y   = 0;

var ctl2_origin_x   = 0;
var ctl2_origin_y   = 0;

var ctl3_origin_x   = 0;
var ctl3_origin_y   = 0;

var ctl4_origin_x   = 0;
var ctl4_origin_y   = 0;

// ----------------------------------------
// Preview
// ----------------------------------------

var preview_side     = 0;
var preview_origin_x = 0;
var preview_origin_y = 0;

var preview_t_origin_x = 0;
var preview_t_origin_y = 0;
// ----------------------------------------
// Tetromino
// ----------------------------------------

var tetromino_side   = 0;
var tetromino_offset = 0;
var tetromino_border = 0;


var font_scale = 0;
var label_padding_x = 0;
var label_padding_y = 0;

function setScale(w, h) {
    window_height   = h - top_offset;
    window_width    = h * 0.75 - side_offset; // h:w = 4:3 aspect ratio

    scale_ref       = window_height;

    window_center_x = w  / 2;
    window_center_y = h / 2;

    window_origin_x = window_center_x - (window_width / 2);
    window_origin_y = window_center_y - (window_height / 2);

    // ----------------------------------------

    field_width     = window_width * 0.55;
    field_height    = field_width  * 2;

    var padding     = scale_ref * 0.02;

    field_origin_x  = window_origin_x + padding;
    field_origin_y  = window_origin_y + padding;

    // ----------------------------------------
    var y_offset    = window_height * 0.83;
    ctl_side        = window_height * 0.13;

    ctl1_origin_x   = window_origin_x + padding;
    ctl1_origin_y   = window_origin_y + padding + y_offset;

    ctl2_origin_x   = window_origin_x + ctl_side + padding * 2;
    ctl2_origin_y   = window_origin_y + padding  + y_offset;

    ctl3_origin_x   = window_origin_x + ctl_side * 2 + padding * 3;
    ctl3_origin_y   = window_origin_y + padding  + y_offset;

    ctl4_origin_x   = window_origin_x + ctl_side * 3 + padding * 4;
    ctl4_origin_y   = window_origin_y + padding  + y_offset;

    tetromino_side  = field_width / 10;
    tetromino_offset= tetromino_side * 2;
    tetromino_border= tetromino_side * 0.10;

    preview_origin_x = window_origin_x + (window_width * 0.63);
    preview_origin_y = window_origin_y + padding * 3;
    preview_side     = window_height * 0.22;

    font_scale = window_height * 0.05;
    label_padding_x = padding;
    label_padding_y = padding;
}


function drawFrame() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.lineWidth   = 1;
    context.strokeStyle = gui_color;
    context.fillStyle   = gui_color;

    context.strokeRect(window_origin_x,
                       window_origin_y,
                       window_width,
                       window_height);

    context.strokeRect(field_origin_x,
                       field_origin_y,
                       field_width + tetromino_border,
                       field_height + tetromino_border);

    context.font = font_scale + "px mono";
    context.fillText("Next:", preview_origin_x + label_padding_x * 2, preview_origin_y);

    context.fillText("Score:", preview_origin_x + label_padding_x * 2, preview_origin_y + preview_side);
    context.fillText("Lines:", preview_origin_x + label_padding_x * 2, preview_origin_y + preview_side + (preview_side * 0.60));
    context.fillText("Level:", preview_origin_x + label_padding_x * 2, preview_origin_y + preview_side + (preview_side * 0.60 * 2));

    context.fillText("Best:", preview_origin_x + label_padding_x * 2, preview_origin_y + preview_side + (preview_side * 0.60 * 3));

    // ----------------------------------------

    context.strokeRect(ctl1_origin_x,
                       ctl1_origin_y,
                       ctl_side,
                       ctl_side)

    var step = ctl_side / 8;
    var x    = ctl1_origin_x;
    var y    = ctl1_origin_y;

    context.beginPath();
    context.moveTo(x + step * 6, y + step * 3);
    context.lineTo(x + step * 4, y + step * 3);
    context.lineTo(x + step * 4, y + step * 2);
    context.lineTo(x + step * 2, y + step * 4);
    context.lineTo(x + step * 4, y + step * 6);
    context.lineTo(x + step * 4, y + step * 5);
    context.lineTo(x + step * 6, y + step * 5);
    context.lineTo(x + step * 6, y + step * 3);
    context.fill();


    context.strokeRect(ctl2_origin_x,
                       ctl2_origin_y,
                       ctl_side,
                       ctl_side)

    x = ctl2_origin_x;
    y = ctl2_origin_y;

    context.beginPath();
    context.moveTo(x + step * 2, y + step * 3);
    context.lineTo(x + step * 4, y + step * 3);
    context.lineTo(x + step * 4, y + step * 2);
    context.lineTo(x + step * 6, y + step * 4);
    context.lineTo(x + step * 4, y + step * 6);
    context.lineTo(x + step * 4, y + step * 5);
    context.lineTo(x + step * 2, y + step * 5);
    context.lineTo(x + step * 2, y + step * 3);
    context.fill();


    context.strokeRect(ctl3_origin_x,
                       ctl3_origin_y,
                       ctl_side,
                       ctl_side)

    x = ctl3_origin_x;
    y = ctl3_origin_y;

    context.moveTo(x + step * 3, y + step * 2);
    context.lineTo(x + step * 5, y + step * 2);
    context.lineTo(x + step * 5, y + step * 4);
    context.lineTo(x + step * 6, y + step * 4);
    context.lineTo(x + step * 4, y + step * 6);
    context.lineTo(x + step * 2, y + step * 4);
    context.lineTo(x + step * 3, y + step * 4);
    context.lineTo(x + step * 3, y + step * 2);
    context.fill();

    context.strokeRect(ctl4_origin_x,
                       ctl4_origin_y,
                       ctl_side,
                       ctl_side)

    x = ctl4_origin_x;
    y = ctl4_origin_y;

    context.lineWidth = step;
    context.beginPath();
    context.arc(x + step * 4,
                y + step * 4,
                step * 2,
                Math.PI * 2 * 0.25,
                Math.PI * 2 * 0.48,
                1);
    context.stroke();

    context.beginPath();
    context.moveTo(x + step * 1, y + step * 4);
    context.lineTo(x + step * 3, y + step * 4);
    context.lineTo(x + step * 2, y + step * 6);
    context.lineTo(x + step * 1, y + step * 4);
    context.fill();
}


function drawTetromino(t) {
    context.fillStyle = t["color"];
    //    context.fillStyle = "#FF3f58";
    var p = t["pos"];
    for (var i = 0; i < p.length; i++) {
        if (p[i][1] < 2)
            continue; // skip hidden

        var x = field_origin_x + (p[i][0] * tetromino_side);
        var y = field_origin_y + (p[i][1] * tetromino_side) - tetromino_offset;

        context.fillRect(x + tetromino_border,
                         y + tetromino_border,
                         tetromino_side - tetromino_border,
                         tetromino_side - tetromino_border);
    }
}


function drawLevel(level) {
    context.fillStyle = gui_color;
    context.clearRect(preview_origin_x + label_padding_x * 2,
                      preview_origin_y + preview_side + (preview_side * 0.6 * 2),
                      preview_side,
                      font_scale + (font_scale * 0.9));

    context.font = font_scale + "px mono;"
    context.fillText(level.toString(),
                     preview_origin_x + label_padding_x * 2,
                     preview_origin_y + preview_side + font_scale + (preview_side * 0.6 * 2));
}



function drawHighScore(score) {
    context.fillStyle = gui_color;
    //    context.textAlign = "center";
    context.clearRect(preview_origin_x + label_padding_x * 2,
                      preview_origin_y + preview_side + (preview_side * 0.6 * 3),
                      preview_side,
                      font_scale + (font_scale * 0.9));

    context.font = font_scale + "px mono;"
    context.fillText(score.toString(),
                     preview_origin_x + label_padding_x * 2,
                     preview_origin_y + preview_side + font_scale + (preview_side * 0.6 * 3));
}


function drawFPS(fps) {
    context.fillStyle = gui_color;
    context.font      = font_scale + "px mono;"   
    
    context.fillText(fps.toString(),
                     field_origin_x + label_padding_x,
                     field_origin_y + font_scale);
}



function drawScore(score) {
    context.fillStyle = gui_color;
    //    context.textAlign = "center";
    context.clearRect(preview_origin_x + label_padding_x * 2,
                      preview_origin_y + preview_side + 1,
                      preview_side,
                      font_scale + (font_scale * 0.9));

    context.font = font_scale + "px mono;"
    context.fillText(score.toString(),
                     preview_origin_x + label_padding_x * 2,
                     preview_origin_y + preview_side + font_scale);
}


function drawLines(lines) {
    context.fillStyle = gui_color;
    //    context.textAlign = "center";
    context.clearRect(preview_origin_x + label_padding_x * 2,
                      preview_origin_y + preview_side + (preview_side * 0.6),
                      preview_side,
                      font_scale + (font_scale * 0.9));

    context.font = font_scale + "px mono;"
    context.fillText(lines.toString(),
                     preview_origin_x + label_padding_x * 2,
                     preview_origin_y + preview_side + font_scale + (preview_side * 0.6));
}


function drawPreview(t) {
    context.clearRect(preview_origin_x + 1,
                      preview_origin_y + 1,
                      preview_side + 2,
                      preview_side * 0.75);

    context.fillStyle = t["color"];

    var p = t["pos"];
    for (var i = 0; i < p.length; i++) {
        var x = preview_origin_x + ((p[i][0] - 3) * tetromino_side + label_padding_x);
        var y = preview_origin_y + ((p[i][1] + 3) * tetromino_side + label_padding_y) - tetromino_offset * 1.2;

        context.fillRect(x + tetromino_border,
                         y + tetromino_border,
                         tetromino_side - tetromino_border,
                         tetromino_side - tetromino_border);
    }
}


function drawField(f) {
    for (var x = 0; x < FIELD_WIDTH; x++) {
        for (var y = 0; y < FIELD_HEIGHT; y++) {
            if (f[x][y] == null || y < 2)
                continue;

            context.fillStyle = f[x][y];

            var xo = field_origin_x + x * tetromino_side;
            var yo = field_origin_y + y * tetromino_side - tetromino_offset;

            context.fillRect(xo + tetromino_border,
                             yo + tetromino_border,
                             tetromino_side - tetromino_border,
                             tetromino_side - tetromino_border)
        }
    }
}


function eraseField() {
    context.clearRect(field_origin_x + 1,
                      field_origin_y + 1,
                      field_width,
                      field_height);
}


function drawGameOverScreen() {
    var alignment = context.textAlign;
    context.fillStyle = gui_color;
    context.textAlign = "center";
    context.font = font_scale + "px mono";
    context.fillText("Game Over!",
                     field_origin_x + field_width / 2,
                     field_origin_y + field_height / 2);

    context.textAlign = alignment;
}


function initCanvas() {
    canvas          = document.getElementById('tetris-canvas');
    context         = canvas.getContext('2d');
    canvas.width    = window.innerWidth;
    canvas.height   = window.innerHeight;

    setScale(canvas.width, canvas.height);

    context.translate(0.5, 0.5);
}


function canvasResize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    setScale(canvas.width, canvas.height);
}
