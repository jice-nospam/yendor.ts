module tsUnit {
    export interface ITestClass {

    }

    export class Test {
        private tests: TestDefintion[] = [];
        private testClass: TestClass = new TestClass();

        addTestClass(testClass: ITestClass, name: string = 'Tests'): void {
            this.tests.push(new TestDefintion(testClass, name));
        }

        isReservedFunctionName(functionName: string): boolean {
            for (var prop in this.testClass) {
                if (prop === functionName) {
                    return true;
                }
            }
            return false;
        }

        run() {
            var testContext = new TestContext();
            var testResult = new TestResult();

            for (var i = 0; i < this.tests.length; ++i) {
                var testClass = this.tests[i].testClass;
                var testName = this.tests[i].name;
                for (var prop in testClass) {
                    if (!this.isReservedFunctionName(prop)) {
                        if (typeof testClass[prop] === 'function') {
                            if (typeof testClass['setUp'] === 'function') {
                                testClass['setUp']();
                            }
                            try {
                                testClass[prop](testContext);
                                testResult.passes.push(new TestDescription(testName, prop, 'OK'));
                            } catch (err) {
                                testResult.errors.push(new TestDescription(testName, prop, err));
                            }
                            if (typeof testClass['tearDown'] === 'function') {
                                testClass['tearDown']();
                            }
                        }
                    }
                }
            }

            return testResult;
        }

        showResults(target: HTMLElement, result: TestResult) {
            var template = '<article>' +
                '<h1>' + this.getTestResult(result) + '</h1>' +
                '<p>' + this.getTestSummary(result) + '</p>' +
                '<section id="tsFail">' +
                '<h2>Errors</h2>' +
                '<ul class="bad">' + this.getTestResultList(result.errors) + '</ul>' +
                '</section>' +
                '<section id="tsOkay">' +
                '<h2>Passing Tests</h2>' +
                '<ul class="good">' + this.getTestResultList(result.passes) + '</ul>' +
                '</section>' +
                '</article>';

            target.innerHTML = template;
        }

        private getTestResult(result: TestResult) {
            return result.errors.length === 0 ? 'Test Passed' : 'Test Failed';
        }

        private getTestSummary(result: TestResult) {
            return 'Total tests: <span id="tsUnitTotalCout">' + (result.passes.length + result.errors.length).toString() + '</span>. ' +
                'Passed tests: <span id="tsUnitPassCount" class="good">' + result.passes.length + '</span>. ' +
                'Failed tests: <span id="tsUnitFailCount" class="bad">' + result.errors.length + '</span>.';
        }

        private getTestResultList(testResults: TestDescription[]) {
            var list = '';
            var group = '';
            var isFirst = true;
            for (var i = 0; i < testResults.length; ++i) {
                var result = testResults[i];
                if (result.testName !== group) {
                    group = result.testName;
                    if (isFirst) {
                        isFirst = false;
                    } else {
                        list += '</li></ul>';
                    }
                    list += '<li>' + result.testName + '<ul>';
                }
                list += '<li>' + result.funcName + '(): ' + this.encodeHtmlEntities(result.message) + '</li>';
            }
            return list + '</ul>';
        }

        private encodeHtmlEntities(input: string) {
            var entitiesToReplace = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
            input.replace(/[&<>]/g, function (entity) { return entitiesToReplace[entity] || entity; });
            return input;
        }
    }

    export class TestContext {
        setUp() {
        }

        tearDown() {
        }

        areIdentical(a: any, b: any, msg?:string): void {
            if (a !== b) {
                throw (msg ? msg : '') +
                    ' {' + (typeof a) + '} "' + a + '" instead of ' +
                    '{' + (typeof b) + '} "' + b + '"';
            }
        }

        areNotIdentical(a: any, b: any): void {
            if (a === b) {
                throw 'areNotIdentical failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '" and ' +
                    '{' + (typeof b) + '} "' + b + '"';
            }
        }

        isTrue(a: boolean, msg?: string) {
            if (!a) {
                throw msg ? msg : 'failed assertion';
            }
        }

        isFalse(a: boolean, msg?: string) {
            if (a) {
                throw msg ? msg : 'failed assertion';
            }
        }

        isTruthy(a: any) {
            if (!a) {
                throw 'isTrue failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '"';
            }
        }

        isFalsey(a: any) {
            if (a) {
                throw 'isFalse failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '"';
            }
        }

        throws(a: { (): void; }) {
            var isThrown = false;
            try {
                a();
            } catch (ex) {
                isThrown = true;
            }
            if (!isThrown) {
                throw 'did not throw an error';
            }
        }

        fail() {
            throw 'fail';
        }
    }

    export class TestClass extends TestContext {

    }

    export class FakeFunction {
        constructor(public name: string, public delgate: { (...args: any[]): any; }) {
        }
    }

    export class Fake {
        constructor(obj: any) {
            for (var prop in obj) {
                if (typeof obj[prop] === 'function') {
                    this[prop] = function () { };
                } else {
                    this[prop] = null;
                }
            }
        }

        create(): any {
            return this;
        }

        addFunction(name: string, delegate: { (...args: any[]): any; }) {
            this[name] = delegate;
        }

        addProperty(name: string, value: any) {
            this[name] = value;
        }
    }

    class TestDefintion {
        constructor(public testClass: ITestClass, public name: string) {
        }
    }

    class TestError implements Error {
        constructor(public name: string, public message: string) {
        }
    }

    export class TestDescription {
        constructor(public testName: string, public funcName: string, public message: string) {
        }
    }

    export class TestResult {
        public passes: TestDescription[] = [];
        public errors: TestDescription[] = [];
    }
}