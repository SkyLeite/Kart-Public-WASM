import { Elm } from "../elm/Main";
import { Kart } from "./kart";
import nipplejs from "./nipplejs";
import "../style.css";

const app = Elm.Main.init({ node: document.getElementById("main") });
const kart = new Kart(app);

app.ports.startGame.subscribe(() => {
  kart.init();
  const matchMedia = window.matchMedia || window.msMatchMedia;
  if (!matchMedia("(any-pointer:fine)").matches) makeFakeGamepad();
});
app.ports.listWads.subscribe(() => kart.Command_ListWADS_f());
app.ports.requestFullScreen.subscribe(() => kart.requestFullscreen());
app.ports.addFile.subscribe((message) => {
  // We handle this in JavaScript because serializing 60MBs of
  // binary data in base64 is pretty bad!
  const input = document.createElement("input");
  input.type = "file";
  input.addEventListener("change", (event) => {
    const file = event.target.files[0];
    kart.addFile(file);
  });

  input.click();
});

window.addEventListener("keydown", (e) => {
  if (document.fullscreenElement == null && e.key == "F11") kart.requestFullscreen();
}, true);

function makeFakeGamepad() {
  const sz = 0.7 * Math.min(window.innerWidth, window.innerHeight);

  const joystick = nipplejs.create({
    zone: kart.canvas.parentElement,
    size: sz,
    dataOnly: true
  });
  
  const fakeGamepad = {
    axes: [0, 0, 0, 0],
    buttons: [
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
      {
        pressed: false,
        touched: false,
        value: 0,
      },
    ],
    connected: false,
    id: "Mobile Gamepad by ayunami2000",
    index: 0,
    mapping: "standard",
    timestamp: Date.now() / 1000,
  };

  const origGetGamepads = navigator.getGamepads;

  navigator.getGamepads = function() {
    if (!origGetGamepads) return [ fakeGamepad ];
    const orig = origGetGamepads.call(navigator);
    return [ fakeGamepad, ...orig ];
  };

  
  function connectGamepad() {
    const event = new Event("gamepadconnected");
    fakeGamepad.connected = true;
    fakeGamepad.timestamp = Date.now() / 1000;
    event.gamepad = fakeGamepad;
    window.dispatchEvent(event);
  }
  function disconnectGamepad() {
    const event = new Event("gamepaddisconnected");
    fakeGamepad.connected = false;
    fakeGamepad.timestamp = Date.now() / 1000;
    event.gamepad = fakeGamepad;
    window.dispatchEvent(event);
  }

  joystick.on("start move end", function(evt, data) {
    if (evt.type == "move") data = data.instance;
    else if (evt.type == "end") data.frontPosition.x = data.frontPosition.z = 0;
    fakeGamepad.axes[0] = Math.max(-1, Math.min(1, data.frontPosition.x / (0.6 * 0.5 * sz)));
    fakeGamepad.axes[1] = Math.max(-1, Math.min(1, data.frontPosition.y / (0.6 * 0.5 * sz)));
    fakeGamepad.buttons[5] = Math.floor(Math.abs(data.frontPosition.x) / (0.7 * 0.5 * sz));
    fakeGamepad.timestamp = Date.now() / 1000;
  });

  // i was impatient...
  const aBtn = document.createElement("div");
  aBtn.addEventListener("touchstart", () => {
    fakeGamepad.buttons[0] = 1;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  aBtn.addEventListener("touchend", () => {
    fakeGamepad.buttons[0] = 0;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  aBtn.addEventListener("touchcancel", () => {
    fakeGamepad.buttons[0] = 0;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  aBtn.style.position = "absolute";
  aBtn.style.bottom = "10vmin";
  aBtn.style.right = "10vmin";
  aBtn.style.padding = "0";
  aBtn.style.margin = "0";
  aBtn.style.backgroundColor = "rgba(0,0,0,0.5)";
  aBtn.style.margin = "0";
  aBtn.style.display = "block";
  aBtn.style.width = "15vmin";
  aBtn.style.height = "15vmin";
  aBtn.style.borderRadius = "100vmin";
  document.body.appendChild(aBtn);
  const bBtn = document.createElement("div");
  bBtn.addEventListener("touchstart", () => {
    fakeGamepad.buttons[1] = 1;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  bBtn.addEventListener("touchend", () => {
    fakeGamepad.buttons[1] = 0;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  bBtn.addEventListener("touchcancel", () => {
    fakeGamepad.buttons[1] = 0;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  bBtn.style.position = "absolute";
  bBtn.style.bottom = "30vmin";
  bBtn.style.right = "10vmin";
  bBtn.style.padding = "0";
  bBtn.style.margin = "0";
  bBtn.style.backgroundColor = "rgba(0,0,0,0.5)";
  bBtn.style.margin = "0";
  bBtn.style.display = "block";
  bBtn.style.width = "15vmin";
  bBtn.style.height = "15vmin";
  bBtn.style.borderRadius = "100vmin";
  document.body.appendChild(bBtn);
  const xBtn = document.createElement("div");
  xBtn.addEventListener("touchstart", () => {
    fakeGamepad.buttons[2] = 1;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  xBtn.addEventListener("touchend", () => {
    fakeGamepad.buttons[2] = 0;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  xBtn.addEventListener("touchcancel", () => {
    fakeGamepad.buttons[2] = 0;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  xBtn.style.position = "absolute";
  xBtn.style.bottom = "20vmin";
  xBtn.style.right = "30vmin";
  xBtn.style.padding = "0";
  xBtn.style.margin = "0";
  xBtn.style.backgroundColor = "rgba(0,0,0,0.5)";
  xBtn.style.margin = "0";
  xBtn.style.display = "block";
  xBtn.style.width = "15vmin";
  xBtn.style.height = "15vmin";
  xBtn.style.borderRadius = "100vmin";
  document.body.appendChild(xBtn);
  const yBtn = document.createElement("div");
  yBtn.addEventListener("touchstart", () => {
    fakeGamepad.buttons[3] = 1;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  yBtn.addEventListener("touchend", () => {
    fakeGamepad.buttons[3] = 0;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  yBtn.addEventListener("touchcancel", () => {
    fakeGamepad.buttons[3] = 0;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  yBtn.style.position = "absolute";
  yBtn.style.bottom = "40vmin";
  yBtn.style.right = "30vmin";
  yBtn.style.padding = "0";
  yBtn.style.margin = "0";
  yBtn.style.backgroundColor = "rgba(0,0,0,0.5)";
  yBtn.style.margin = "0";
  yBtn.style.display = "block";
  yBtn.style.width = "15vmin";
  yBtn.style.height = "15vmin";
  yBtn.style.borderRadius = "100vmin";
  document.body.appendChild(yBtn);
  document.body.appendChild(xBtn);
  const sBtn = document.createElement("div");
  sBtn.addEventListener("touchstart", () => {
    fakeGamepad.buttons[9] = 1;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  sBtn.addEventListener("touchend", () => {
    fakeGamepad.buttons[9] = 0;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  sBtn.addEventListener("touchcancel", () => {
    fakeGamepad.buttons[9] = 0;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  sBtn.style.position = "absolute";
  sBtn.style.bottom = "60vmin";
  sBtn.style.right = "30vmin";
  sBtn.style.padding = "0";
  sBtn.style.margin = "0";
  sBtn.style.backgroundColor = "rgba(0,0,0,0.5)";
  sBtn.style.margin = "0";
  sBtn.style.display = "block";
  sBtn.style.width = "15vmin";
  sBtn.style.height = "15vmin";
  sBtn.style.borderRadius = "100vmin";
  document.body.appendChild(sBtn);
  const lBtn = document.createElement("div");
  lBtn.addEventListener("touchstart", () => {
    fakeGamepad.buttons[4] = 1;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  lBtn.addEventListener("touchend", () => {
    fakeGamepad.buttons[4] = 0;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  lBtn.addEventListener("touchcancel", () => {
    fakeGamepad.buttons[4] = 0;
    fakeGamepad.timestamp = Date.now() / 1000;
  }, true);
  lBtn.style.position = "absolute";
  lBtn.style.bottom = "50vmin";
  lBtn.style.right = "10vmin";
  lBtn.style.padding = "0";
  lBtn.style.margin = "0";
  lBtn.style.backgroundColor = "rgba(0,0,0,0.5)";
  lBtn.style.margin = "0";
  lBtn.style.display = "block";
  lBtn.style.width = "15vmin";
  lBtn.style.height = "15vmin";
  lBtn.style.borderRadius = "100vmin";
  document.body.appendChild(lBtn);
  
  connectGamepad();
}