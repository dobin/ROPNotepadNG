var diagramScale = 8;
var minScale = diagramScale;
var diagramUpscaled = 0;
var foregroundColour = "#000000";
var backgroundColour = "#e5e5e5";
var diagramRe = new RegExp("(<d>[^]+?</d>\n?)", "mg");
var tagsRe = new RegExp("(<d>\n?|</d>\n?)", "g");

var fontArray = [
   {'buttonTag':'Menlo', 'fontID':'menloregular', 'colour':0, 'scale':0},
   {'buttonTag':'Monaco', 'fontID':'monacoregular', 'colour':0, 'scale':0},
   {'buttonTag':'Droid', 'fontID':'droid_sans_monoregular', 'colour':0, 'scale':0},
   {'buttonTag':'Input', 'fontID':'input_monoregular', 'colour':0, 'scale':0},
   {'buttonTag':'PC-DOS', 'fontID':'pcdosregular', 'colour':1, 'scale':-1},
   {'buttonTag':'TRS80', 'fontID':'trash_eightiesregular', 'colour':2, 'scale':2},
   {'buttonTag':'C64', 'fontID':'c64_pro_monoregular', 'colour':2, 'scale':4},
   {'buttonTag':'NES', 'fontID':'press_start_kregular', 'colour':2, 'scale':5},
   {'buttonTag':'Donkey Kong', 'fontID':'kongtextregular', 'colour':2, 'scale':4}
];

var URL = window.location.pathname;
var URLfilename = URL.substring(URL.lastIndexOf('/') + 1);
var notepadWriter = (URLfilename == "notepad.php") ? true : false;

function loadFontButtons(rop) {
   var placement = document.getElementById("fonts");
   for(i = 0; i < fontArray.length; i++) {
      var input = document.createElement("input");
      input.type = "button";
      input.className = "btn";
      input.id = fontArray[i].fontID;
      input.value = fontArray[i].buttonTag;
      input.setAttribute("scaleFactor", fontArray[i].scale);

      if(rop) {
         input.onclick = function() {ropChangeFont(this);}
      }
      else {
         input.onclick = function() {changeFont(this);}
      }
      placement.appendChild(input);
   }
}

function changeFont(obj) {
   var textarea = document.getElementById('contents');
   textarea.style.fontFamily = obj.id;

   var retro = 0;
   for(i = 0; i < fontArray.length; i++) {
      if(fontArray[i].fontID == obj.id) {
         retro = fontArray[i].colour;
         break;
      }
   }

   switch(retro) {
      case 1:
         //textarea.style.color = "#007CCF";
         foregroundColour = "#32cd32";
         backgroundColour = "#000000";
         textarea.style.borderColor = "#008000";
         break;
      case 2:
         foregroundColour = "#D6EBFF";
         //textarea.style.color = "#32cd32";
         backgroundColour = "#000000";
         textarea.style.borderColor = "#008000";
         break;
      default:
         foregroundColour = "#000000";
         backgroundColour = "#e5e5e5";
         textarea.style.borderColor = "#808080";
   }

   // see if the font requires diagrams to be upscaled (e.g. TRS-80)
   // if so, then set the diagramUpscaled flag and redraw the
   // contents
   var scaleFactor = obj.getAttribute("scaleFactor");
   if(scaleFactor != diagramUpscaled) {
      var delta = scaleFactor - diagramUpscaled;
      diagramUpscaled = scaleFactor;
      diagramScale += delta;
   }
   processMarkdeep(textarea);
}

function processMarkdeep(container) {

   if(!notepadWriter) {
      var blocks = lastResponseText.split(diagramRe);

      for(var i = 0; i < blocks.length; i++) {
         if(blocks[i].match("<d>")) {
            blocks[i] = markdeep.formatDiagram(blocks[i].replace(tagsRe, ""), "left", diagramScale);
         }
         else {
            blocks[i] = blocks[i].replace(/</g, "&lt;").replace(/>/g, "&gt;");
         }
      }
      container.innerHTML = blocks.join("");
   }

   container.style.color = foregroundColour;
   container.style.background = backgroundColour;

   if(!notepadWriter) {
      changeDiagramColour();
   }
}

function changeDiagramColour() {
   var texts = document.getElementsByTagName("text");
   var paths = document.getElementsByTagName("path");
   var circles = document.getElementsByTagName("circle");
   //var rects = document.getElementsByTagName("rect");
   var polygons = document.getElementsByTagName("polygon");

   for(var i = 0; i < texts.length; i++) {
      texts[i].style.fill = foregroundColour;
   }
   for(var i = 0; i < paths.length; i++) {
      paths[i].style.stroke = foregroundColour;
   }
   for(var i = 0; i < polygons.length; i++) {
      polygons[i].style.fill = foregroundColour;
   }
   for(var i = 0; i < circles.length; i++) {
      var circleColour = (circles[i].style.fill).replace(/[rgba ()]/g, "");
      if(circleColour != "0,0,0" && circles[i].getAttribute("cfill") != "foreground") {
         circles[i].setAttribute("cfill", "background");
         circles[i].style.fill = backgroundColour;
         circles[i].style.stroke = foregroundColour;
      }
      else {
         circles[i].setAttribute("cfill", "foreground");
         circles[i].style.fill = foregroundColour;
         circles[i].style.stroke = foregroundColour;
      }
   }
}

function ropChangeFont(obj) {
   var family = obj.id;

   var modifyElements = new Array();
   var inputElements = document.getElementsByTagName('input');
   for(i = 0; i < inputElements.length; i++) {
      if(inputElements[i].type == "text") {
         modifyElements.push(inputElements[i]);
      }
   }
   var spanElements = document.getElementsByClassName('mono');
   for(i = 0; i < spanElements.length; i++) {
      modifyElements.push(spanElements[i]);
   }
   var textarea = document.getElementById('rop_output');
   modifyElements.push(textarea);

   for(i = 0; i < modifyElements.length; i++) {
      var element = modifyElements[i];
      element.style.fontFamily = family;
   }
}

function setInitFontSize(px) {
   contents = document.getElementById("contents");
   contents.style.fontSize = parseFloat(px) + 0.0 + "px";
}

function increaseFontSize() {
   contents = document.getElementById("contents");
   contents.style.fontSize = parseFloat(contents.style.fontSize.replace(/px/, "")) + 1.0 + "px";
   diagramScale += 1;
   processMarkdeep(contents);
}

function decreaseFontSize() {
   contents = document.getElementById("contents");
   if(diagramScale >= minScale + 1) {
      contents.style.fontSize = parseFloat(contents.style.fontSize.replace(/px/, "")) - 1.0 + "px";
      diagramScale -= 1;
      processMarkdeep(contents);
   }
}

