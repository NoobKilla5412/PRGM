# PRGM-lang

This is a programming language that I made.

## Example

```prgm
class Point {
  x = 0;
  y = 0;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  operator +=(other) {
    this.x += other.x;
    this.y += other.y;
    this;
  }

  toString() {
    "(" + this.x + ", " + this.y + ")";
  }
}

point = Point(10, 5);

println(point.toString());

canMove = true;

function move() {
  point.x += 1;
}

if (canMove) then point.x += 10;
else point.x -= 0;

if (!canMove) {
  println("Error");
} else move();
```

## Syntax

### Operators
All operators require spaces in between them.
```prgm
!cond # not cond
cond = true
i += 1
i -= 1
i /= 2
i *= 2
i %= 2
cond || otherCond # BUG: Both sides evaluate no matter what
cond && otherCond # BUG: Both sides evaluate no matter what
i < 1
i > 1
i <= 1
i >= 1
cond == true
cond != true
i + 1
i - 1
i * 2
i / 2
i % 2
obj.prop
```

### Call functions
```prgm
fnName(arg1, arg2, arg3);
```

### Block
```prgm
{
  # lines of code separated by ";"
}
```

### If
```prgm
if (cond) {
  true;
} else {
  false;
}

if (cond) then true; else false;
```

### Do-While
```prgm
do {
  # lines of code separated by ";"
} while (cond);
```

### Async while
```prgm
_while (cond) {
  # code
}
```

### While
```prgm
while (cond) {
  # code
}
```

### Function
The last expression evaluated is the return value of the function.
```prgm
function fnName(arg1, arg2, arg3) {
  # function body
}
```

### Object
```prgm
object {
  prop1: "Foo",
  prop2: "Bar",
  "Prop with spaces": 2
}
```

### Class
```prgm
class ClassName extends OtherClass {
  x = 2;
  y = 6;

  constructor(arg1, arg2) {
    # body
  }

  method1(arg) {
    # body
  }

  prop1 = "Foo";
}
```

### Import
```prgm
import "path";
```

### Other types
```prgm
# Null:
null
# Bool
true
false
# Num
1
2
3.5
# String
"Foo"
# Char
'a'
'b'
```