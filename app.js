pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


const fileInput =
  document.getElementById("pdfFile");

const pagesEl =
  document.getElementById("pages");

const statusEl =
  document.getElementById("status");

const downloadBtn =
  document.getElementById("downloadBtn");


let originalBytes = null;

let edits = [];


function status(text) {

  statusEl.textContent = text;

}


function createTextItem(
  item,
  viewport,
  scale,
  pageNumber
) {

  if (!item.str || !item.str.trim()) {

    return null;

  }


  const tx =
    pdfjsLib.Util.transform(
      viewport.transform,
      item.transform
    );


  const fontHeight =
    Math.max(
      8,
      Math.hypot(tx[2], tx[3])
    );


  const left =
    tx[4];

  const top =
    tx[5] - fontHeight;


  const element =
    document.createElement("span");


  element.className =
    "textItem";


  element.contentEditable =
    "true";


  element.spellcheck =
    false;


  element.textContent =
    item.str;


  element.dataset.page =
    String(pageNumber);


  element.dataset.original =
    item.str;


  element.style.left =
    left + "px";


  element.style.top =
    top + "px";


  element.style.width =
    Math.max(
      item.width * scale + 10,
      18
    ) + "px";


  element.style.height =
    Math.max(
      fontHeight * 1.35,
      14
    ) + "px";


  element.style.fontSize =
    fontHeight + "px";


  element.addEventListener(
    "focus",
    () => {

      element.classList.add(
        "editing"
      );

    }
  );


  element.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        element.textContent =
          element.dataset.original;

        element.blur();

      }


      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        element.blur();

      }

    }
  );


  element.addEventListener(
    "blur",
    () => {

      element.classList.remove(
        "editing"
      );


      const oldText =
        element.dataset.original;


      const newText =
        element.textContent;


      if (newText === oldText) {

        return;

      }


      edits.push({

        page:
          Number(element.dataset.page),

        oldText:
          oldText,

        newText:
          newText

      });


      element.classList.add(
        "changed"
      );


      status(
        "Alteração registrada: " +
        oldText +
        " → " +
        newText
      );

    }
  );


  return element;

}



async function renderPdf(bytes) {

  pagesEl.innerHTML = "";

  edits = [];


  /*
    IMPORTANTE:

    PDF.js recebe uma cópia dos bytes.

    O arquivo original continua intacto
    para as próximas etapas.
  */

  const loadingTask =
    pdfjsLib.getDocument({

      data:
        new Uint8Array(bytes)

    });


  const pdf =
    await loadingTask.promise;


  for (
    let pageNumber = 1;
    pageNumber <= pdf.numPages;
    pageNumber++
  ) {

    const page =
      await pdf.getPage(pageNumber);


    const baseViewport =
      page.getViewport({
        scale: 1
      });


    const maxWidth =
      Math.min(
        window.innerWidth - 24,
        1100
      );


    const scale =
      Math.min(
        1.8,
        Math.max(
          0.45,
          maxWidth /
            baseViewport.width
        )
      );


    const viewport =
      page.getViewport({
        scale
      });


    const pageBox =
      document.createElement("div");


    pageBox.className =
      "page";


    pageBox.style.width =
      viewport.width + "px";


    pageBox.style.height =
      viewport.height + "px";


    const canvas =
      document.createElement("canvas");


    canvas.width =
      Math.ceil(
        viewport.width
      );


    canvas.height =
      Math.ceil(
        viewport.height
      );


    canvas.style.width =
      viewport.width + "px";


    canvas.style.height =
      viewport.height + "px";


    const textLayer =
      document.createElement("div");


    textLayer.className =
      "textLayer";


    pageBox.appendChild(canvas);

    pageBox.appendChild(textLayer);

    pagesEl.appendChild(pageBox);


    await page.render({

      canvasContext:
        canvas.getContext("2d"),

      viewport:
        viewport

    }).promise;


    const textContent =
      await page.getTextContent();


    for (
      const item
      of textContent.items
    ) {

      const element =
        createTextItem(
          item,
          viewport,
          scale,
          pageNumber - 1
        );


      if (element) {

        textLayer.appendChild(
          element
        );

      }

    }


    status(
      "Página " +
      pageNumber +
      " de " +
      pdf.numPages +
      " carregada."
    );

  }


  downloadBtn.disabled =
    false;


  status(
    "PDF carregado. Clique em qualquer texto para editar."
  );

}



fileInput.addEventListener(
  "change",
  async () => {

    const file =
      fileInput.files &&
      fileInput.files[0];


    if (!file) {

      return;

    }


    try {

      status(
        "Lendo PDF…"
      );


      originalBytes =
        new Uint8Array(
          await file.arrayBuffer()
        );


      await renderPdf(
        originalBytes
      );


    } catch (error) {

      console.error(error);


      status(
        "Erro ao carregar PDF."
      );


      alert(
        "Não foi possível carregar o PDF.\n\n" +
        error.message
      );

    }

  }
);



downloadBtn.addEventListener(
  "click",
  () => {

    if (!originalBytes) {

      return;

    }


    alert(
      "As alterações foram registradas.\n\n" +
      "A exportação estrutural do PDF será ligada na próxima etapa."
    );

  }
);
