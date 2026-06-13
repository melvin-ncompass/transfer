import * as assert from "assert";
import { OutputFormatter } from "../output-formatter";
import { initializeTelemetry } from "../../telemetry";

suite("OutputFormatter Test Suite", () => {
    initializeTelemetry();

    const validD2Block =
        "```d2\nuser: {\n    label: \"User\\nSystem user\"\n    shape: person\n}\n\napi: {\n    label: \"API\\nApplication programming interface\"\n}\n\nuser -> api\n```";

    test("on valid response, getD2Block is identity function", () => {
        runValidResponseTest(validD2Block, validD2Block);
    });

    test("on response with extra payload before block, getD2Block extracts the block", () => {
        const responseWithExtraPayloadBeforeBlock = "response with extra payload - before" + validD2Block;
        runValidResponseTest(responseWithExtraPayloadBeforeBlock, validD2Block);
    });

    test("on response with extra payload after block, getD2Block extracts the block", () => {
        const responseWithExtraPayloadAfterBlock = validD2Block + "response with extra payload - after";
        runValidResponseTest(responseWithExtraPayloadAfterBlock, validD2Block);
    });

    test("on response with extra payload before and after block, getD2Block extracts the block", () => {
        const responseWithExtraPayloadBeforeAndAfterBlock =
            "response with extra payload - before\n" + validD2Block + "\nresponse with extra payload - after";
        runValidResponseTest(responseWithExtraPayloadBeforeAndAfterBlock, validD2Block);
    });

    test("on response with no block, getD2Block throws", () => {
        const reponseWithNoBlock = "a response with no block";
        runInvalidResponseTest(reponseWithNoBlock);
    });

    test("on empty respone, getD2Block throws", () => {
        const emptyRepsonse = "";
        runInvalidResponseTest(emptyRepsonse);
    });

    function runValidResponseTest(llmResponse: string, expectedResult: string): void {
        const result = OutputFormatter.getD2Block(llmResponse);
        assert.equal(result, expectedResult);
    }

    function runInvalidResponseTest(llmResponse: string): void {
        assert.throws(
            () => OutputFormatter.getD2Block(llmResponse),
            Error,
            "No D2 block found in the language model response. Please try again."
        );
    }
});
