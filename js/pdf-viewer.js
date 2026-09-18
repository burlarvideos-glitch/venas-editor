"use strict";


/* =========================================================
   VENAS PDF EDITOR
   PDF VIEWER
========================================================= */


/* =========================================================
   ELEMENTOS
========================================================= */

const fileInput =
    document.getElementById(
        "fileInput"
    );


const viewer =
    document.getElementById(
        "viewer"
    );


const status =
    document.getElementById(
        "status"
    );


const saveBtn =
    document.getElementById(
        "saveBtn"
    );


/* =========================================================
   VARIÁVEIS
========================================================= */

let currentPdf = null;

let originalPdfBytes = null;

let pageData = [];


/* =========================================================
   CONFIGURAÇÃO DO PDF.JS
========================================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


/* =========================================================
   STATUS
========================================================= */

function setStatus(
    message
) {

    status.textContent =
        message;

}


/* =========================================================
   ERRO
========================================================= */

function showError(
    error
) {

    console.error(
        "VENAS PDF ERROR:",
        error
    );


    viewer.innerHTML =
        "";


    const box =
        document.createElement(
            "div"
        );


    box.className =
        "error";


    box.textContent =
        "Erro ao carregar o PDF: " +
        (
            error &&
            error.message
                ? error.message
                : error
        );


    viewer.appendChild(
        box
    );


    setStatus(
        "Erro ao carregar PDF."
    );

}


/* =========================================================
   ESCALA
========================================================= */

function calculateScale(
    page
) {

    const baseViewport =
        page.getViewport({

            scale: 1

        });


    const availableWidth =
        Math.min(

            window.innerWidth - 30,

            1100

        );


    let scale =
        availableWidth /
        baseViewport.width;


    scale =
        Math.max(

            0.45,

            Math.min(

                scale,

                1.8

            )

        );


    return scale;

}


/* =========================================================
   CRIAR TEXTO EDITÁVEL
========================================================= */

async function createTextLayer(
    page,
    viewport,
    pageNumber
) {

    const textLayer =
        document.createElement(
            "div"
        );


    textLayer.className =
        "text-layer";


    /*
       Obtém o texto real
       através da API oficial
       do PDF.js.
    */

    const textContent =
        await page.getTextContent({

            normalizeWhitespace:
                false,

            disableCombineTextItems:
                false

        });


    const textItems = [];


    /*
       Percorre cada trecho
       de texto encontrado.
    */

    for (
        let i = 0;
        i < textContent.items.length;
        i++
    ) {

        const item =
            textContent.items[i];


        /*
           Ignora elementos
           vazios.
        */

        if (
            !item.str ||
            !item.str.trim()
        ) {

            continue;

        }


        /*
           Converte a posição
           do PDF para a tela.
        */

        const tx =
            pdfjsLib.Util.transform(

                viewport.transform,

                item.transform

            );


        const a = tx[0];

        const b = tx[1];

        const d = tx[3];

        const x = tx[4];

        const y = tx[5];


        /*
           Altura da fonte.
        */

        const fontHeight =
            Math.max(

                8,

                Math.hypot(
                    b,
                    d
                )

            );


        /*
           Dimensões.
        */

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


        /*
           Elemento HTML.
        */

        const span =
            document.createElement(
                "span"
            );


        span.className =
            "editable-text";


        span.contentEditable =
            "true";


        span.spellcheck =
            false;


        span.textContent =
            item.str;


        /*
           Guarda o texto original.
        */

        span.dataset.original =
            item.str;


        span.dataset.page =
            pageNumber;


        span.dataset.index =
            i;


        /*
           Posição.
        */

        span.style.left =
            x + "px";


        span.style.top =
            (
                y -
                fontHeight
            ) + "px";


        /*
           Tamanho.
        */

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

            textContent.styles[
                item.fontName
            ]

        ) {

            const font =
                textContent.styles[
                    item.fontName
                ];


            if (
                font.fontFamily
            ) {

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
                "rotate(" +
                angle +
                "rad)";

        }


        /*
           Dados internos.
        */

        textItems.push({

            element:
                span,

            originalText:
                item.str,

            page:
                pageNumber,

            x:
                x,

            y:
                y -
                fontHeight,

            width:
                width,

            height:
                height,

            fontSize:
                fontHeight,

            transform:
                tx,

            fontName:
                item.fontName ||
                null

        });


        textLayer.appendChild(
            span
        );

    }


    return {

        element:
            textLayer,

        items:
            textItems

    };

}


