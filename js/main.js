addEventListener("load", async (event) => {
  await createStyle();
  restoreInputsFromCookies();
  applyAllInput();
});

async function createStyle(l) {
  // Function to get or create the :root CSSRule
  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(`.balloon {}`);
  stylesheet.id = "replacetest";
  let style = document.createElement("style");
  style.id = "updatedstyle";
  document.head.appendChild(style);
  document.adoptedStyleSheets.push(stylesheet);
}

// Function to update CSS variable
function updateCSSVariableForAll(varName, value) {
  document.adoptedStyleSheets
    .filter((e) => e.id == "replacetest")[0]
    .cssRules[0].style.setProperty(varName, value);
  document.querySelector(".balloon").style.textContent = "";
}
// Function to update CSS variable
function updateCSSVariable(varName, value) {
  document.querySelector(".selected")?.style.setProperty(varName, value);
}

// Attach event listeners to inputs/selects with data-css-var attribute
document
  .querySelectorAll("input[data-css-var], select[data-css-var]")
  .forEach((el) => {
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

document.getElementById("capture").addEventListener("click", async function () {
  let element = document.querySelector(".selected");
  if (!element) {
    element = document.querySelector(".balloon");
  }

  element.style.resize = "none";
  element.style.boxShadow = "none";

  const result = await snapdom(element, {
    embedFonts: true,
    scale: 8,
    backgroundColor: "transparent",
  });

  const img = await result.toWebp({});
  img.dataset.title = slugify(element.textContent);

  document.querySelector(".preview").insertAdjacentElement("beforeend", img);

  // await result.download({
  //   scale: 2,
  //   embedFonts: true,
  //   format: "webp",
  //   filename: slugify(element.textContent),
  // });

  element.style.resize = "both";

  element.style.boxShadow = "0 0 0 5px var(--selected-color, #ccc)";
});

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
  balloon.style.width = "auto";
  balloon.style.height = "auto";
});

document.querySelector("#button-plus").addEventListener("click", function () {
  document
    .querySelector(".balloons")
    .insertAdjacentHTML(
      "beforeend",
      `<div class="balloon" contenteditable="">edit text</div>`,
    );
});

document.querySelector(".editor").addEventListener("click", (e) => {
  document.querySelector(".selected")?.classList.remove("selected");

  if (e.target?.classList.contains("balloon")) {
    e.target.classList.add("selected");
  } else {
    document.querySelector(".selected")?.classList.remove("selected");
  }
});

document.querySelector("#apply").addEventListener("click", (e) => {
  updateCSSVariableForAll();
});

function applyAllInput() {
  //get all the input, apply to all the data, but backup the input maybe?
  //we’ll do that later.
  document
    .querySelectorAll("input[data-css-var], select[data-css-var]")
    .forEach((el) => {
      const cssVar = el.dataset.cssVar;
      let value = el.value;
      if (el.type == "number") {
        value = `${value}px`;
      }
      if (document.querySelector(".selected"))
        updateCSSVariableForAll(cssVar, value);
    });
}

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
