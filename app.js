"use strict";

/*
    CalcWise
    Beginner-friendly scientific calculator

    Important:
    This calculator uses a controlled mathematical parser.
    It does NOT directly execute user input as JavaScript.
*/


/* =========================================================
   STATE
========================================================= */

const state = {

    expression: "",

    answer: "0",

    previousAnswer: 0,

    memory: 0,

    angleMode: "DEG",

    currentMode: "basic",

    history: [],

    secondMode: false

};


/* =========================================================
   DOM
========================================================= */

const expressionEl =
    document.getElementById("expression");

const answerEl =
    document.getElementById("answer");

const angleIndicator =
    document.getElementById("angleIndicator");

const memoryIndicator =
    document.getElementById("memoryIndicator");

const displayHint =
    document.getElementById("displayHint");

const scientificPanel =
    document.getElementById("scientificPanel");

const advancedPanel =
    document.getElementById("advancedPanel");

const historyPanel =
    document.getElementById("historyPanel");

const helpPanel =
    document.getElementById("helpPanel");

const historyList =
    document.getElementById("historyList");

const toolModal =
    document.getElementById("toolModal");

const modalContent =
    document.getElementById("modalContent");


/* =========================================================
   DISPLAY
========================================================= */

function updateDisplay() {

    expressionEl.textContent =
        state.expression || "0";

    answerEl.textContent =
        state.answer || "0";

    angleIndicator.textContent =
        state.angleMode;

    memoryIndicator.textContent =
        state.memory !== 0
            ? `M ${formatNumber(state.memory)}`
            : "";

    if (!state.expression) {

        displayHint.textContent =
            "Try: 25 × 4 + 10";

    } else {

        displayHint.textContent =
            "Press = to calculate";

    }
}


function formatNumber(value) {

    if (!Number.isFinite(value)) {
        return "Error";
    }

    if (Math.abs(value) < 1e-12) {
        value = 0;
    }

    const rounded =
        Number(value.toPrecision(12));

    return rounded.toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 12
        }
    );
}


/* =========================================================
   INPUT
========================================================= */

function addValue(value) {

    /*
        If answer was just displayed and user enters
        a new number, start a new calculation.
    */

    if (
        state.expression === "" &&
        state.answer !== "0" &&
        /^[0-9.]$/.test(value)
    ) {
        state.answer = "0";
    }

    state.expression += value;

    updateDisplay();
}


function clearCalculator() {

    state.expression = "";
    state.answer = "0";

    updateDisplay();
}


function backspace() {

    state.expression =
        state.expression.slice(0, -1);

    updateDisplay();
}


function insertAnswer() {

    state.expression +=
        String(state.previousAnswer);

    updateDisplay();
}


/* =========================================================
   ANGLES
========================================================= */

function toRadians(value) {

    if (state.angleMode === "DEG") {
        return value * Math.PI / 180;
    }

    if (state.angleMode === "GRAD") {
        return value * Math.PI / 200;
    }

    return value;
}


function fromRadians(value) {

    if (state.angleMode === "DEG") {
        return value * 180 / Math.PI;
    }

    if (state.angleMode === "GRAD") {
        return value * 200 / Math.PI;
    }

    return value;
}


/* =========================================================
   MATH FUNCTIONS
========================================================= */

function factorial(n) {

    if (!Number.isFinite(n)) {
        throw new Error("Invalid factorial");
    }

    if (n < 0 || !Number.isInteger(n)) {
        throw new Error(
            "Factorial requires a whole number"
        );
    }

    if (n > 170) {
        throw new Error("Number too large");
    }

    let result = 1;

    for (let i = 2; i <= n; i++) {
        result *= i;
    }

    return result;
}


/* =========================================================
   TOKENIZER
========================================================= */

