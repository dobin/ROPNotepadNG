var varName = "ropchain";
var payloadString = "";
var rows = 0;

function toHex(x) {
   var hex = x.toString(16);
   while(hex.length < 8) {
      hex = "0" + hex;
   }
   hex = "0x" + hex;
   return(hex);
}

function makeNewRow() {
   rows++;

   var address = document.createElement("span");
   address.className = "grid_2 mono";
   address.setAttribute("name", "address");

   var inputContent = document.createElement("input");
   inputContent.setAttribute("name", "content");
   inputContent.type = "text";
   inputContent.className = "grid_2 rop";
   inputContent.onchange = validateHex;

   var inputComment = document.createElement("input");
   inputComment.setAttribute("name", "comment");
   inputComment.type = "text";
   inputComment.className = "grid_4 rop";
   inputComment.onchange = generateJs;

   var inputDescription = document.createElement("input");
   inputDescription.setAttribute("name", "description");
   inputDescription.type = "text";
   inputDescription.className = "grid_2 rop";
   inputDescription.onchange = generateJs;


   var insertRow = document.createElement("input");
   insertRow.type = "button";
   insertRow.className = "grid_1 btn";
   insertRow.value = "+";
   insertRow.onclick = insertRowBelow;

   var deleteRow = document.createElement("input");
   deleteRow.type = "button";
   deleteRow.className = "grid_1 btn";
   deleteRow.value = "-";
   deleteRow.onclick = deleteThisRow;

   var row = document.createElement("div");
   row.className = "grid_12";
   row.id = rows;

   row.appendChild(address);
   row.appendChild(inputContent);
   row.appendChild(inputComment);
   row.appendChild(inputDescription);
   row.appendChild(insertRow);
   row.appendChild(deleteRow);

   return(row);
}

function appendRow() {
   var divOutput = document.getElementById("output");

   var row = makeNewRow();
   divOutput.appendChild(row);
   recalcRows();
}

function recalcRows() {
  var nextAddress = parseInt(document.getElementById("start_address").value);

  var outputRows = document.getElementById("output").childNodes;
  var i;
  rows = outputRows.length;

  for(i = 0; i < rows; i++) {
     outputRows[i].id = i + 1;
     outputRows[i].children.address.textContent = toHex(nextAddress);
     nextAddress += 4;
  }

  generateJs();
}


function deleteThisRow() {
   var containingRow = this.parentNode;
   containingRow.remove();
   recalcRows();
}

function insertRowBelow() {
   var containingRow = this.parentNode;
   var newRow = makeNewRow();
   var output = document.getElementById("output");
   output.insertBefore(newRow, containingRow.nextSibling);
   recalcRows();
}

function validateHex() {
   var myValue = this.value;

   if(!isNaN(parseInt(myValue))) {
      if(myValue.substr(0, 2).toLowerCase() == "0x") {
         myValue = myValue.substr(2);
      }
      myValue = toHex(myValue);
   }
   this.value = myValue;

   generateJs();
}

function recalcAddresses() {
   var myValue = this.value;
   if(myValue.substr(0, 2).toLowerCase() == "0x") {
      myValue = myValue.substr(2);
   }
   myValue = toHex(myValue);
   this.value = myValue;

   realRecalcAddresses(this.value);
}

function realRecalcAddresses(addr) {
   var nextAddress = parseInt(addr);

   var divOutput = document.getElementById("output");
   divNodes = divOutput.childNodes;
   for(i = 0; i < divNodes.length; i++) {
      var address = divNodes[i].childNodes[0];
      address.innerHTML = toHex(nextAddress);
      nextAddress += 4;
   }
}


function init() {
   loadFontButtons(true);
   divStartAddress = document.getElementById("start_address");
   divStartAddress.value = toHex(0x08082020);
   divStartAddress.onchange = recalcAddresses;

   //generateJs();

   var i;
   for(i = 0; i < 10; i++) {
      appendRow();
   }
}


