let per = require('per');
let runs = require('./runs');

let tag = function(name, formattingProperty) {
  return function(node, formatting) {
    if (node.nodeName === name) {
      formatting[formattingProperty] = true;
    }
  };
};

let value = function(type, styleProperty, formattingProperty, transformValue) {
  return function(node, formatting) {
    let val = node[type] && node[type][styleProperty];
    if (val) {
      if (transformValue) {
        val = transformValue(val);
      }
      formatting[formattingProperty] = val;
    }
  };
};

let attrValue = function(styleProperty, formattingProperty, transformValue) {
  return value('attributes', styleProperty, formattingProperty, transformValue);
};

let styleValue = function(styleProperty, formattingProperty, transformValue) {
  return value('style', styleProperty, formattingProperty, transformValue);
};

let styleFlag = function(styleProperty, styleValue, formattingProperty) {
  return function(node, formatting) {
    if (node.style && node.style[styleProperty] === styleValue) {
      formatting[formattingProperty] = true;
    }
  };
};

let obsoleteFontSizes = [6, 7, 9, 10, 12, 16, 20, 30];

let aligns = {
  left: true,
  center: true,
  right: true,
  justify: true,
};

let checkAlign = function(value) {
  return aligns[value] ? value : 'left';
};

let fontName = function(name) {
  let s = name.split(/\s*,\s*/g);
  if (s.length == 0) {
    return name;
  }
  name = s[0];
  let raw = name.match(/^"(.*)"$/);
  if (raw) {
    return raw[1].trim();
  }
  raw = name.match(/^'(.*)'$/);
  if (raw) {
    return raw[1].trim();
  }
  return name;
};

let headings = {
  H1: 30,
  H2: 20,
  H3: 16,
  H4: 14,
  H5: 12,
};

let handlers = [
  tag('B', 'bold'),
  tag('STRONG', 'bold'),
  tag('I', 'italic'),
  tag('EM', 'italic'),
  tag('U', 'underline'),
  tag('S', 'strikeout'),
  tag('STRIKE', 'strikeout'),
  tag('DEL', 'strikeout'),
  styleFlag('fontWeight', 'bold', 'bold'),
  styleFlag('fontStyle', 'italic', 'italic'),
  styleFlag('textDecoration', 'underline', 'underline'),
  styleFlag('textDecoration', 'line-through', 'strikeout'),
  styleValue('color', 'color'),
  styleValue('fontFamily', 'font', fontName),
  styleValue('fontSize', 'size', function(size) {
    let m = size.match(/^([\d\.]+)p/);
    return m ? parseFloat(m[1]) : 10;
  }),
  styleValue('textAlign', 'align', checkAlign),
  function(node, formatting) {
    if (node.nodeName === 'SUB') {
      formatting.script = 'sub';
    }
  },
  function(node, formatting) {
    if (node.nodeName === 'SUPER') {
      formatting.script = 'super';
    }
  },
  function(node, formatting) {
    if (node.nodeName === 'CODE') {
      formatting.font = 'monospace';
    }
  },
  function(node, formatting) {
    let size = headings[node.nodeName];
    if (size) {
      formatting.size = size;
    }
  },
  attrValue('color', 'color'),
  attrValue('face', 'font', fontName),
  attrValue('align', 'align', checkAlign),
  attrValue('size', 'size', function(size) {
    return obsoleteFontSizes[size] || 10;
  }),
];

let newLines = ['BR', 'P', 'H1', 'H2', 'H3', 'H4', 'H5'];
let isNewLine = {};
newLines.forEach(function(name) {
  isNewLine[name] = true;
});

exports.parse = function(html, classes) {
  let root = html;
  if (typeof root === 'string') {
    root = document.createElement('div');
    root.innerHTML = html;
  }

  var result = [];
  var inSpace = true;
  var cons = per(runs.consolidate()).into(result);
  var emit = function(text, formatting) {
    cons.submit(Object.create(formatting, {
      text: {
        value: text,
      },
    }));
  };
  var dealWithSpaces = function(text, formatting) {
    if (!window.carota.keepHtmlNodeSpaces) {
      text = text.replace(/\n+\s*/g, ' ');
      var fullLength = text.length;
      text = text.replace(/^\s+/, '');
      if (inSpace) {
        inSpace = false;
      } else if (fullLength !== text.length) {
        text = ' ' + text;
      }
      fullLength = text.length;
      text = text.replace(/\s+$/, '');
      if (fullLength !== text.length) {
        inSpace = true;
        text += ' ';
      }
    }
    emit(text, formatting);
  };

  function recurse(node, formatting) {
    if (node.nodeType == 3) {
      dealWithSpaces(node.nodeValue, formatting);
    } else {
      formatting = Object.create(formatting);

      var classNames = node.attributes['class'];
      if (classNames) {
        classNames.value.split(' ').forEach(function(cls) {
          cls = classes[cls];
          if (cls) {
            Object.keys(cls).forEach(function(key) {
              formatting[key] = cls[key];
            });
          }
        });
      }

      handlers.forEach(function(handler) {
        handler(node, formatting);
      });

      if (node.childNodes) {
        for (let n = 0; n < node.childNodes.length; n++) {
          recurse(node.childNodes[n], formatting);
        }
      }
      if (isNewLine[node.nodeName]) {
        emit('\n', formatting);
        inSpace = true;
      }
    }
  }
  recurse(root, {});
  return result;
};
