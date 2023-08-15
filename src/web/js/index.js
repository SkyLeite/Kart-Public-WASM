import { Elm } from "../elm/Main";
import { Kart } from "./kart";
import "./polyfillReadableStreamAsyncIterator";
import "../style.css";

const app = Elm.Main.init({ node: document.getElementById("main") });
const kart = new Kart(app);

app.ports.startGame.subscribe(kart.init);
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