function generateJs() {
  var outputType;

  var ropLines = [];
  ropLines = parseUiData();

  /* generate output based on data structure */
  var payloadString;
  if (document.getElementById("ropOutputString").checked == true) {
    outputType = "string";
    payloadString = generateJsString(ropLines);
  } else {
    outputType = "array";
    payloadString = generateJsArray(ropLines);
  }

  var ropOutput = document.getElementById("rop_output");
  ropOutput.value = payloadString;
}



function generateJsString(ropLines) {
     payloadString = "function packv(n) { // integer to 32-bit DWORD\r\n";
     payloadString += "   var s = new Number(n).toString(16);\r\n";
     payloadString += "   while(s.length < 8) s = \"0\" + s;\r\n";
     payloadString += "   return(unescape(\"%u\" + s.substring(4,8) + \"%u\" + s.substring(0,4)));\r\n";
     payloadString += "}\r\n\r\n";

     payloadString += "var " + varName + " = \"\";\r\n\r\n";


      for(i=0; i<ropLines.length; i++) {
        var address = ropLines[i].address;
        var content = ropLines[i].content;
        var comment = ropLines[i].comment;

        if(content == "") {
           break;
        }

        var value = parseInt(content);
        var padding = " "; // padding for comments

        if(!isNaN(value)) {
           content = "packv(" + toHex(value) + ")";
        }
        else {
           while((content + padding).length < 18) {
              padding += " ";
           }
        }
        payloadString += varName + " += " + content + ";" +
                         padding + "// " + address + ": " +
                         comment + "\n";
     }


     return payloadString;


}


function generateJsArray(ropLines) {
  var payloadString = "var " + varName + " = [];\r\n\r\n"
  var i = 0;

  for(i = 0; i < ropLines.length; i++) {
    var address = ropLines[i].address;
    var content = ropLines[i].content;
    var comment = ropLines[i].comment;

    if(content == "") {
       break;
    }

    var value = parseInt(content);
    var padding = " "; // padding for comments

    if(!isNaN(value)) {
       content = toHex(value);
    } else {
       while((content + padding).length < 18) {
          padding += " ";
       }
    }

    payloadString += varName + ".push(" + content + ")" +
                     padding + "// " + address + ": " +
                     comment + "\n";
  }

  return payloadString;
}


function parseUiData() {
  var ropLines = [];
  var i=0;

  /* convert UI data to a data structure */
  var divOutput = document.getElementById("output");
  var divNodes = divOutput.childNodes;
  for(i = 0; i < divNodes.length; i++) {
    var address = divNodes[i].childNodes[0].innerHTML;
    var content = divNodes[i].childNodes[1].value;
    var comment = divNodes[i].childNodes[2].value;
    var description = divNodes[i].childNodes[3].value;

    var line = {
      address: address,
      content: content,
      comment: comment,
      description: description,
    }

    ropLines.push(line);
  }

  return ropLines;
}


function exportData() {
  var ropLines = parseUiData();
  var baseAddr = parseInt(document.getElementById("start_address").value);

  var data = {
    baseAddr: baseAddr,
    ropLines: ropLines,
  }
  data = JSON.stringify(data);
  data = btoa(data);
  prompt("Data", data);
}


function importData() {
  var data = prompt("Data");
  data = atob(data);

  if (data.length <= 4) {
    return;
  }

  data = JSON.parse(data);

  var divOutput = document.getElementById("output");
  var divNodes = divOutput.childNodes;

  while (divNodes.length < data.length) {
    appendRow();
  }

  var n;
  for(n = 0; n < data.ropLines.length; n++) {
    // do not write addresses, it will get recalculated below
    //divNodes[i].childNodes[0].innerHTML = data[n].address;
    divNodes[n].childNodes[1].value = data.ropLines[n].content;
    divNodes[n].childNodes[2].value = data.ropLines[n].comment;
    divNodes[n].childNodes[3].value = data.ropLines[n].description;
  }

  // set baseAddr
  divStartAddress = document.getElementById("start_address");
  divStartAddress.value = toHex(data.baseAddr);
  realRecalcAddresses(data.baseAddr);
}
