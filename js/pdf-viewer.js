"use strict";


/* ==========================================================
   VENAS PDF EDITOR
   VISUALIZADOR
========================================================== */


const fileInput =
    document.getElementById("fileInput");

const viewer =
    document.getElementById("viewer");

const status =
    document.getElementById("status");

const saveBtn =
    document.getElementById("saveBtn");


let currentPdf = null;

let originalPdfBytes = null;

let pageData = [];


/* ==========================================================
   CONFIGURAÇÃO PDF.JS
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

    console.error(
        "VENAS PDF ERROR:",
        error
    );

    viewer.innerHTML = "";

    const box =
        document.createElement("div");

    box.className = "error";

    box.textContent =
        "Erro ao carregar o PDF: " +
        (
            error && error.message
                ? error.message
                : error
        );

    viewer.appendChild(box);

    setStatus("Erro ao carregar PDF.");

}


/* ==========================================================
   CALCULAR ESCALA
========================================================== */

function calculateScale(page) {

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


/* ==========================================================
   IDENTIFICAR OPERAÇÕES DE TEXTO
========================================================== */

function isTextOperation(fn) {

    const OPS =
        pdfjsLib.OPS;


    return (

        fn === OPS.showText ||

        fn === OPS.showSpacedText ||

        fn === OPS.nextLineShowText ||

        fn === OPS.nextLineSetSpacingShowText

    );

}


/* ==========================================================
   RENDERIZAÇÃO SEM O TEXTO ORIGINAL
========================================================== */

async function renderBackgroundOnly(
    page,
    viewport,
    canvas
) {

    /*
       Pegamos as operações originais
       da página.
    */

    const operatorList =
        await page.getOperatorList();


    /*
       Criamos uma lista nova.

       As operações que desenham texto
       são removidas.

       Imagens, linhas, formas,
       fundos etc. continuam.
    */

    const filteredFns = [];

    const filteredArgs = [];


    for (
        let i = 0;
        i < operatorList.fnArray.length;
        i++
    ) {

        const fn =
            operatorList.fnArray[i];


        if (
            isTextOperation(fn)
        ) {

            continue;

        }


        filteredFns.push(fn);

        filteredArgs.push(
            operatorList.argsArray[i]
        );

    }


    const filteredOperators = {

        fnArray:
            filteredFns,

        argsArray:
            filteredArgs

    };


    /*
       Renderizador interno do PDF.js.
    */

    const graphics =
        new pdfjsLib.CanvasGraphics(
            canvas.getContext("2d"),
            page.commonObjs,
            page.objs,
            null,
            null,
            null,
            null,
            null,
            null
        );


    graphics.beginDrawing({

        transform:
            viewport.transform,

        viewport:

            viewport,

        transparency:

            false,

        background:

            "#ffffff"

    });


    await graphics.executeOperatorList(
        filteredOperators
    );


    graphics.endDrawing();

}


/* ==========================================================
   CRIAR CAMADA DE TEXTO
========================================================== */

async function createTextLayer(
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


    /*
       Guarda os dados da página
       para o editor.
    */

    const textItems = [];


    for (
        const item
        of textContent.items
    ) {

        if (
            !item.str ||
            !item.str.trim()
        ) {

            continue;

        }


        /*
           Transformação original
           fornecida pelo PDF.js.
        */

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
                Math.sqrt(
                    b * b +
                    d * d
                )
            );


        const left =
            e;


        const top =
            f - fontHeight;


        const width =
            Math.max(
                item.width *
                viewport.scale,

                10
            );


        const height =
            Math.max(
                fontHeight * 1.25,

                12
            );


        /*
           Elemento HTML editável.
        */

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
            textItems.length;


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
           Rotação / escala do texto.

           Mantemos a transformação
           horizontal do PDF.
        */

        const angle =
            Math.atan2(
                b,
                a
            );


        const scaleX =
            Math.sqrt(
                a * a +
                b * b
            ) /
            Math.max(
                fontHeight,
                1
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
           Fonte aproximada.

           O PDF.js fornece
           informações da fonte.
        */

        if (
            textContent.styles &&
            item.fontName &&
            textContent.styles[item.fontName]
        ) {

            const style =
                textContent.styles[
                    item.fontName
                ];


            if (
                style.fontFamily
            ) {

                span.style.fontFamily =
                    style.fontFamily;

            }

        }


        /*
           Dados usados posteriormente
           pelo editor.
        */

        textItems.push({

            element: span,

            originalText:
                item.str,

            page:
                pageNumber,

            x:
                left,

            y:
                top,

            width:
                width,

            height:
                height,

            fontSize:
                fontHeight,

            transform:
                tx,

            fontName:
                item.fontName || null

        });


        textLayer.appendChild(span);

    }


    return {

        element:
            textLayer,

        items:
            textItems

    };

}


/* ==========================================================
   RENDERIZAR UMA PÁGINA
========================================================== */

async function renderPage(
    page,
    pageNumber
) {

    setStatus(
        "Renderizando página " +
        pageNumber +
        "..."
    );


    const scale =
        calculateScale(page);


    const viewport =
        page.getViewport({

            scale:
                scale

        });


    /*
       Container da página.
    */

    const pageElement =
        document.createElement("div");


    pageElement.className =
        "pdf-page";


    pageElement.style.width =
        viewport.width + "px";


    pageElement.style.height =
        viewport.height + "px";


    /*
       Canvas.
    */

    const canvas =
        document.createElement("canvas");


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
        viewport.width + "px";


    canvas.style.height =
        viewport.height + "px";


    pageElement.appendChild(
        canvas
    );


    viewer.appendChild(
        pageElement
    );


    /*
       Renderiza o PDF sem as operações
       de texto.
    */

    await renderBackgroundOnly(
        page,
        viewport,
        canvas
    );


    /*
       Cria texto HTML editável.
    */

    const layer =
        await createTextLayer(
            page,
            viewport,
            pageNumber
        );


    pageElement.appendChild(
        layer.element
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

            layer.element,

        textItems:

            layer.items

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
           Fazemos uma cópia.

           Isso evita problemas de
           ArrayBuffer transferido pelo PDF.js.
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
                    ),

                disableAutoFetch:
                    false,

                disableStream:
                    false

            });


        currentPdf =
            await loadingTask.promise;


        setStatus(
            currentPdf.numPages +
            " página(s) encontrada(s)."
        );


        /*
           Renderiza todas as páginas.
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
           Entrega os dados ao editor.
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
            "PDF carregado. Clique em qualquer texto para editar."
        );


    } catch (error) {

        showError(error);

    }

}


/* ==========================================================
   INPUT DE ARQUIVO
========================================================== */

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
                    "O arquivo selecionado não é um PDF."
                )
            );

            return;

        }


        await loadPDF(file);

    }
);


/* ==========================================================
   REDIMENSIONAMENTO
========================================================== */

window.addEventListener(
    "resize",
    function () {

        /*
           Não recarregamos automaticamente
           para não perder edições.

           O próximo carregamento utiliza
           o tamanho atual da tela.
        */

    }
);
