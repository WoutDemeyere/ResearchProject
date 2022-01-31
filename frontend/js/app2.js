const socket = io(`http://192.168.0.129:5050`);
let myp5;

var mainContainer, windowLeft, windowUp, windowRight, windowDown, mainCanvas;
var menuItemHeight, menuItemMargin, colorPicker;
var toast;
var colorPicker, hueSlider, satSlider, lumSlider;

const eventLeft = new Event('left');
const eventRight = new Event('right');
const eventUp = new Event('up');
const eventDown = new Event('down');
const eventPush = new Event('push');
const eventShake = new Event('shake');
const eventGyro = new Event('gyro');
const eventRotation = new Event('rotation');

var root = document.querySelector(':root');


const showToast = (message) => {
        toast.classList.add("c-toast-container-reveal");
        toast.innerHTML = message;
        setTimeout(function() {toast.classList.remove("c-toast-container-reveal");}, 750);
} 

const moveCarousell = (parent, dir, selectedClass) => {
        container = parent.querySelector(".c-v-menu-container");
        moveSelected(container, dir, selectedClass);

        container.style.top ? prev_top = parseInt(container.style.top) : prev_top = 0;
        temp = prev_top - (menuItemHeight + menuItemMargin * 2) * dir;
        container.style.top = temp.toString() + 'px';
}

const moveSelected = (container, dir, selectedClass) => {
        children = container.children;

        for (let i = 0; i < children.length; i++) {
                child = children[i];
                if (child.classList.contains(selectedClass)) {
                        if (children[i + dir]) {
                                children[i + dir].classList.add(selectedClass);
                                child.classList.remove(selectedClass);
                        }
                        return;
                }
        }
}

const moveGrid = (container, dir, selectedClass) => {
        children = container.children;

        for (let i = 0; i < children.length; i++) {
                child = children[i];
                if (child.classList.contains(selectedClass)) {
                        // if (children[i + dir]) {
                                children[i + dir].classList.add(selectedClass);
                                child.classList.remove(selectedClass);
                        // }
                        return;
                }
        }
}

const listenToSocket = function () {
        socket.on("connected", function () {
                console.log("Verbonden met de socekt");
        });

        socket.on("B2F_new_gesture", function (jsonObject) {
                console.log(`New movement detected: ${jsonObject.data}`);

                jsonObject.data=="norm"?{}:showToast(`Gesture: ${jsonObject.data}`);

                currentSelected = document.querySelector(".js-main-focus");
                // console.log(currentSelected)

                switch (jsonObject.data) {
                        case "left":
                                currentSelected.dispatchEvent(eventLeft);
                                break;
                        case "right":
                                currentSelected.dispatchEvent(eventRight);
                                break;
                        case "up":
                                currentSelected.dispatchEvent(eventUp);
                                break;
                        case "down":
                                currentSelected.dispatchEvent(eventDown);
                                break;
                        case "push":
                                currentSelected.dispatchEvent(eventPush);
                                break;
                        case "shake":
                                currentSelected.dispatchEvent(eventShake);
                                break;
                }
        });

        socket.on("B2F_gyro", function (jsonObject) {
                currentSelected = document.querySelector(".js-main-focus");
                currentSelected.dispatchEvent(eventGyro);
                gyroArr = jsonObject.data;
        });

        socket.on("B2F_rotation", function (jsonObject) {
                currentSelected = document.querySelector(".js-main-focus");
                currentSelected.dispatchEvent(eventRotation);
                rotationArr = jsonObject.data;
                // console.log(rotationArr)
        });
}

const addSelectedClass = (newSelected, oldSelected) => {
        newSelected.classList.add("js-main-focus");
        oldSelected.classList.remove("js-main-focus");
}

const addEventListenersMain = () => {
        mainContainer.addEventListener('left', function (e) {
                windowRight.classList.remove("c-close-window-h");
                addSelectedClass(windowRight, mainContainer);
        });

        mainContainer.addEventListener('right', function (e) {
                windowLeft.classList.remove("c-close-window-h");
                addSelectedClass(windowLeft, mainContainer);
        });
}

const addEventListenersWindowLeft = () => {
        windowLeft.addEventListener('left', function (e) {
                windowLeft.classList.add("c-close-window-h");
                addSelectedClass(mainContainer, windowLeft)
        });

        windowLeft.addEventListener('up', function (e) {
                moveCarousell(windowLeft, -1, "c-menu-item-selected");
                selectedObject = windowLeft.querySelector(".c-menu-item-selected").id;
        });

        windowLeft.addEventListener('down', function (e) {
                moveCarousell(windowLeft, 1, "c-menu-item-selected");
                selectedObject = windowLeft.querySelector(".c-menu-item-selected").id;
        });
}

const addEventListenersWindowRight = () => {
        let menuSelectedClass = "c-menu-item-selected"
        windowRight.addEventListener('right', function (e) {
                windowRight.classList.add("c-close-window-h");
                addSelectedClass(mainContainer, windowRight)
        });

        windowRight.addEventListener('up', function (e) {
                moveCarousell(windowRight, -1, menuSelectedClass);
        });

        windowRight.addEventListener('down', function (e) {
                moveCarousell(windowRight, 1, menuSelectedClass);
        });

        windowRight.addEventListener('push', function (e) {
                selectedItem = windowRight.querySelector("." + menuSelectedClass);
                selectedItem.classList.add("c-menu-item-selected-active");

                addSelectedClass(selectedItem, windowRight)
                addEventListenersMenuItem(selectedItem, windowRight);
        });
}

