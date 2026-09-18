"use strict";


/* ==========================================================
   VENAS PDF EDITOR
   EDITOR DE TEXTO
========================================================== */


let editorPages = [];


/* ==========================================================
   INICIALIZAÇÃO
========================================================== */

window.initializePdfEditor =
    function (pages) {

        editorPages =
            pages || [];


        installEditorEvents();

    };


/* ==========================================================
   EVENTOS DOS TEXTOS
========================================================== */

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
               Ao entrar no texto.
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
               Ao modificar.
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
               Saiu do campo.
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
               ESC cancela alteração.
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
                       ENTER encerra a edição.

                       Evita criar uma nova linha
                       dentro do PDF.
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


/* ==========================================================
   OBTER ALTERAÇÕES
========================================================== */

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


/* ==========================================================
   BOTÃO SALVAR
========================================================== */

const saveButton =
    document.getElementById(
        "saveBtn"
    );


saveButton.addEventListener(
    "click",
    async function () {

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


        /*
           IMPORTANTE:

           Nesta etapa estamos validando
           a edição visual.

           A função estrutural de gravação
           será ligada depois que a camada
           de edição estiver funcionando.
        */

        console.log(
            "ALTERAÇÕES:",
            edits
        );


        alert(
            edits.length +
            " texto(s) alterado(s).\n\n" +
            "A edição está funcionando. " +
            "A próxima etapa é gravar essas alterações " +
            "dentro do PDF."
        );

    }
);