function tokenize(input) {

    const tokens = [];

    let i = 0;

    while (i < input.length) {

        const char = input[i];

        /* Ignore spaces */

        if (/\s/.test(char)) {
            i++;
            continue;
        }


        /* Numbers */

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

            const parsed =
                Number(number);

            if (!Number.isFinite(parsed)) {
                throw new Error(
                    "Invalid number"
                );
            }

            tokens.push({
                type: "number",
                value: parsed
            });

            continue;
        }


        /* Operators */

        if ("+-*/^%!".includes(char)) {

            tokens.push({
                type: "operator",
                value: char
            });

            i++;

            continue;
        }


        /* Parentheses */

        if (char === "(" || char === ")") {

            tokens.push({
                type: "paren",
                value: char
            });

            i++;

            continue;
        }


        /* Constants */

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


        /* Functions */

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


/* =========================================================
   PARSER
========================================================= */

function evaluateExpression(input) {

    const tokens =
        tokenize(input);

    let position = 0;


    function peek() {

        return tokens[position];
    }


    function consume() {

        return tokens[position++];
    }


    function parseExpression() {

        let value =
            parseTerm();

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
                parseTerm();

            if (operator === "+") {
                value += right;
            } else {
                value -= right;
            }
        }

        return value;
    }


    function parseTerm() {

        let value =
            parsePower();

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
                parsePower();

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


    function parsePower() {

        let value =
            parseUnary();

        if (
            peek() &&
            peek().value === "^"
        ) {

            consume();

            const exponent =
                parsePower();

            value =
                Math.pow(
                    value,
                    exponent
                );
        }

        return value;
    }


    function parseUnary() {

        if (
            peek() &&
            peek().value === "+"
        ) {

            consume();

            return +parseUnary();
        }


        if (
            peek() &&
            peek().value === "-"
        ) {

            consume();

            return -parseUnary();
        }

        return parsePostfix();
    }


    function parsePostfix() {

        let value =
            parsePrimary();

        while (peek()) {

            if (peek().value === "!") {

                consume();

                value =
                    factorial(value);

                continue;
            }


            if (peek().value === "%") {

                consume();

                value /= 100;

                continue;
            }

            break;
        }

        return value;
    }


    function parsePrimary() {

        const token =
            peek();

        if (!token) {
            throw new Error(
                "Incomplete expression"
            );
        }


        if (token.type === "number") {

            consume();

            return token.value;
        }


        if (token.type === "paren") {

            if (token.value === "(") {

                consume();

                const value =
                    parseExpression();

                if (
                    !peek() ||
                    peek().value !== ")"
                ) {

                    throw new Error(
                        "Missing closing bracket"
                    );
                }

                consume();

                return value;
            }
        }


        if (token.type === "function") {

            const name =
                consume().value;

            if (
                !peek() ||
                peek().value !== "("
            ) {

                throw new Error(
                    `${name} needs parentheses`
                );
            }

            consume();

            const argument =
                parseExpression();

            if (
                !peek() ||
                peek().value !== ")"
            ) {

                throw new Error(
                    "Missing closing bracket"
                );
            }

            consume();

            return applyFunction(
                name,
                argument
            );
        }


        throw new Error(
            "Unexpected input"
        );
    }


    const result =
        parseExpression();


    if (position < tokens.length) {

        throw new Error(
            "Unexpected input"
        );
    }


    if (!Number.isFinite(result)) {

        throw new Error(
            "Math error"
        );
    }


    return result;
}


/* =========================================================
   FUNCTIONS
========================================================= */

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
                    "Square root of a negative number"
                );
            }

            return Math.sqrt(value);

        case "log":

            if (value <= 0) {
                throw new Error(
                    "log requires a positive number"
                );
            }

            return Math.log10(value);

        case "ln":

            if (value <= 0) {
                throw new Error(
                    "ln requires a positive number"
                );
            }

            return Math.log(value);

        case "abs":
            return Math.abs(value);

        case "floor":
            return Math.floor(value);

        case "ceil":
            return Math.ceil(value);

        case "exp":
            return Math.exp(value);

        default:
            throw new Error(
                `Unknown function: ${name}`
            );
    }
}


/* =========================================================
   CALCULATE
========================================================= */

function calculate() {

    if (!state.expression) {
        return;
    }

    try {

        const result =
            evaluateExpression(
                state.expression
            );

        const formatted =
            formatNumber(result);

        state.answer =
            formatted;

        state.previousAnswer =
            result;

        addHistory(
            state.expression,
            formatted
        );

        updateDisplay();

    } catch (error) {

        state.answer =
            "Error";

        displayHint.textContent =
            error.message;

        updateDisplay();
    }
}


/* =========================================================
   HISTORY
========================================================= */

function addHistory(
    expression,
    answer
) {

    state.history.unshift({
        expression,
        answer
    });

    if (state.history.length > 50) {
        state.history.pop();
    }

    renderHistory();
}


function renderHistory() {

    historyList.innerHTML = "";

    if (state.history.length === 0) {

        historyList.innerHTML = `
            <div style="
                color:#8b95a7;
                font-size:12px;
                padding:25px 0;
                text-align:center;
            ">
                No calculations yet.
            </div>
        `;

        return;
    }


    state.history.forEach(item => {

        const element =
            document.createElement("div");

        element.className =
            "history-item";

        const expression =
            document.createElement("div");

        expression.className =
            "history-expression";

        expression.textContent =
            item.expression;

        const answer =
            document.createElement("div");

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


/* =========================================================
   MEMORY
========================================================= */

function memoryAction(action) {

    let value =
        Number(
            String(state.answer)
                .replaceAll(",", "")
        );

    if (!Number.isFinite(value)) {
        value = 0;
    }


    switch (action) {

        case "memory-clear":
            state.memory = 0;
            break;

        case "memory-recall":

            state.expression +=
                String(state.memory);

            break;

        case "memory-add":

            state.memory += value;

            break;

        case "memory-subtract":

            state.memory -= value;

            break;
    }

    updateDisplay();
}


/* =========================================================
   MODE SWITCHING
========================================================= */

document
    .querySelectorAll(".mode")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".mode")
                    .forEach(
                        b => b.classList.remove(
                            "active"
                        )
                    );

                button.classList.add(
                    "active"
                );


                state.currentMode =
                    button.dataset.mode;


                scientificPanel.classList.toggle(
                    "hidden",
                    state.currentMode !==
                    "scientific"
                );


                advancedPanel.classList.toggle(
                    "hidden",
                    state.currentMode !==
                    "advanced"
                );
            }
        );
    });


