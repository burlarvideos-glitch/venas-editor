"use strict";

/* ==========================================================
   VENAS PDF EDITOR
   VISUALIZADOR PDF
========================================================== */

const fileInput = document.getElementById("fileInput");
const viewer = document.getElementById("viewer");
const status = document.getElementById("status");
const saveBtn = document.getElementById("saveBtn");

let currentPdf = null;
let originalPdfBytes = null;
let pageData = [];


/* ==========================================================
   PDF.JS
========================================================== */

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


/* ==========================================================
   STATUS
========================================================== */

function setStatus(message) {
    status.textContent = message;
}


/* ==========================================================
   ERRO
========================================================== */

function showError(error) {

    console.error("VENAS PDF ERROR:", error);

    viewer.innerHTML = "";

    const box = document.createElement("div");

    box.className = "error";

    box.textContent =
        "Erro ao carregar o PDF: " +
        (error?.message || error);

    viewer.appendChild(box);

    setStatus("Erro ao carregar PDF.");
}


/* ==========================================================
   ESCALA
========================================================== */

function calculateScale(page) {

    const viewport =
        page.getViewport({
            scale: 1
        });

    const availableWidth =
        Math.min(
            window.innerWidth - 30,
            1100
        );

    return Math.max(
        0.45,
        Math.min(
            availableWidth / viewport.width,
            1.8
        )
    );
}


/* ==========================================================
   CAMADA DE TEXTO EDITÁVEL
========================================================== */

async function createEditableTextLayer(
    page,
    viewport,
    pageNumber
) {

    const textLayer =
        document.createElement("div");

    textLayer.className =
        "text-layer";


    const textContent =
        await page.getTextContent({

            normalizeWhitespace: false,

            disableCombineTextItems: false

        });


    const textItems = [];


    for (
        let i = 0;
        i < textContent.items.length;
        i++
    ) {

        const item =
            textContent.items[i];


        if (
            !item.str ||
            !item.str.trim()
        ) {
            continue;
        }


        const tx =
            pdfjsLib.Util.transform(
                viewport.transform,
                item.transform
            );


        const a = tx[0];
        const b = tx[1];
        const c = tx[2];
        const d = tx[3];
        const e = tx[4];
        const f = tx[5];


        const fontHeight =
            Math.max(
                8,
                Math.hypot(b, d)
            );


        const left = e;

        const top =
            f - fontHeight;


        const width =
            Math.max(
                item.width *
                viewport.scale,

                12
            );


        const height =
            Math.max(
                fontHeight * 1.35,

                14
            );


        const span =
            document.createElement("span");


        span.className =
            "editable-text";


        span.contentEditable =
            "true";


        span.spellcheck =
            false;


        span.textContent =
            item.str;


        span.dataset.original =
            item.str;


        span.dataset.page =
            pageNumber;


        span.dataset.index =
            i;


        span.style.left =
            left + "px";


        span.style.top =
            top + "px";


        span.style.width =
            width + "px";


        span.style.height =
            height + "px";


        span.style.fontSize =
            fontHeight + "px";


        /*
           Fonte aproximada.
        */

        if (
            textContent.styles &&
            item.fontName &&
            textContent.styles[item.fontName]
        ) {

            const font =
                textContent.styles[
                    item.fontName
                ];


            if (font.fontFamily) {

                span.style.fontFamily =
                    font.fontFamily;

            }

        }


        /*
           Rotação.
        */

        const angle =
            Math.atan2(
                b,
                a
            );


        if (
            Math.abs(angle) >
            0.001
        ) {

            span.style.transform =
                `rotate(${angle}rad)`;

        }


        /*
           Guarda informações do PDF.
        */

        textItems.push({

            element: span,

            originalText: item.str,

            page: pageNumber,

            x: left,

            y: top,

            width: width,

            height: height,

            fontSize: fontHeight,

            transform: tx,

            fontName:
                item.fontName || null

        });


        textLayer.appendChild(span);

    }


    return {

        element: textLayer,

        items: textItems

    };

}


/* ==========================================================
   RENDERIZAR PÁGINA
========================================================== */

async function renderPage(
    page,
    pageNumber
) {

    setStatus(
        `Renderizando página ${pageNumber}...`
    );


    const scale =
        calculateScale(page);


    const viewport =
        page.getViewport({
            scale: scale
        });


    const pageElement =
        document.createElement("div");


    pageElement.className =
        "pdf-page";


    pageElement.style.width =
        `${viewport.width}px`;


    pageElement.style.height =
        `${viewport.height}px`;


    /*
       Canvas normal do PDF.js.
    */

    const canvas =
        document.createElement("canvas");


    canvas.className =
        "pdf-canvas";


    canvas.width =
        Math.ceil(viewport.width);


    canvas.height =
        Math.ceil(viewport.height);


    canvas.style.width =
        `${viewport.width}px`;


    canvas.style.height =
        `${viewport.height}px`;


    pageElement.appendChild(canvas);

    viewer.appendChild(pageElement);


    const context =
        canvas.getContext("2d");


    /*
       Renderização oficial do PDF.js.
    */

    await page.render({

        canvasContext: context,

        viewport: viewport

    }).promise;


    /*
       Cria a camada de texto.
    */

    const textLayer =
        await createEditableTextLayer(
            page,
            viewport,
            pageNumber
        );


    pageElement.appendChild(
        textLayer.element
    );


    pageData.push({

        page: pageNumber,

        viewport: viewport,

        element: pageElement,

        canvas: canvas,

        textLayer:
            textLayer.element,

        textItems:
            textLayer.items

    });

}


/* ==========================================================
   CARREGAR PDF
========================================================== */

async function loadPDF(file) {

    viewer.innerHTML = "";

    pageData = [];

    currentPdf = null;

    saveBtn.disabled = true;


    try {

        setStatus(
            "Lendo PDF..."
        );


        const buffer =
            await file.arrayBuffer();


        /*
           Cópia independente dos bytes.
        */

        originalPdfBytes =
            new Uint8Array(
                buffer.slice(0)
            );


        setStatus(
            "Abrindo PDF..."
        );


        const loadingTask =
            pdfjsLib.getDocument({

                data:
                    new Uint8Array(
                        originalPdfBytes
                    )

            });


        currentPdf =
            await loadingTask.promise;


        setStatus(
            `${currentPdf.numPages} página(s) encontrada(s).`
        );


        /*
           Renderiza cada página.
        */

        for (
            let pageNumber = 1;
            pageNumber <= currentPdf.numPages;
            pageNumber++
        ) {

            const page =
                await currentPdf.getPage(
                    pageNumber
                );


            await renderPage(
                page,
                pageNumber
            );

        }


        /*
           Entrega os dados para
           pdf-editor.js.
        */

        if (
            typeof window.initializePdfEditor ===
            "function"
        ) {

            window.initializePdfEditor(
                pageData
            );

        }


        saveBtn.disabled = false;


        setStatus(
            "PDF carregado. Clique no texto para editar."
        );


    } catch (error) {

        showError(error);

    }

}


/* ==========================================================
   SELEÇÃO DO ARQUIVO
========================================================== */

fileInput.addEventListener(
    "change",
    async function () {

        const file =
            this.files?.[0];


        if (!file) {
            return;
        }


        if (
            file.type !==
            "application/pdf"
        ) {

            showError(
                new Error(
                    "Selecione um arquivo PDF válido."
                )
            );

            return;

        }


        await loadPDF(file);

    }
);
