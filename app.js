"use strict";

/* =====================================================
   STATE
===================================================== */

const state = {

    expression: "",

    answer: "0",

    previousAnswer: 0,

    memory: 0,

    angle: "DEG",

    mode: "basic",

    history: []

};


/* =====================================================
   ELEMENTS
===================================================== */

const expressionEl =
    document.getElementById("expression");

const answerEl =
    document.getElementById("answer");

const angleModeEl =
    document.getElementById("angleMode");

const memoryStatusEl =
    document.getElementById("memoryStatus");

const scientificFunctions =
    document.getElementById("scientificFunctions");

const angleRow =
    document.getElementById("angleRow");

const calculatorView =
    document.getElementById("calculatorView");

const matrixView =
    document.getElementById("matrixView");

const toolsView =
    document.getElementById("toolsView");

const matrixSize =
    document.getElementById("matrixSize");

const matrixA =
    document.getElementById("matrixA");

const matrixB =
    document.getElementById("matrixB");

const matrixResult =
    document.getElementById("matrixResult");

const helpPanel =
    document.getElementById("helpPanel");

const historyPanel =
    document.getElementById("historyPanel");

const historyList =
    document.getElementById("historyList");


/* =====================================================
   DISPLAY
===================================================== */

function updateDisplay() {

    expressionEl.textContent =
        state.expression || "0";

    answerEl.textContent =
        state.answer;

    angleModeEl.textContent =
        state.angle;

    memoryStatusEl.textContent =
        state.memory !== 0
            ? `M ${formatNumber(state.memory)}`
            : "";
}


function formatNumber(value) {

    if (!Number.isFinite(value)) {
        return "Error";
    }

    if (Math.abs(value) < 1e-12) {
        value = 0;
    }

    return Number(
        value.toPrecision(12)
    ).toString();
}


/* =====================================================
   ANGLE
===================================================== */

function toRadians(value) {

    if (state.angle === "DEG") {

        return value *
            Math.PI / 180;
    }

    if (state.angle === "GRAD") {

        return value *
            Math.PI / 200;
    }

    return value;
}


function fromRadians(value) {

    if (state.angle === "DEG") {

        return value *
            180 / Math.PI;
    }

    if (state.angle === "GRAD") {

        return value *
            200 / Math.PI;
    }

    return value;
}


/* =====================================================
   FACTORIAL
===================================================== */

function factorial(n) {

    if (
        !Number.isInteger(n) ||
        n < 0
    ) {

        throw new Error(
            "Factorial needs a whole number"
        );
    }

    if (n > 170) {

        throw new Error(
            "Number too large"
        );
    }

    let result = 1;

    for (
        let i = 2;
        i <= n;
        i++
    ) {

        result *= i;
    }

    return result;
}


/* =====================================================
   TOKENIZER
===================================================== */

function tokenize(input) {

    const tokens = [];

    let i = 0;


    while (i < input.length) {

        const char = input[i];


        if (/\s/.test(char)) {

            i++;

            continue;
        }


        if (
            /[0-9.]/.test(char)
        ) {

            let number = "";

            while (
                i < input.length &&
                /[0-9.eE]/.test(input[i])
            ) {

                number += input[i];

                i++;
            }


            const value =
                Number(number);


            if (!Number.isFinite(value)) {

                throw new Error(
                    "Invalid number"
                );
            }


            tokens.push({
                type: "number",
                value
            });

            continue;
        }


        if (
            "+-*/^%!".includes(char)
        ) {

            tokens.push({
                type: "operator",
                value: char
            });

            i++;

            continue;
        }


        if (
            char === "(" ||
            char === ")"
        ) {

            tokens.push({
                type: "paren",
                value: char
            });

            i++;

            continue;
        }


        if (char === "π") {

            tokens.push({
                type: "number",
                value: Math.PI
            });

            i++;

            continue;
        }


        if (char === "e") {

            tokens.push({
                type: "number",
                value: Math.E
            });

            i++;

            continue;
        }


        if (/[a-zA-Z]/.test(char)) {

            let name = "";

            while (
                i < input.length &&
                /[a-zA-Z]/.test(input[i])
            ) {

                name += input[i];

                i++;
            }


            tokens.push({
                type: "function",
                value: name.toLowerCase()
            });

            continue;
        }


        throw new Error(
            `Unknown character: ${char}`
        );
    }


    return tokens;
}


/* =====================================================
   PARSER
===================================================== */

