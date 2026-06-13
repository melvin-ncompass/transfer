import * as assert from "assert";
import { OutputFormatter } from "../output-formatter";
import { initializeTelemetry } from "../../telemetry";

suite("OutputFormatter Test Suite", () => {
    initializeTelemetry();

    const validEraserBlock =
        "```eraser\ntitle My Architecture\n\nlayers {\n  backend [icon: server] {\n    api [label: \"API Layer\"]\n    database [icon: database, label: \"Database\"]\n  }\n}\n\napi > database\n```";

    test("on valid response, getEraserBlock is identity function", () => {
        runValidResponseTest(validEraserBlock, validEraserBlock);
    });

    test("on response with extra payload before block, getEraserBlock extracts the block", () => {
        const responseWithExtraPayloadBeforeBlock = "response with extra payload - before" + validEraserBlock;
        runValidResponseTest(responseWithExtraPayloadBeforeBlock, validEraserBlock);
    });

    test("on response with extra payload after block, getEraserBlock extracts the block", () => {
        const responseWithExtraPayloadAfterBlock = validEraserBlock + "response with extra payload - after";
        runValidResponseTest(responseWithExtraPayloadAfterBlock, validEraserBlock);
    });

    test("on response with extra payload before and after block, getEraserBlock extracts the block", () => {
        const responseWithExtraPayloadBeforeAndAfterBlock =
            "response with extra payload - before\n" + validEraserBlock + "\nresponse with extra payload - after";
        runValidResponseTest(responseWithExtraPayloadBeforeAndAfterBlock, validEraserBlock);
    });

    test("on response with no block, getEraserBlock throws", () => {
        const reponseWithNoBlock = "a response with no block";
        runInvalidResponseTest(reponseWithNoBlock);
    });

    test("on empty respone, getEraserBlock throws", () => {
        const emptyRepsonse = "";
        runInvalidResponseTest(emptyRepsonse);
    });

    function runValidResponseTest(llmResponse: string, expectedResult: string): void {
        const result = OutputFormatter.getEraserBlock(llmResponse);
        assert.equal(result, expectedResult);
    }

    function runInvalidResponseTest(llmResponse: string): void {
        assert.throws(
            () => OutputFormatter.getEraserBlock(llmResponse),
            Error,
            "No Eraser block found in the language model response. Please try again."
        );
    }
});