/* =========================================================
   ANGLE BUTTONS
========================================================= */

document
    .querySelectorAll(".angle")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".angle")
                    .forEach(
                        b => b.classList.remove(
                            "active"
                        )
                    );

                button.classList.add(
                    "active"
                );

                state.angleMode =
                    button.dataset.angle;

                updateDisplay();
            }
        );
    });


/* =========================================================
   KEYPAD
========================================================= */

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


                if (value !== undefined) {

                    addValue(value);

                    return;
                }


                if (action === "calculate") {
                    calculate();
                    return;
                }


                if (action === "clear") {
                    clearCalculator();
                    return;
                }


                if (action === "backspace") {
                    backspace();
                    return;
                }


                if (action === "ans") {
                    insertAnswer();
                    return;
                }


                if (
                    action === "memory-clear" ||
                    action === "memory-recall" ||
                    action === "memory-add" ||
                    action === "memory-subtract"
                ) {

                    memoryAction(action);
                }

            }
        );

    });


/* =========================================================
   SCIENTIFIC BUTTONS
========================================================= */

document
    .querySelectorAll(".function-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const value =
                    button.dataset.value;

                addValue(value);
            }
        );

    });


/* =========================================================
   SIDE PANELS
========================================================= */

function openPanel(panel) {

    panel.classList.add("open");

    panel.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closePanel(panel) {

    panel.classList.remove("open");

    panel.setAttribute(
        "aria-hidden",
        "true"
    );
}


document
    .getElementById("helpButton")
    .addEventListener(
        "click",
        () => openPanel(helpPanel)
    );


document
    .getElementById("historyButton")
    .addEventListener(
        "click",
        () => openPanel(historyPanel)
    );


document
    .getElementById("tipHelp")
    .addEventListener(
        "click",
        () => openPanel(helpPanel)
    );


document
    .querySelectorAll("[data-close]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const panel =
                    document.getElementById(
                        button.dataset.close
                    );

                closePanel(panel);
            }
        );
    });


/* =========================================================
   HELP SEARCH
========================================================= */

const helpSearch =
    document.getElementById(
        "helpSearch"
    );


helpSearch.addEventListener(
    "input",
    () => {

        const query =
            helpSearch.value
                .toLowerCase()
                .trim();


        document
            .querySelectorAll(
                ".help-section"
            )
            .forEach(section => {

                const text =
                    section.textContent
                        .toLowerCase();

                section.style.display =
                    text.includes(query)
                        ? ""
                        : "none";
            });
    }
);


/* =========================================================
   ADVANCED TOOLS
========================================================= */

document
    .querySelectorAll(".tool-card")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openTool(
                    button.dataset.tool
                );
            }
        );
    });


function openTool(tool) {

    toolModal.classList.add("open");

    toolModal.setAttribute(
        "aria-hidden",
        "false"
    );


    const tools = {

        equation: {
            title: "Equation Solver",
            description:
                "This mode will let you solve linear and polynomial equations.",
            example:
                "Example: 2x + 5 = 15 → x = 5"
        },

        matrix: {
            title: "Matrix Calculator",
            description:
                "Create matrices and perform addition, multiplication, determinant and inverse operations.",
            example:
                "Example: A × B"
        },

        statistics: {
            title: "Statistics",
            description:
                "Enter a data set to calculate mean, median, variance and standard deviation.",
            example:
                "Example: 4, 7, 8, 10, 12"
        },

        conversion: {
            title: "Conversions",
            description:
                "Convert between common mathematical and physical units.",
            example:
                "Example: 5 km → 5000 m"
        }

    };


    const selected =
        tools[tool];


    modalContent.innerHTML = `
        <div style="
            color:#4f46e5;
            font-size:32px;
            font-weight:800;
            margin-bottom:12px;
        ">
            ${selected.title}
        </div>

        <p style="
            color:#697386;
            font-size:13px;
            line-height:1.7;
        ">
            ${selected.description}
        </p>

        <div style="
            margin-top:18px;
            padding:14px;
            background:#f8fafc;
            border-radius:12px;
        ">

            <strong style="
                display:block;
                font-size:11px;
                color:#697386;
                margin-bottom:6px;
            ">
                EXAMPLE
            </strong>

            <code style="
                font-size:14px;
            ">
                ${selected.example}
            </code>

        </div>

        <p style="
            margin-top:18px;
            color:#697386;
            font-size:11px;
        ">
            This advanced module is ready to be connected
            to the full mathematics engine.
        </p>
    `;
}


document
    .getElementById("modalClose")
    .addEventListener(
        "click",
        () => {

            toolModal.classList.remove(
                "open"
            );

            toolModal.setAttribute(
                "aria-hidden",
                "true"
            );
        }
    );


toolModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            toolModal
        ) {

            toolModal.classList.remove(
                "open"
            );
        }
    }
);


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        /*
            Don't hijack typing into the Help search.
        */

        if (
            document.activeElement ===
            helpSearch
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

            clearCalculator();

            return;
        }

    }
);


/* =========================================================
   START
========================================================= */

renderHistory();

updateDisplay();