function evaluate(input) {

    const tokens =
        tokenize(input);

    let position = 0;


    function peek() {

        return tokens[position];
    }


    function consume() {

        return tokens[position++];
    }


    function expression() {

        let value =
            term();


        while (
            peek() &&
            (
                peek().value === "+" ||
                peek().value === "-"
            )
        ) {

            const operator =
                consume().value;

            const right =
                term();


            if (operator === "+") {

                value += right;

            } else {

                value -= right;
            }
        }


        return value;
    }


    function term() {

        let value =
            power();


        while (
            peek() &&
            (
                peek().value === "*" ||
                peek().value === "/"
            )
        ) {

            const operator =
                consume().value;

            const right =
                power();


            if (operator === "*") {

                value *= right;

            } else {

                if (right === 0) {

                    throw new Error(
                        "Cannot divide by zero"
                    );
                }

                value /= right;
            }
        }


        return value;
    }


    function power() {

        let value =
            unary();


        if (
            peek() &&
            peek().value === "^"
        ) {

            consume();

            const exponent =
                power();

            value =
                Math.pow(
                    value,
                    exponent
                );
        }


        return value;
    }


    function unary() {

        if (
            peek() &&
            peek().value === "+"
        ) {

            consume();

            return unary();
        }


        if (
            peek() &&
            peek().value === "-"
        ) {

            consume();

            return -unary();
        }


        return postfix();
    }


    function postfix() {

        let value =
            primary();


        while (
            peek() &&
            (
                peek().value === "!" ||
                peek().value === "%"
            )
        ) {

            const operator =
                consume().value;


            if (operator === "!") {

                value =
                    factorial(value);

            } else {

                value /= 100;
            }
        }


        return value;
    }


    function primary() {

        const token =
            peek();


        if (!token) {

            throw new Error(
                "Incomplete expression"
            );
        }


        if (
            token.type === "number"
        ) {

            consume();

            return token.value;
        }


        if (
            token.type === "paren" &&
            token.value === "("
        ) {

            consume();

            const value =
                expression();


            if (
                !peek() ||
                peek().value !== ")"
            ) {

                throw new Error(
                    "Missing )"
                );
            }


            consume();

            return value;
        }


        if (
            token.type === "function"
        ) {

            const name =
                consume().value;


            if (
                !peek() ||
                peek().value !== "("
            ) {

                throw new Error(
                    `${name} needs (`
                );
            }


            consume();


            const value =
                expression();


            if (
                !peek() ||
                peek().value !== ")"
            ) {

                throw new Error(
                    "Missing )"
                );
            }


            consume();


            return applyFunction(
                name,
                value
            );
        }


        throw new Error(
            "Unexpected input"
        );
    }


    const result =
        expression();


    if (position !== tokens.length) {

        throw new Error(
            "Invalid expression"
        );
    }


    if (!Number.isFinite(result)) {

        throw new Error(
            "Math error"
        );
    }


    return result;
}


/* =====================================================
   FUNCTIONS
===================================================== */

function applyFunction(
    name,
    value
) {

    switch (name) {

        case "sin":

            return Math.sin(
                toRadians(value)
            );

        case "cos":

            return Math.cos(
                toRadians(value)
            );

        case "tan":

            return Math.tan(
                toRadians(value)
            );

        case "asin":

            return fromRadians(
                Math.asin(value)
            );

        case "acos":

            return fromRadians(
                Math.acos(value)
            );

        case "atan":

            return fromRadians(
                Math.atan(value)
            );

        case "sqrt":

            if (value < 0) {

                throw new Error(
                    "Invalid square root"
                );
            }

            return Math.sqrt(value);

        case "log":

            if (value <= 0) {

                throw new Error(
                    "log needs positive value"
                );
            }

            return Math.log10(value);

        case "ln":

            if (value <= 0) {

                throw new Error(
                    "ln needs positive value"
                );
            }

            return Math.log(value);

        default:

            throw new Error(
                "Unknown function"
            );
    }
}


/* =====================================================
   CALCULATE
===================================================== */

function calculate() {

    if (!state.expression) {
        return;
    }


    try {

        const value =
            evaluate(
                state.expression
            );


        const result =
            formatNumber(value);


        state.answer =
            result;

        state.previousAnswer =
            value;


        state.history.unshift({

            expression:
                state.expression,

            answer:
                result

        });


        if (
            state.history.length > 50
        ) {

            state.history.pop();
        }


        renderHistory();

        updateDisplay();

    } catch (error) {

        state.answer =
            "Error";

        updateDisplay();

        setTimeout(
            () => {

                if (
                    state.answer === "Error"
                ) {

                    state.answer = "0";

                    updateDisplay();
                }

            },
            1600
        );
    }
}


