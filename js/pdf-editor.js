"use strict";


/* =========================================================
   VENAS PDF EDITOR
   EDITOR DE TEXTO
========================================================= */


let editorPages = [];


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

window.initializePdfEditor =
    function (pages) {

        editorPages =
            pages || [];


        installEditorEvents();

    };


/* =========================================================
   EVENTOS
========================================================= */

function installEditorEvents() {

    for (
        const page
        of editorPages
    ) {

        for (
            const item
            of page.textItems
        ) {

            const element =
                item.element;


            /*
               Foco.
            */

            element.addEventListener(

                "focus",

                function () {

                    element.classList.add(
                        "editing"
                    );

                }

            );


            /*
               Digitação.
            */

            element.addEventListener(

                "input",

                function () {

                    const original =
                        element.dataset.original;


                    const current =
                        element.textContent;


                    if (
                        current !==
                        original
                    ) {

                        element.classList.add(
                            "changed"
                        );

                    } else {

                        element.classList.remove(
                            "changed"
                        );

                    }

                }

            );


            /*
               Saiu do texto.
            */

            element.addEventListener(

                "blur",

                function () {

                    element.classList.remove(
                        "editing"
                    );


                    const original =
                        element.dataset.original;


                    const current =
                        element.textContent;


                    if (
                        current !==
                        original
                    ) {

                        element.classList.add(
                            "changed"
                        );

                    }

                }

            );


            /*
               ESC cancela.
            */

            element.addEventListener(

                "keydown",

                function (event) {

                    if (
                        event.key ===
                        "Escape"
                    ) {

                        event.preventDefault();


                        element.textContent =
                            element.dataset.original;


                        element.classList.remove(
                            "changed"
                        );


                        element.blur();

                    }


                    /*
                       Enter encerra.
                    */

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        element.blur();

                    }

                }

            );

        }

    }

}


/* =========================================================
   OBTER ALTERAÇÕES
========================================================= */

function getEdits() {

    const edits = [];


    for (
        const page
        of editorPages
    ) {

        for (
            const item
            of page.textItems
        ) {

            const original =
                item.originalText;


            const current =
                item.element.textContent;


            if (
                current !==
                original
            ) {

                edits.push({

                    page:
                        item.page,

                    original:
                        original,

                    text:
                        current,

                    x:
                        item.x,

                    y:
                        item.y,

                    width:
                        item.width,

                    height:
                        item.height,

                    fontSize:
                        item.fontSize,

                    transform:
                        item.transform,

                    fontName:
                        item.fontName

                });

            }

        }

    }


    return edits;

}


/* =========================================================
   SALVAR
========================================================= */

const saveButton =
    document.getElementById(
        "saveBtn"
    );


saveButton.addEventListener(

    "click",

    function () {

        const edits =
            getEdits();


        if (
            edits.length === 0
        ) {

            alert(
                "Nenhuma alteração foi feita."
            );

            return;

        }


        console.log(
            "ALTERAÇÕES DETECTADAS:",
            edits
        );


        alert(

            "Foram detectadas " +
            edits.length +
            " alteração(ões).\n\n" +

            "A edição do texto na tela está funcionando.\n\n" +

            "A próxima etapa será gravar essas alterações " +
            "diretamente na estrutura do PDF."

        );

    }

);
