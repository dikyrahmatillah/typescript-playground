require(['vs/editor/editor.main'], function () {
    const defaultTypeScriptCode = `// Welcome to TypeScript Playground
interface Person {
    firstName: string;
    lastName: string;
    age: number;
}

function greet(person: Person): string {
    return \`Hello, \${person.firstName} \${person.lastName}! 
You are \${person.age} years old.\`;
}

const people: Person = {
    firstName: "Ronald",
    lastName: "Pennington",
    age: 21
};

// Using optional chaining and nullish coalescing (TypeScript features)
const middleName: string | undefined = undefined;
const fullName = people.firstName + (middleName ?? " ") + people.lastName;

console.log(greet(people));
console.log("Full name:", fullName);

// Try different console methods
console.error("This is an error message");
console.warn("This is a warning message");
console.info("This is an info message");
`;

    const tsEditor = monaco.editor.create(document.getElementById('typescript-editor'), {
        value: defaultTypeScriptCode,
        language: 'typescript',
        theme: 'vs',
        automaticLayout: true,
        minimap: {
            enabled: true
        },
        fontSize: 14,
        scrollBeyondLastLine: false
    });

    const jsEditor = monaco.editor.create(document.getElementById('javascript-editor'), {
        value: '',
        language: 'javascript',
        theme: 'vs',
        readOnly: true,
        automaticLayout: true,
        minimap: {
            enabled: true
        },
        fontSize: 14,
        scrollBeyondLastLine: false
    });

    const consoleOutput = document.getElementById('console-output');
    const runBtn = document.getElementById('run-btn');
    const clearConsoleBtn = document.getElementById('clear-console-btn');
    const tsTarget = document.getElementById('ts-target');
    const tsModule = document.getElementById('ts-module');
    const tsStrict = document.getElementById('ts-strict');
    const tsNoImplicitAny = document.getElementById('ts-no-implicit-any');
    const tsRemoveComments = document.getElementById('ts-remove-comments');
    const tsDecorators = document.getElementById('ts-decorators');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const copyTsBtn = document.getElementById('copy-ts-btn');
    const copyJsBtn = document.getElementById('copy-js-btn');

    let isDarkMode = localStorage.getItem('darkMode') === 'true';

    updateTheme();

    function updateTheme() {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');

        document.body.classList.add('theme-transition');

        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 500);

        monaco.editor.setTheme(isDarkMode ? 'vs-dark' : 'vs');

        darkModeToggle.innerHTML = isDarkMode ?
            '<i class="fas fa-sun"></i>' :
            '<i class="fas fa-moon"></i>';

        localStorage.setItem('darkMode', isDarkMode);
    }

    darkModeToggle.addEventListener('click', function () {
        isDarkMode = !isDarkMode;
        updateTheme();
    });

    const customConsole = {
        log: function (...args) {
            appendToConsole('log', args);
        },
        error: function (...args) {
            appendToConsole('error', args);
        },
        warn: function (...args) {
            appendToConsole('warn', args);
        },
        info: function (...args) {
            appendToConsole('info', args);
        },
        clear: function () {
            clearConsole();
        }
    };

    function appendToConsole(type, args) {
        const logElement = document.createElement('div');
        logElement.className = `log ${type}`;

        const formattedOutput = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');

        logElement.textContent = formattedOutput;
        consoleOutput.appendChild(logElement);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    function clearConsole() {
        consoleOutput.innerHTML = '';
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(
            function () {
                showCopyToast('Copied to clipboard!');
            },
            function (err) {
                console.error('Could not copy text: ', err);
            }
        );
    }

    function showCopyToast(message) {
        let toast = document.querySelector('.copied-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'copied-toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(function () {
            toast.classList.remove('show');
        }, 2000);
    }

    copyTsBtn.addEventListener('click', function () {
        copyToClipboard(tsEditor.getValue());
    });

    copyJsBtn.addEventListener('click', function () {
        copyToClipboard(jsEditor.getValue());
    });

    function compileTypeScript() {
        const tsCode = tsEditor.getValue();

        try {
            const compilerOptions = {
                target: monaco.languages.typescript.ScriptTarget[tsTarget.value],
                module: monaco.languages.typescript.ModuleKind[tsModule.value] || monaco.languages.typescript.ModuleKind.CommonJS,
                noImplicitAny: tsNoImplicitAny.checked,
                removeComments: tsRemoveComments.checked,
                strict: tsStrict.checked,
                experimentalDecorators: tsDecorators.checked,
                emitDecoratorMetadata: tsDecorators.checked,
                preserveConstEnums: true,
                sourceMap: false,
                lib: ["es5", "es6", "dom"]
            };

            const result = window.ts.transpileModule(tsCode, {
                compilerOptions: compilerOptions,
                reportDiagnostics: true
            });

            jsEditor.setValue(result.outputText);

            if (result.diagnostics && result.diagnostics.length > 0) {
                console.error("TypeScript compilation errors:", result.diagnostics);
            }

            return result.outputText;
        } catch (error) {
            console.error("Error compiling TypeScript:", error);
            jsEditor.setValue(`// Error compiling TypeScript: ${error.message}`);
            return null;
        }
    }

    function runCode() {
        clearConsole();
        const compiledCode = compileTypeScript();

        if (!compiledCode) {
            customConsole.error("Failed to compile TypeScript code");
            return;
        }

        try {
            const executeCode = new Function('console', compiledCode);
            executeCode(customConsole);
        } catch (error) {
            customConsole.error(`Runtime error: ${error.message}`);
        }
    }

    compileTypeScript();

    runBtn.addEventListener('click', runCode);
    clearConsoleBtn.addEventListener('click', clearConsole);

    let debounceTimeout;
    tsEditor.onDidChangeModelContent(function () {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(compileTypeScript, 500);
    });

    tsTarget.addEventListener('change', compileTypeScript);
    tsModule.addEventListener('change', compileTypeScript);
    tsStrict.addEventListener('change', compileTypeScript);
    tsNoImplicitAny.addEventListener('change', compileTypeScript);
    tsRemoveComments.addEventListener('change', compileTypeScript);
    tsDecorators.addEventListener('change', compileTypeScript);

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        experimentalDecorators: true,
        lib: ["es5", "es6", "dom"]
    });
});