/* =====================================================
   INPUT
===================================================== */

function addValue(value) {

    state.expression +=
        value;

    updateDisplay();
}


function clear() {

    state.expression = "";

    state.answer = "0";

    updateDisplay();
}


function backspace() {

    state.expression =
        state.expression.slice(
            0,
            -1
        );

    updateDisplay();
}


/* =====================================================
   MEMORY
===================================================== */

function memoryAction(action) {

    const current =
        Number(
            state.answer
                .replaceAll(",", "")
        );


    switch (action) {

        case "mc":

            state.memory = 0;

            break;


        case "mr":

            state.expression +=
                String(
                    state.memory
                );

            break;


        case "mplus":

            if (
                Number.isFinite(current)
            ) {

                state.memory +=
                    current;
            }

            break;


        case "mminus":

            if (
                Number.isFinite(current)
            ) {

                state.memory -=
                    current;
            }

            break;
    }


    updateDisplay();
}


/* =====================================================
   MODE SWITCH
===================================================== */

document
    .querySelectorAll(".nav-mode")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".nav-mode")
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                state.mode =
                    button.dataset.mode;


                calculatorView.classList.toggle(
                    "hidden",
                    state.mode === "matrix" ||
                    state.mode === "tools"
                );


                matrixView.classList.toggle(
                    "hidden",
                    state.mode !== "matrix"
                );


                toolsView.classList.toggle(
                    "hidden",
                    state.mode !== "tools"
                );


                const scientific =
                    state.mode ===
                    "scientific";


                scientificFunctions.classList.toggle(
                    "hidden",
                    !scientific
                );


                angleRow.classList.toggle(
                    "hidden",
                    !scientific
                );
            }
        );
    });


/* =====================================================
   KEYPAD
===================================================== */

document
    .querySelectorAll(".key")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const value =
                    button.dataset.value;

                const action =
                    button.dataset.action;


                if (
                    value !== undefined
                ) {

                    addValue(value);

                    return;
                }


                switch (action) {

                    case "calculate":

                        calculate();

                        break;


                    case "clear":

                        clear();

                        break;


                    case "backspace":

                        backspace();

                        break;


                    case "ans":

                        addValue(
                            String(
                                state.previousAnswer
                            )
                        );

                        break;


                    case "mc":
                    case "mr":
                    case "mplus":
                    case "mminus":

                        memoryAction(action);

                        break;
                }
            }
        );
    });


/* =====================================================
   SCIENTIFIC BUTTONS
===================================================== */

document
    .querySelectorAll(".science-key")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                addValue(
                    button.dataset.value
                );
            }
        );
    });


/* =====================================================
   ANGLE
===================================================== */

document
    .querySelectorAll(".angle")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".angle")
                    .forEach(
                        b =>
                            b.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                state.angle =
                    button.dataset.angle;


                updateDisplay();
            }
        );
    });


/* =====================================================
   MATRIX CREATION
===================================================== */

function createMatrix(
    container,
    size,
    name
) {

    container.innerHTML = "";

    container.style.gridTemplateColumns =
        `repeat(${size}, 1fr)`;


    for (
        let row = 0;
        row < size;
        row++
    ) {

        for (
            let col = 0;
            col < size;
            col++
        ) {

            const input =
                document.createElement(
                    "input"
                );


            input.type = "number";

            input.value = "0";

            input.className =
                "matrix-cell";

            input.dataset.matrix =
                name;

            input.dataset.row =
                row;

            input.dataset.col =
                col;


            container.appendChild(
                input
            );
        }
    }
}


function getMatrix(container) {

    const cells =
        [...container.querySelectorAll(
            ".matrix-cell"
        )];


    const size =
        Math.sqrt(
            cells.length
        );


    const matrix =
        Array.from(
            { length: size },
            () =>
                Array(size).fill(0)
        );


    cells.forEach(cell => {

        const row =
            Number(cell.dataset.row);

        const col =
            Number(cell.dataset.col);

        matrix[row][col] =
            Number(cell.value) || 0;

    });


    return matrix;
}


function clearMatrix(
    container
) {

    container
        .querySelectorAll(
            ".matrix-cell"
        )
        .forEach(
            cell =>
                cell.value = "0"
        );
}


