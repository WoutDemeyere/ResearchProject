// const socket = io(`http://${window.location.hostname}:5050`);
const socket = io(`http://192.168.0.129:5050`);
let myp5;
var mainContainer, windowLeft, windowUp, windowRight, windowDown, mainCanvas;
var menuItemHeight, menuItemMargin, colorPicker;

var selectedElement, selectedSlider;

var root = document.querySelector(':root');

const listenToSocket = function () {
  socket.on("connected", function () {
    console.log("Verbonden met de socekt");
  });

  socket.on("B2F_new_gesture", function (jsonObject) {
    console.log(`New movement detected: ${jsonObject.data}`);

    if (jsonObject.data == "left") {
      !windowLeft.classList.contains("c-close-window-h") ?
        windowLeft.classList.add("c-close-window-h") :
        windowRight.classList.remove("c-close-window-h");
    }

    if (jsonObject.data == "right") {
      !windowRight.classList.contains("c-close-window-h") ?
        windowRight.classList.add("c-close-window-h") :
        windowLeft.classList.remove("c-close-window-h");
    }

    if (jsonObject.data == "up") {

      // !windowUp.classList.contains("c-close-window-v") ?
      //   windowUp.classList.add("c-close-window-v") :
      //   windowDown.classList.remove("c-close-window-v");

      if (!windowRight.classList.contains("c-close-window-h")) {
        moveCarousell(windowRight, -1, "c-menu-item-selected")
      } else {
        moveCarousell(windowLeft, -1, "c-menu-item-selected")
      }
    }

    if (jsonObject.data == "down") {


      // !windowDown.classList.contains("c-close-window-v") ?
      //   windowDown.classList.add("c-close-window-v") :
      //   windowUp.classList.remove("c-close-window-v");

      if (!windowRight.classList.contains("c-close-window-h")) {
        moveCarousell(windowRight, 1, "c-menu-item-selected")
      } else {
        moveCarousell(windowLeft, 1, "c-menu-item-selected")
      }
    }

    if (jsonObject.data == "push") {
      selectCurrent();
    }

    if (jsonObject.data == "shake") {
      mainContainer.style.backgroundColor =
        "rgb(" +
        Math.random() * 255 +
        "," +
        Math.random() * 255 +
        "," +
        Math.random() * 255 +
        ")";

    }
  });

  socket.on("B2F_rotation", function (jsonObject) {
    orientationArr = jsonObject.data;
  });

  socket.on("B2F_gyro", function (jsonObject) {

    if (selectedElement) {
      if (selectedElement.classList.contains("c-slider-active")) {
        selectedSlider = selectedElement.querySelector(".c-slider");

        gyroArr = jsonObject.data;
        temp = parseInt(selectedSlider.value) - gyroArr[0] * 1

        selectedSlider.value = temp;
        color[selectedSlider.id] = parseInt(selectedSlider.value);
      }
    }

  });
};

const selectCurrent = () => {
  console.log(selectedElement)
  selectedElement.classList.add("c-slider-active")
  selectedElement.classList.remove("c-slider-focus")
}

const runMenuRight = (dir) => {
  runMenuRightHueSliders(-1)
}

const runMenuRightHueSliders = (dir) => {
  colorPicker = document.querySelector(".js-color-picker");
  sliderHue = document.querySelector(".js-hue-slider");
  sliderSat = document.querySelector(".js-sat-slider");
  sliderLum = document.querySelector(".js-lum-slider");


  if (colorPicker.parentElement.classList.contains("c-menu-item-selected")) {
    moveSelected(colorPicker, dir, "c-slider-focus");
  }
}


const loadMenuRightElements = () => {
  sliderHue.oninput = () => {
    root.style.setProperty('--slider-hue', sliderHue.value);
    color.hue = sliderHue.value;
  }

  sliderSat.oninput = () => {
    root.style.setProperty('--slider-sat', sliderSat.value + '%');
    color.sat = parseInt(sliderSat.value);
  }

  sliderLum.oninput = () => {
    root.style.setProperty('--slider-lum', sliderLum.value + '%');
    color.lum = parseInt(sliderLum.value);
  }
}

const moveCarousell = (parent, dir, selectedClass) => {
  container = parent.querySelector(".c-v-menu-container");
  moveSelected(container, dir, selectedClass)
  container.style.top ? prev_top = parseInt(container.style.top) : prev_top = 0;
  temp = prev_top - (menuItemHeight + menuItemMargin * 2) * dir;
  container.style.top = temp.toString() + 'px';
  console.log(container.style.top);
}

const moveSelected = (container, dir, selectedClass) => {
  Array.from(container.children).some(child => {
    if (child.classList.contains(selectedClass)) {

      if (dir == -1) {
        child.previousElementSibling.classList.add(selectedClass);
        selectedObject = child.previousElementSibling.id;

        selectedElement = child.previousElementSibling;
      } else {
        child.nextElementSibling.classList.add(selectedClass)
        selectedObject = child.nextElementSibling.id;
        selectedElement = child.nextElementSibling;
      }
      child.classList.remove(selectedClass);
      return child;
    }
  });
}

document.onkeydown = function (e) {
  var key_code = e.key.charCodeAt(0);
  console.log(key_code)

  if (key_code == 97) {
    runMenuRightHueSliders(-1)
    // moveCarousell(windowRight, -1, "c-menu-item-selected")
  }

  if (key_code == 122) {
    runMenuRightHueSliders(1)
    // moveCarousell(windowRight, 1, "c-menu-item-selected")
  }

  if (key_code == 101) {
    selectCurrent();
    // moveCarousell(windowRight, 1, "c-menu-item-selected")
  }
}

const getDomElements = () => {
  mainContainer = document.querySelector(".js-container");
  windowLeft = document.querySelector(".js-window-left");
  windowUp = document.querySelector(".js-window-up");
  windowRight = document.querySelector(".js-window-right");
  windowDown = document.querySelector(".js-window-down");
  mainCanvas = document.querySelector(".js-main-canvas");

  menuItemHeight = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--menu-item-height'));
  menuItemMargin = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--menu-item-margin'));

  color.hue = document.querySelector(".js-hue-slider").value;
  color.sat = document.querySelector(".js-sat-slider").value;
  color.lum = document.querySelector(".js-lum-slider").value;
}

const init = () => {
  console.log("Script loaded!");
  getDomElements();
  listenToSocket();
  // runMenuRight();
  new p5(sketch)
};

document.addEventListener("DOMContentLoaded", init);