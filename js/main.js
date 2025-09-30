addEventListener("load", async (event) => {
  await createStyle();

  document
    .querySelectorAll("input[data-css-var], select[data-css-var]")
    .forEach((el) => {
      const cssVar = el.dataset.cssVar;
      let value = el.value;
      if (el.type == "number") {
        value = `${value}px`;
      }
      updateCSSVariable(cssVar, value);
    });
});

async function createStyle(l) {
  // Function to get or create the :root CSSRule
  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(`.balloon {font-family: "Truculenta"}`);
  stylesheet.id = "replacetest";
  let style = document.createElement("style");
  style.id = "updatedstyle";
  document.head.appendChild(style);
  document.adoptedStyleSheets.push(stylesheet);
}

// Function to update CSS variable
function updateCSSVariable(varName, value) {
  document.adoptedStyleSheets
    .filter((e) => e.id == "replacetest")[0]
    .cssRules[0].style.setProperty(varName, value);
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
      updateCSSVariable(cssVar, value);
    });
  });

document.getElementById("capture").addEventListener("click", async function () {
  const element = document.querySelector(".balloon");

  const result = await snapdom(element);

  const img = await result.toImg({
    fast: false,
    embedFonts: true,
    scale: 2,
  });

  document.querySelector(".editor").appendChild(img);

  // await result.download({
  //   embedFonts: true,
  //   format: "webp",
  //   filename: slugify(element.textContent),
  // });
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
  let balloon = document.querySelector(".balloon");
  balloon.style.width = "auto";
  balloon.style.height = "auto";
});