/* =====================================================
   MATRIX MATH
===================================================== */

function matrixAdd(A, B) {

    return A.map(
        (row, i) =>
            row.map(
                (value, j) =>
                    value + B[i][j]
            )
    );
}


function matrixSubtract(A, B) {

    return A.map(
        (row, i) =>
            row.map(
                (value, j) =>
                    value - B[i][j]
            )
    );
}


function matrixMultiply(A, B) {

    const n = A.length;

    const result =
        Array.from(
            { length: n },
            () =>
                Array(n).fill(0)
        );


    for (
        let i = 0;
        i < n;
        i++
    ) {

        for (
            let j = 0;
            j < n;
            j++
        ) {

            for (
                let k = 0;
                k < n;
                k++
            ) {

                result[i][j] +=
                    A[i][k] *
                    B[k][j];
            }
        }
    }


    return result;
}


function determinant(M) {

    const n = M.length;


    if (n === 1) {

        return M[0][0];
    }


    if (n === 2) {

        return (
            M[0][0] * M[1][1] -
            M[0][1] * M[1][0]
        );
    }


    let det = 0;


    for (
        let col = 0;
        col < n;
        col++
    ) {

        const minor =
            M
                .slice(1)
                .map(
                    row =>
                        row.filter(
                            (_, index) =>
                                index !== col
                        )
                );


        det +=
            (
                col % 2 === 0
                    ? 1
                    : -1
            ) *
            M[0][col] *
            determinant(minor);
    }


    return det;
}


function transpose(M) {

    return M[0].map(
        (_, col) =>
            M.map(
                row =>
                    row[col]
            )
    );
}


function inverse(M) {

    const n = M.length;

    const A =
        M.map(
            (row, i) => [

                ...row,

                ...Array.from(
                    { length: n },
                    (_, j) =>
                        i === j ? 1 : 0
                )

            ]
        );


    for (
        let i = 0;
        i < n;
        i++
    ) {

        let pivot = i;


        for (
            let r = i + 1;
            r < n;
            r++
        ) {

            if (
                Math.abs(
                    A[r][i]
                ) >
                Math.abs(
                    A[pivot][i]
                )
            ) {

                pivot = r;
            }
        }


        if (
            Math.abs(
                A[pivot][i]
            ) < 1e-12
        ) {

            throw new Error(
                "Matrix is not invertible"
            );
        }


        [
            A[i],
            A[pivot]
        ] =
        [
            A[pivot],
            A[i]
        ];


        const divisor =
            A[i][i];


        for (
            let j = 0;
            j < 2 * n;
            j++
        ) {

            A[i][j] /=
                divisor;
        }


        for (
            let r = 0;
            r < n;
            r++
        ) {

            if (r === i) {
                continue;
            }


            const factor =
                A[r][i];


            for (
                let j = 0;
                j < 2 * n;
                j++
            ) {

                A[r][j] -=
                    factor *
                    A[i][j];
            }
        }
    }


    return A.map(
        row =>
            row.slice(n)
    );
}


/* =====================================================
   MATRIX DISPLAY
===================================================== */

function displayMatrix(M) {

    matrixResult.textContent =
        M
            .map(
                row =>
                    "[ " +
                    row
                        .map(
                            value =>
                                formatNumber(
                                    value
                                )
                        )
                        .join("   ") +
                    " ]"
            )
            .join("\n");
}


/* =====================================================
   MATRIX EVENTS
===================================================== */

matrixSize.addEventListener(
    "change",
    () => {

        const size =
            Number(
                matrixSize.value
            );


        createMatrix(
            matrixA,
            size,
            "A"
        );


        createMatrix(
            matrixB,
            size,
            "B"
        );


        matrixResult.textContent =
            "Choose an operation.";
    }
);


document
    .querySelectorAll(
        ".clear-matrix"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                clearMatrix(
                    button.dataset.matrix === "A"
                        ? matrixA
                        : matrixB
                );
            }
        );
    });


