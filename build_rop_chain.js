var nextAddress = 0x08082020;
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
   var outputRows = document.getElementById("output").childNodes;
   var i;

   rows = outputRows.length;
   nextAddress = parseInt(document.getElementById("start_address").value);

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

   nextAddress = parseInt(this.value);

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
   divStartAddress.value = toHex(nextAddress);
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
  var i=0;

  /* convert UI data to a data structure */
  var divOutput = document.getElementById("output");
  var divNodes = divOutput.childNodes;
  for(i = 0; i < divNodes.length; i++) {
    var address = divNodes[i].childNodes[0].innerHTML;
    var content = divNodes[i].childNodes[1].value;
    var comment = divNodes[i].childNodes[2].value;

    var line = {
      address: address,
      content: content,
      comment: comment,
    }

    ropLines.push(line);
  }


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
