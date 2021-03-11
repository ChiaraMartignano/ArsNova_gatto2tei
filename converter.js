var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;
var parser = new DOMParser();
var JSON = require('circular-json');

const SCHEMA = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml"
	schematypens="http://purl.oclc.org/dsdl/schematron"?>`

var addSchema = function(TEINode) {
  TEINode.setAttribute('xmlns', 'http://www.tei-c.org/ns/1.0');
}

var moveDate = function(TEINode) {
  var sourceDesc = TEINode.getElementsByTagName('sourceDesc')[0];
  var bibl = sourceDesc.getElementsByTagName('bibl')[0];
  var date = sourceDesc.getElementsByTagName('date')[0];
  var newDate = date.cloneNode(true);
  sourceDesc.removeChild(date);
  bibl.appendChild(newDate);  
}

var addTextElem = function(TEINode) {
  var group = TEINode.getElementsByTagName('group')[0];
  var newGroup = group.cloneNode(true);
  var dom = TEINode.ownerDocument;
  var text = dom.createElement('text');
  text.appendChild(newGroup);
  TEINode.replaceChild(text, group);
}

var replaceLElems = function (TEINode) {
  var lgs = TEINode.getElementsByTagName('lg');
  for (var z = 0; z < lgs.length; z++) {
    var lg = lgs[z];
    var newLg = lg.cloneNode(false);
    var LText = [];
    var i = 0;
    while (i < lg.childNodes.length) {
      if (lg.childNodes[i].tagName === 'lb') {
        newLg.removeChild(lg.childNodes[i]);
      } else if (lg.childNodes[i].tagName === 'l') {
        var newL = TEINode.ownerDocument.createElement('l');
        for (var k = 0; k < LText.length; k++) {
          newL.appendChild(LText[k]);
        }
        newLg.appendChild(newL);
        LText = [];
      } else {
        LText.push(lg.childNodes[i].cloneNode(true));
      }
      i++;
    }
    if (LText.length > 0) {
      var newL = TEINode.ownerDocument.createElement('l');
      for (var k = 0; k < LText.length; k++) {
        newL.appendChild(LText[k]);
      }
      newLg.appendChild(newL);
    }
    lg.parentNode.replaceChild(newLg, lg);
  }
}

var convertToTEI = function(node) {
  var TEI = node.cloneNode(true);
  // Add schema spec
  addSchema(TEI);
  // Move date inside of bibl
  moveDate(TEI);
  // Add text element
  addTextElem(TEI);
  // Replace custom l elements with compliant ones
  replaceLElems(TEI);
  return TEI;
}

var convertFile = function(file) {
  fs.readFile('./input/' + file.name, 'utf8', function(err, data) {
    if (err) { console.log(err); throw err }
    if (data) {
      var dom = parser.parseFromString(data, 'text/xml');
      var text = dom.getElementsByTagName('TEI')[0];
      var tei = convertToTEI(text);
      var fileName = file.name.replace('xmlgat', 'tei');
      fs.writeFile('./output/' + fileName, SCHEMA + tei, function(err) {
        if (err) { throw err }
      })
    }
  })
}

fs.readdir('./input', {encoding: 'utf8', withFileTypes: true}, function(err, files) {
  if (err) { console.log(err); throw err }
  files.map(function(file) {
    convertFile(file);
  })
})