document
    .querySelectorAll(
        "[data-matrix-op]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                try {

                    const A =
                        getMatrix(matrixA);

                    const B =
                        getMatrix(matrixB);

                    let result;


                    switch (
                        button.dataset.matrixOp
                    ) {

                        case "add":

                            result =
                                matrixAdd(
                                    A,
                                    B
                                );

                            break;


                        case "subtract":

                            result =
                                matrixSubtract(
                                    A,
                                    B
                                );

                            break;


                        case "multiply":

                            result =
                                matrixMultiply(
                                    A,
                                    B
                                );

                            break;


                        case "detA":

                            matrixResult.textContent =
                                formatNumber(
                                    determinant(A)
                                );

                            return;


                        case "detB":

                            matrixResult.textContent =
                                formatNumber(
                                    determinant(B)
                                );

                            return;


                        case "inverseA":

                            result =
                                inverse(A);

                            break;


                        case "inverseB":

                            result =
                                inverse(B);

                            break;


                        case "transposeA":

                            result =
                                transpose(A);

                            break;


                        case "transposeB":

                            result =
                                transpose(B);

                            break;
                    }


                    displayMatrix(result);

                } catch (error) {

                    matrixResult.textContent =
                        error.message;
                }
            }
        );
    });


/* =====================================================
   HELP / HISTORY
===================================================== */

function openPanel(panel) {

    panel.classList.add(
        "open"
    );
}


function closePanel(panel) {

    panel.classList.remove(
        "open"
    );
}


document
    .getElementById("helpBtn")
    .addEventListener(
        "click",
        () =>
            openPanel(helpPanel)
    );


document
    .getElementById("historyBtn")
    .addEventListener(
        "click",
        () =>
            openPanel(historyPanel)
    );


document
    .getElementById("matrixHelp")
    .addEventListener(
        "click",
        () =>
            openPanel(helpPanel)
    );


document
    .querySelectorAll("[data-close]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                closePanel(
                    document.getElementById(
                        button.dataset.close
                    )
                );
            }
        );
    });


/* =====================================================
   HISTORY
===================================================== */

function renderHistory() {

    historyList.innerHTML = "";


    if (
        state.history.length === 0
    ) {

        historyList.innerHTML = `
            <div style="
                color:#687386;
                text-align:center;
                padding:35px 0;
                font-size:11px;
            ">
                No calculations yet.
            </div>
        `;

        return;
    }


    state.history.forEach(item => {

        const element =
            document.createElement(
                "div"
            );

        element.className =
            "history-item";


        const expression =
            document.createElement(
                "div"
            );

        expression.className =
            "history-expression";

        expression.textContent =
            item.expression;


        const answer =
            document.createElement(
                "div"
            );

        answer.className =
            "history-answer";

        answer.textContent =
            `= ${item.answer}`;


        element.append(
            expression,
            answer
        );


        element.addEventListener(
            "click",
            () => {

                state.expression =
                    item.expression;

                state.answer =
                    item.answer;

                closePanel(
                    historyPanel
                );

                updateDisplay();
            }
        );


        historyList.appendChild(
            element
        );
    });
}


document
    .getElementById("clearHistory")
    .addEventListener(
        "click",
        () => {

            state.history = [];

            renderHistory();
        }
    );


/* =====================================================
   HELP SEARCH
===================================================== */

document
    .getElementById("helpSearch")
    .addEventListener(
        "input",
        event => {

            const query =
                event.target.value
                    .toLowerCase()
                    .trim();


            document
                .querySelectorAll(
                    ".guide-card"
                )
                .forEach(card => {

                    card.style.display =
                        card.textContent
                            .toLowerCase()
                            .includes(query)
                                ? ""
                                : "none";
                });
        }
    );


/* =====================================================
   KEYBOARD
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            document.activeElement.tagName ===
            "INPUT" ||
            document.activeElement.tagName ===
            "SELECT"
        ) {

            return;
        }


        const key =
            event.key;


        if (
            key >= "0" &&
            key <= "9"
        ) {

            addValue(key);

            return;
        }


        if (key === "+") {

            addValue("+");

            return;
        }


        if (key === "-") {

            addValue("−");

            return;
        }


        if (key === "*") {

            addValue("×");

            return;
        }


        if (key === "/") {

            event.preventDefault();

            addValue("÷");

            return;
        }


        if (key === ".") {

            addValue(".");

            return;
        }


        if (
            key === "(" ||
            key === ")"
        ) {

            addValue(key);

            return;
        }


        if (
            key === "Enter" ||
            key === "="
        ) {

            event.preventDefault();

            calculate();

            return;
        }


        if (key === "Backspace") {

            backspace();

            return;
        }


        if (key === "Escape") {

            clear();

            return;
        }
    }
);


/* =====================================================
   INITIALIZE
===================================================== */

createMatrix(
    matrixA,
    2,
    "A"
);

createMatrix(
    matrixB,
    2,
    "B"
);

renderHistory();

updateDisplay();