const addEventListenersMenuItem = (selectedItem, parentWindow) => {
        let sliderSelectedClass = "c-slider-focus"
        let gridSelectedClass = "c-grid-item-focus"

        sliders = selectedItem.children[0].classList.contains('js-slider-container');
        grid = selectedItem.children[0].classList.contains('js-texture-picker');

        selectedItem.addEventListener('up', function (e) {
                sliders ? moveSelected(selectedItem.querySelector(".js-slider-container"), -1, sliderSelectedClass) : {};
                grid ? moveGrid(selectedItem.querySelector(".js-grid-container"), -3, gridSelectedClass) : {};
        });

        selectedItem.addEventListener('down', function (e) {
                sliders ? moveSelected(selectedItem.querySelector(".js-slider-container"), 1, sliderSelectedClass) : {};
                grid ? moveGrid(selectedItem.querySelector(".js-grid-container"), 3, gridSelectedClass) : {};
        });

        selectedItem.addEventListener('left', function (e) {
                console.log(grid)
                grid ? moveGrid(selectedItem.querySelector(".js-grid-container"), -1, gridSelectedClass) : {};
        });

        selectedItem.addEventListener('right', function (e) {
                grid ? moveGrid(selectedItem.querySelector(".js-grid-container"), 1, gridSelectedClass) : {};
        });

        selectedItem.addEventListener('push', function (e) {
                console.log(selectedItem)

                switch(selectedItem.children[0].id) {
                        case "textures":
                                selectedGridItem = selectedItem.querySelector("." + gridSelectedClass);
                                textureName = selectedGridItem.id;
                                break;
                        case "color":
                                textureName = "color";
                                selectedSlider = selectedItem.querySelector("." + sliderSelectedClass);
                                addSelectedClass(selectedSlider, selectedItem)
                                addEventListenersSliderItem(selectedSlider, selectedItem);
                                break;

                        case "rotation":
                                selectedGridItem = selectedItem.querySelector("." + gridSelectedClass);
                                orientationMode = selectedGridItem.id;
                                break;

                        case "size":       
                                selectedSlider = selectedItem.querySelector("." + sliderSelectedClass);
                                addSelectedClass(selectedSlider, selectedItem)
                                addEventListenersSliderItem(selectedSlider, selectedItem);
                                break;  
                }

        });

        selectedItem.addEventListener('shake', function (e) {
                selectedItem.classList.remove("c-menu-item-selected-active");
                addSelectedClass(parentWindow, selectedItem);
        });
}

const addEventListenersSliderItem = (selectedSliderContainer, selecteMenudItem) => {
        selectedSliderContainer.classList.add("c-slider-active");
        selectedSlider = selectedSliderContainer.querySelector(".js-slider");

        treshold = 0.5;

        addSelectedClass(selectedSlider, selectedSliderContainer);

        count = 0;
        console.log(selectedSlider)
        selectedSlider.addEventListener('gyro', function (e) {
                temp = parseInt(selectedSlider.value) - gyroArr[0] * 1
                selectedSlider.value = temp;
                

                if (selectedSliderContainer.classList.contains("js-slider-color")) {
                        colorType = selectedSlider.id;
                        objectColor[colorType] = parseInt(selectedSlider.value);

                        colorType == "hue" ? root.style.setProperty(`--slider-${colorType}`, selectedSlider.value) : root.style.setProperty(`--slider-${colorType}`, selectedSlider.value + "%");

                } else if (selectedSliderContainer.classList.contains("js-slider-size")) {
                        selectedSliderContainer.querySelector(".c-slider-text").innerHTML = "size: " + objectSize
                        objectSize = parseInt(selectedSlider.value);
                        root.style.setProperty(`--slider-size`, parseInt(selectedSlider.value) / 10 + "%")
                }

                Math.abs(gyroArr[0]) < treshold ? count++ : count = 0;

                if (count >= 60) {
                        selectedSliderContainer.classList.remove('c-slider-active');
                        selectedSliderContainer.classList.add('c-slider-focus');
                        addSelectedClass(selecteMenudItem, selectedSlider);
                }

        });
}

const getDomElements = () => {
        mainContainer = document.querySelector(".js-container");
        addEventListenersMain();

        windowLeft = document.querySelector(".js-window-left");
        addEventListenersWindowLeft();

        windowRight = document.querySelector(".js-window-right");
        addEventListenersWindowRight();

        mainCanvas = document.querySelector(".js-main-canvas");

        toast = document.querySelector(".js-toast");

        menuItemHeight = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--menu-item-height'));
        menuItemMargin = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--menu-item-margin'));

        hueSlider = document.querySelector(".js-hue-slider");
        satSlider = document.querySelector(".js-sat-slider");
        lumSlider = document.querySelector(".js-lum-slider");

        root.style.setProperty(`--slider-hue`, parseInt(hueSlider.value))
        root.style.setProperty(`--slider-sat`, parseInt(satSlider.value) + "%")
        root.style.setProperty(`--slider-lum`, parseInt(lumSlider.value) + "%")

        objectColor.hue = parseInt(hueSlider.value);
        objectColor.sat = parseInt(satSlider.value);
        objectColor.lum = parseInt(lumSlider.value);

        document.querySelector(".c-slider-text").innerHTML = "size: " + objectSize
}


const init = () => {
        console.log("Script loaded!");
        getDomElements();

        listenToSocket();
        // runMenuRight();
        myp5 = new p5(sketch)
};

document.addEventListener("DOMContentLoaded", init);