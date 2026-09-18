(function () {

    "use strict";


    const fileInput =
        document.getElementById("file");


    const viewer =
        document.getElementById("viewer");


    const status =
        document.getElementById("status");


    /*
     * Configuração do PDF.js
     */

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


    function setStatus(message) {

        status.textContent = message;

    }


    function showError(message) {

        viewer.innerHTML = "";

        const div =
            document.createElement("div");

        div.className =
            "error";

        div.textContent =
            message;

        viewer.appendChild(div);

        setStatus("Erro");

    }


    async function loadPDF(file) {

        viewer.innerHTML = "";

        setStatus("Lendo arquivo…");


        try {

            /*
             * Lê o arquivo original.
             */

            const buffer =
                await file.arrayBuffer();


            /*
             * Cria uma cópia independente.
             */

            const data =
                new Uint8Array(buffer.slice(0));


            setStatus(
                "Abrindo PDF…"
            );


            /*
             * Abre o PDF.
             */

            const loadingTask =
                pdfjsLib.getDocument({
                    data: data
                });


            const pdf =
                await loadingTask.promise;


            setStatus(
                pdf.numPages +
                " página(s) encontrada(s)."
            );


            /*
             * Renderiza cada página.
             */

            for (
                let pageNumber = 1;
                pageNumber <= pdf.numPages;
                pageNumber++
            ) {

                setStatus(
                    "Renderizando página " +
                    pageNumber +
                    " de " +
                    pdf.numPages +
                    "…"
                );


                const page =
                    await pdf.getPage(
                        pageNumber
                    );


                /*
                 * Tamanho original da página.
                 */

                const originalViewport =
                    page.getViewport({
                        scale: 1
                    });


                /*
                 * Ajusta ao tamanho da tela.
                 */

                const availableWidth =
                    Math.min(
                        window.innerWidth - 30,
                        1100
                    );


                const scale =
                    Math.min(
                        1.8,
                        Math.max(
                            0.5,
                            availableWidth /
                            originalViewport.width
                        )
                    );


                const viewport =
                    page.getViewport({
                        scale: scale
                    });


                /*
                 * Container da página.
                 */

                const pageDiv =
                    document.createElement(
                        "div"
                    );


                pageDiv.className =
                    "page";


                /*
                 * Canvas.
                 */

                const canvas =
                    document.createElement(
                        "canvas"
                    );


                const context =
                    canvas.getContext(
                        "2d",
                        {
                            alpha: false
                        }
                    );


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


                pageDiv.appendChild(
                    canvas
                );


                viewer.appendChild(
                    pageDiv
                );


                /*
                 * Renderização.
                 */

                await page.render({

                    canvasContext:
                        context,

                    viewport:
                        viewport

                }).promise;

            }


            setStatus(
                "PDF carregado com sucesso."
            );


        } catch (error) {

            console.error(
                "VENAS PDF ERROR:",
                error
            );


            showError(
                "Erro ao abrir o PDF: " +
                error.message
            );

        }

    }


    fileInput.addEventListener(
        "change",
        function () {

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
                    "Selecione um arquivo PDF."
                );

                return;

            }


            loadPDF(file);

        }
    );


})();
