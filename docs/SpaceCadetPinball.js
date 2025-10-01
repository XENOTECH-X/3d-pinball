var Module = {
  preRun: [],
  postRun: [],
  print: text => console.log(text),
  printErr: text => console.error(text),
  canvas: (function() {
    var e = document.getElementById("canvas");
    e.addEventListener("webglcontextlost", function(ev) {
      alert("WebGL context lost. You will need to reload the page.");
      ev.preventDefault();
    }, false);
    return e;
  })(),
  setStatus: function(text) {
    console.log("STATUS:", text);
  }
};

// ✅ Force relative paths for GitHub Pages
var wasmBinaryFile = "./SpaceCadetPinball.wasm";
var dataFile       = "./SpaceCadetPinball.data";

// Load .wasm manually with fallback
function loadWasm(imports) {
  if (WebAssembly.instantiateStreaming) {
    return WebAssembly.instantiateStreaming(fetch(wasmBinaryFile), imports)
      .catch(err => {
        console.warn("Streaming failed, falling back:", err);
        return fetch(wasmBinaryFile)
          .then(r => r.arrayBuffer())
          .then(bytes => WebAssembly.instantiate(bytes, imports));
      });
  } else {
    return fetch(wasmBinaryFile)
      .then(r => r.arrayBuffer())
      .then(bytes => WebAssembly.instantiate(bytes, imports));
  }
}

// Kick off the game
fetch(dataFile)
  .then(r => {
    if (!r.ok) throw new Error("Failed to load .data file: " + r.status);
    return r.arrayBuffer();
  })
  .then(dataBytes => {
    console.log("Data file loaded:", dataFile, dataBytes.byteLength, "bytes");

    // Minimal import object (you may need to expand depending on original build)
    let imports = { env: { abort: console.error } };

    return loadWasm(imports);
  })
  .then(result => {
    Module.instance = result.instance;
    console.log("WASM loaded successfully!");
    // You may need to call a start function depending on the Emscripten export
    if (Module.instance.exports._main) {
      Module.instance.exports._main();
    }
  })
  .catch(err => {
    console.error("Failed to initialize game:", err);
  });
