addEventListener("load", async (event) => {
  restoreInputsFromCookies();
  applyAllInput();
  move();
});

document
  .getElementById("captureAll")
  .addEventListener("click", async function () {
    document.querySelectorAll(".balloon").forEach((el) => {
      capture(el);
    });
  });

document.getElementById("capture").addEventListener("click", async function () {
  capture(document.querySelector(".selected"));
});

// Function to update CSS variable
function updateCSSVariable(varName, value, obj) {
  if (obj) obj.style.setProperty(varName, value);
  else {
    document.querySelector(".selected")?.style.setProperty(varName, value);
  }
}

// Attach event listeners to inputs/selects with data-css-var attribute
document
  .querySelectorAll("input[data-css-var], select[data-css-var]")
  .forEach((el) => {
    el.addEventListener("wheel", (event) => {
      if (el.type != "number") return;
      if (event.deltaY < 0) {
        if (el.min && (el.value = parseFloat(el.value) + 1) > el.min) {
          el.value = parseFloat(el.value) + 1;
        }
      }
      if (event.deltaY > 0) {
        if (el.max && (el.value = parseFloat(el.value) - 1) < el.max) {
          el.value = parseFloat(el.value) - 1;
        }
      }
    });

    el.addEventListener("input", (e) => {
      const cssVar = e.target.dataset.cssVar;
      let value = e.target.value;
      if (el.type == "number") {
        value = `${value}px`;
      }

      //input cookie
      saveInputToCookie(e.target);
      updateCSSVariable(cssVar, value);
    });
  });

async function capture(element) {
  if (!element) {
    return;
    // element = document.querySelector(".balloon");
  }

  element.style.resize = "none";
  element.style.boxShadow = "none";

  const result = await snapdom(element, {
    embedFonts: true,
    scale: 3,
    backgroundColor: "transparent",
  });

  const img = await result.toWebp({});
  img.dataset.title = slugify(element.textContent).slice(0, 40);

  document.querySelector(".preview").insertAdjacentElement("beforeend", img);

  // await result.download({
  //   scale: 2,
  //   embedFonts: true,
  //   format: "webp",
  //   filename: slugify(element.textContent),
  // });

  element.style.resize = "both";
}

function slugify(str) {
  return String(str)
    .normalize("NFKD") // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, "") // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 -]/g, "") // remove non-alphanumeric characters
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/-+/g, "-"); // remove consecutive hyphens
}

document.querySelector("#tailleauto").addEventListener("click", function () {
  let balloon = document.querySelector(".selected");
  balloon.style.width = "max-content";
  balloon.style.height = "auto";
});

document.querySelector(".editor").addEventListener("click", (e) => {
  document.querySelector(".selected")?.classList.remove("selected");
  if (e.target.id == "button-plus") {
    document
      .querySelector(".balloons")
      .insertAdjacentHTML(
        "beforeend",
        `<div class="balloon selected" contenteditable="">edit text</div>`,
      );
    applyAllInput();
  } else if (
    e.target?.classList.contains("balloon") ||
    e.target.closest(".balloon")
  ) {
    let selectedballoon = e.target.closest(".balloon")
      ? e.target.closest(".balloon")
      : e.target.classList.contains("ballon");

    selectedballoon.classList.add("selected");
    // applystyle to the input
    document
      .querySelectorAll("input[data-css-var], select[data-css-var]")
      .forEach((input) => {
        if (selectedballoon.style.getPropertyValue(input.dataset.cssVar)) {
          if (input.type == "number") {
            input.value = parseFloat(
              selectedballoon.style.getPropertyValue(input.dataset.cssVar),
            );
          } else {
            input.value = selectedballoon.style.getPropertyValue(
              input.dataset.cssVar,
            );
          }
        }
      });
  } else {
  }
});

//donwload
document
  .getElementById("downloadAll")
  .addEventListener("click", async function () {
    const zip = new JSZip();
    const folder = zip.folder("images");
    const images = document.querySelectorAll(".preview img");

    const fetchAndAddImage = async (img, index) => {
      try {
        const url = img.src;
        const response = await fetch(url, { mode: "cors" });
        const blob = await response.blob();
        const extension = blob.type.split("/")[1] || "jpg";
        const filename = `${img.dataset.title}-${index + 1}.${extension}`;
        folder.file(filename, blob);
      } catch (err) {
        console.error("Error downloading image:", img.src, err);
      }
    };

    // Download all images in parallel
    await Promise.all([...images].map(fetchAndAddImage));

    // Generate the zip and trigger download
    zip.generateAsync({ type: "blob" }).then((content) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = "images.zip";
      a.click();
    });
  });

//cookie setup
//
//
//
function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

// Utility: Get cookie by name
function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (let cookie of cookies) {
    const [key, val] = cookie.split("=");
    if (decodeURIComponent(key) === name) return decodeURIComponent(val);
  }
  return null;
}

// Restore all inputs
function restoreInputsFromCookies() {
  const inputs = document.querySelectorAll("input");
  inputs.forEach((input) => {
    const saved = getCookie(input.name);
    if (saved !== null) {
      input.value = saved;
    }
  });
}

// Save input value on change
function saveInputToCookie(input) {
  input.addEventListener("input", () => {
    setCookie(input.name, input.value);
  });
}

function move() {
  const tools = document.querySelector(".tools");
  const header = tools.querySelector("h2");

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    // Calculate offset between mouse position and the top-left corner of the element
    offsetX = e.clientX - tools.offsetLeft;
    offsetY = e.clientY - tools.offsetTop;
    document.body.style.userSelect = "none"; // prevent text selection
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      tools.style.left = `${e.clientX - offsetX}px`;
      tools.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = ""; // re-enable text selection
  });
}

//reset the tool location
document.querySelector("#resettool").addEventListener("click", function () {
  document.querySelector(".tools").style.left = "100px";
  document.querySelector(".tools").style.top = "100px";
});

function applyAllInput(obj) {
  document
    .querySelectorAll("input[data-css-var], select[data-css-var]")
    .forEach((input) => {
      const cssVar = input.dataset.cssVar;
      let value = input.value;

      if (input.type == "number") {
        value = `${value}px`;
      }
      //the number is right here
      updateCSSVariable(cssVar, value, obj);
    });
}

document.querySelector("#apply").addEventListener("click", function () {
  document.querySelectorAll(".balloon").forEach((balloon) => {
    applyAllInput(balloon);
  });
});