/* =========================================================
   RENDERIZAR PÁGINA
========================================================= */

async function renderPage(
    page,
    pageNumber
) {

    setStatus(

        "Renderizando página " +
        pageNumber +
        "..."

    );


    /*
       Escala.
    */

    const scale =
        calculateScale(
            page
        );


    /*
       Viewport.
    */

    const viewport =
        page.getViewport({

            scale:
                scale

        });


    /*
       Container.
    */

    const pageElement =
        document.createElement(
            "div"
        );


    pageElement.className =
        "pdf-page";


    pageElement.style.width =
        viewport.width +
        "px";


    pageElement.style.height =
        viewport.height +
        "px";


    /*
       Canvas.
    */

    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.className =
        "pdf-canvas";


    canvas.width =
        Math.ceil(
            viewport.width
        );


    canvas.height =
        Math.ceil(
            viewport.height
        );


    canvas.style.width =
        viewport.width +
        "px";


    canvas.style.height =
        viewport.height +
        "px";


    pageElement.appendChild(
        canvas
    );


    viewer.appendChild(
        pageElement
    );


    /*
       Renderização oficial.
    */

    const context =
        canvas.getContext(
            "2d"
        );


    await page.render({

        canvasContext:
            context,

        viewport:
            viewport

    }).promise;


    /*
       Camada editável.
    */

    const textLayer =
        await createTextLayer(

            page,

            viewport,

            pageNumber

        );


    pageElement.appendChild(
        textLayer.element
    );


    /*
       Guarda os dados.
    */

    pageData.push({

        page:
            pageNumber,

        viewport:
            viewport,

        element:
            pageElement,

        canvas:
            canvas,

        textLayer:
            textLayer.element,

        textItems:
            textLayer.items

    });

}


/* =========================================================
   CARREGAR PDF
========================================================= */

async function loadPDF(
    file
) {

    viewer.innerHTML =
        "";


    pageData =
        [];


    currentPdf =
        null;


    saveBtn.disabled =
        true;


    try {

        setStatus(
            "Lendo PDF..."
        );


        /*
           Lê o arquivo.
        */

        const buffer =
            await file.arrayBuffer();


        /*
           Guarda uma cópia
           independente.
        */

        originalPdfBytes =
            new Uint8Array(

                buffer.slice(0)

            );


        setStatus(
            "Abrindo PDF..."
        );


        /*
           Abre com PDF.js.
        */

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

            currentPdf.numPages +
            " página(s) encontrada(s)."

        );


        /*
           Renderiza todas
           as páginas.
        */

        for (

            let pageNumber = 1;

            pageNumber <=
            currentPdf.numPages;

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
           Entrega os dados
           ao editor.
        */

        if (

            typeof
            window.initializePdfEditor ===
            "function"

        ) {

            window.initializePdfEditor(
                pageData
            );

        }


        saveBtn.disabled =
            false;


        setStatus(

            "PDF carregado. " +
            "Clique em qualquer texto para editar."

        );


    } catch (
        error
    ) {

        showError(
            error
        );

    }

}


/* =========================================================
   INPUT
========================================================= */

fileInput.addEventListener(

    "change",

    async function () {

        const file =
            this.files &&
            this.files[0];


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


        await loadPDF(
            file
        );

    }

);
