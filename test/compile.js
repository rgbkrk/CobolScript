
var cobs = require('../'),
    assert = require('assert');
    
function compile(code, ws) {
    var program = cobs.compileProgram(code);

    if (ws) {
        program.data = program.data || { };
        program.data.working_storage = ws;
    }
    
    var text = program.command.compile(program);
    return text;
}

// compile program defined

assert.ok(cobs.compileProgram);

// simple compile display

var text = compile('display "hello".');
assert.ok(text);
assert.ok(text.indexOf('runtime.display("hello");') >= 0);

// display two values

var text = compile('display "hello" "world".');
assert.ok(text);
assert.ok(text.indexOf('runtime.display("hello", "world");') >= 0);

// display with advancing

var text = compile('display "hello" "world" with advancing.');
assert.ok(text);
assert.ok(text.indexOf('runtime.display("hello", "world");') >= 0);

// display with no advancing

var text = compile('display "hello" "world" with no advancing.');
assert.ok(text);
assert.ok(text.indexOf('runtime.write("hello", "world");') >= 0);

// display no advancing

var text = compile('display "hello" "world" no advancing.');
assert.ok(text);
assert.ok(text.indexOf('runtime.write("hello", "world");') >= 0);

// display two values comma separated

var text = compile('display "hello", "world".');
assert.ok(text);
assert.ok(text.indexOf('runtime.display("hello", "world");') >= 0);

// simple compile move

var text = compile('move 1 to a-1.', {a_1: null});
assert.ok(text);
assert.ok(text.indexOf('ws.a_1 = 1;') >= 0);

// compile simple variable

text = compile('display A.', { a: null });
assert.ok(text);
assert.ok(text.indexOf('runtime.display(ws.a);') >= 0);

// compile simple variable in program

var text = compile('\
data division.\r\n\
working-storage section.\r\n\
01 a.\r\n\
procedure division.\r\n\
display a.\r\n\
');

assert.ok(text);
assert.ok(text.indexOf('runtime.display(ws.a);') >= 0);

// compile nested variable in program

var text = compile('\
data division.\r\n\
working-storage section.\r\n\
01 a.\r\n\
02 b.\r\n\
procedure division.\r\n\
display b.\r\n\
');
assert.ok(text);
assert.ok(text.indexOf('runtime.display(ws.a.b);') >= 0);

// simple compile two move commands

var text = compile('move 1 to a-1. move 2 to a-2.', { a_1: null, a_2: null });
assert.ok(text);
assert.ok(text.indexOf('ws.a_1 = 1;') >= 0);
assert.ok(text.indexOf('ws.a_2 = 2;') >= 0);

// simple compile two move commands without points

var text = compile('move 1 to a-1 move 2 to a-2', { a_1: null, a_2: null });
assert.ok(text);
assert.ok(text.indexOf('ws.a_1 = 1;') >= 0);
assert.ok(text.indexOf('ws.a_2 = 2;') >= 0);

// simple compile move to two variables

var text = compile('move 1 to a-1, a-2.', { a_1: null, a_2: null });
assert.ok(text);
assert.ok(text.indexOf('ws.a_1 = ws.a_2 = 1;') >= 0);

// simple function

var text = compile('procedure1.');
assert.ok(text.indexOf('function procedure1()') >= 0);

// function with moves

var text = compile('procedure1. move 1 to a. move 2 to b.', { a: null, b: null });
assert.ok(text.indexOf('function procedure1() {') >= 0);
assert.ok(text.indexOf('ws.a = 1;') >= 0);
assert.ok(text.indexOf('ws.b = 2;') >= 0);
assert.ok(text.indexOf('};') >= 0);

// function with parameters

var text = compile('procedure1 using x, y. move x to a. move y to b.', { a: null, b: null });
assert.ok(text.indexOf('function procedure1(x, y) {') >= 0);
assert.ok(text.indexOf('ws.a = x;') >= 0);
assert.ok(text.indexOf('ws.b = y;') >= 0);
assert.ok(text.indexOf('};') >= 0);

// function call with arguments

var text = compile('perform procedure1 using a, b.', { a: null, b: null });
assert.ok(text.indexOf('procedure1(ws.a, ws.b)') >= 0);

// perform procedure

var text = compile('perform procedure1.');
assert.ok(text.indexOf('procedure1();') >= 0);

// perform procedure with procedure

var text = compile('perform procedure1. procedure1. move 1 to a. move 2 to b.', { a: null, b: null });
assert.ok(text.indexOf('procedure1();') >= 0);
assert.ok(text.indexOf('function procedure1() {') >= 0);
assert.ok(text.indexOf('ws.a = 1;') >= 0);
assert.ok(text.indexOf('ws.b = 2;') >= 0);
assert.ok(text.indexOf('};') >= 0);

// perform procedure with varying

var text = compile('perform procedure1 varying k from 1 to 10 by 1. procedure1. move 1 to a. move 2 to b.', { k: null, a: null, b: null });
assert.ok(text.indexOf('for (ws.k = 1; ws.k <= 10; ws.k++)') >= 0);
assert.ok(text.indexOf('procedure1();') >= 0);
assert.ok(text.indexOf('function procedure1() {') >= 0);
assert.ok(text.indexOf('ws.a = 1;') >= 0);
assert.ok(text.indexOf('ws.b = 2;') >= 0);
assert.ok(text.indexOf('};') >= 0);

// perform procedure with giving

var text = compile('perform procedure1 giving k. procedure1. return 1.', { k: null });
assert.ok(text.indexOf('ws.k = procedure1();') >= 0);
assert.ok(text.indexOf('function procedure1() {') >= 0);
assert.ok(text.indexOf('return 1;') >= 0);
assert.ok(text.indexOf('};') >= 0);

// perform procedure with giving many variables

var text = compile('perform procedure-1 giving k, j. procedure-1. return 1.', { k: null, j: null });
assert.ok(text.indexOf('var $aux = procedure_1();') >= 0);
assert.ok(text.indexOf('ws.k = $aux;') >= 0);
assert.ok(text.indexOf('ws.j = $aux;') >= 0);
assert.ok(text.indexOf('function procedure_1() {') >= 0);
assert.ok(text.indexOf('return 1;') >= 0);
assert.ok(text.indexOf('};') >= 0);

// perform procedure with local

var text = compile('\
procedure division.\r\n\
perform procedure-1.\r\n\
perform procedure-2.\r\n\
\r\n\
procedure-1 local a.\r\n\
move 1 to a.\r\n\
return a.\r\n\
\r\n\
procedure-2 local a.\r\n\
move 2 to a.\r\n\
return a.'
, { k: null, j: null });
assert.ok(text.indexOf('procedure_1();') >= 0);
assert.ok(text.indexOf('procedure_2();') >= 0);
assert.ok(text.indexOf('function procedure_1() {') >= 0);
assert.ok(text.indexOf('function procedure_2() {') >= 0);
assert.ok(text.indexOf('var a;') >= 0);
assert.ok(text.indexOf('};') >= 0);

// if

var text = compile('if a > 0 then move 0 to a.', { a: null });
assert.ok(text.indexOf('if (ws.a > 0) {') >= 0);
assert.ok(text.indexOf('ws.a = 0;') >= 0);

// return with value

var text = compile('return 1.');
assert.ok(text.indexOf('return 1;') >= 0);

// return

var text = compile('return.');
assert.ok(text.indexOf('return;') >= 0);

// move to nested item

var text = compile('move 0 to b in a', { a: { b: null } });
assert.ok(text.indexOf('ws.a.b = 0;') >= 0);

