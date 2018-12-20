"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
const core_1 = require("@angular-devkit/core");
const ts = require("typescript");
const compiler_host_1 = require("../compiler_host");
// Find all nodes from the AST in the subtree of node of SyntaxKind kind.
function collectDeepNodes(node, kind) {
    const nodes = [];
    const helper = (child) => {
        if (child.kind === kind) {
            nodes.push(child);
        }
        ts.forEachChild(child, helper);
    };
    ts.forEachChild(node, helper);
    return nodes;
}
exports.collectDeepNodes = collectDeepNodes;
function getFirstNode(sourceFile) {
    if (sourceFile.statements.length > 0) {
        return sourceFile.statements[0];
    }
    return sourceFile.getChildAt(0);
}
exports.getFirstNode = getFirstNode;
function getLastNode(sourceFile) {
    if (sourceFile.statements.length > 0) {
        return sourceFile.statements[sourceFile.statements.length - 1] || null;
    }
    return null;
}
exports.getLastNode = getLastNode;
// Test transform helpers.
const basePath = '/project/src/';
const fileName = basePath + 'test-file.ts';
function createTypescriptContext(content, additionalFiles) {
    // Set compiler options.
    const compilerOptions = {
        noEmitOnError: false,
        allowJs: true,
        newLine: ts.NewLineKind.LineFeed,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        target: ts.ScriptTarget.ESNext,
        skipLibCheck: true,
        sourceMap: false,
        importHelpers: true,
    };
    // Create compiler host.
    const compilerHost = new compiler_host_1.WebpackCompilerHost(compilerOptions, basePath, new core_1.virtualFs.SimpleMemoryHost(), false);
    // Add a dummy file to host content.
    compilerHost.writeFile(fileName, content, false);
    if (additionalFiles) {
        for (const key in additionalFiles) {
            compilerHost.writeFile(basePath + key, additionalFiles[key], false);
        }
    }
    // Create the TypeScript program.
    const program = ts.createProgram([fileName], compilerOptions, compilerHost);
    return { compilerHost, program };
}
exports.createTypescriptContext = createTypescriptContext;
function transformTypescript(content, transformers, program, compilerHost) {
    // Use given context or create a new one.
    if (content !== undefined) {
        const typescriptContext = createTypescriptContext(content);
        program = typescriptContext.program;
        compilerHost = typescriptContext.compilerHost;
    }
    else if (!program || !compilerHost) {
        throw new Error('transformTypescript needs either `content` or a `program` and `compilerHost');
    }
    // Emit.
    const { emitSkipped, diagnostics } = program.emit(undefined, undefined, undefined, undefined, { before: transformers });
    // Log diagnostics if emit wasn't successfull.
    if (emitSkipped) {
        console.error(diagnostics);
        return null;
    }
    // Return the transpiled js.
    return compilerHost.readFile(fileName.replace(/\.tsx?$/, '.js'));
}
exports.transformTypescript = transformTypescript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0X2hlbHBlcnMuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvdHJhbnNmb3JtZXJzL2FzdF9oZWxwZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBQWlEO0FBQ2pELGlDQUFpQztBQUNqQyxvREFBdUQ7QUFHdkQseUVBQXlFO0FBQ3pFLFNBQWdCLGdCQUFnQixDQUFvQixJQUFhLEVBQUUsSUFBbUI7SUFDcEYsTUFBTSxLQUFLLEdBQVEsRUFBRSxDQUFDO0lBQ3RCLE1BQU0sTUFBTSxHQUFHLENBQUMsS0FBYyxFQUFFLEVBQUU7UUFDaEMsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtZQUN2QixLQUFLLENBQUMsSUFBSSxDQUFDLEtBQVUsQ0FBQyxDQUFDO1NBQ3hCO1FBQ0QsRUFBRSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDakMsQ0FBQyxDQUFDO0lBQ0YsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFOUIsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBWEQsNENBV0M7QUFFRCxTQUFnQixZQUFZLENBQUMsVUFBeUI7SUFDcEQsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDcEMsT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2pDO0lBRUQsT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLENBQUM7QUFORCxvQ0FNQztBQUVELFNBQWdCLFdBQVcsQ0FBQyxVQUF5QjtJQUNuRCxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUNwQyxPQUFPLFVBQVUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO0tBQ3hFO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBTkQsa0NBTUM7QUFHRCwwQkFBMEI7QUFDMUIsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDO0FBQ2pDLE1BQU0sUUFBUSxHQUFHLFFBQVEsR0FBRyxjQUFjLENBQUM7QUFFM0MsU0FBZ0IsdUJBQXVCLENBQUMsT0FBZSxFQUFFLGVBQXdDO0lBQy9GLHdCQUF3QjtJQUN4QixNQUFNLGVBQWUsR0FBdUI7UUFDMUMsYUFBYSxFQUFFLEtBQUs7UUFDcEIsT0FBTyxFQUFFLElBQUk7UUFDYixPQUFPLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRO1FBQ2hDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNO1FBQ2hELE1BQU0sRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU07UUFDOUIsWUFBWSxFQUFFLElBQUk7UUFDbEIsU0FBUyxFQUFFLEtBQUs7UUFDaEIsYUFBYSxFQUFFLElBQUk7S0FDcEIsQ0FBQztJQUVGLHdCQUF3QjtJQUN4QixNQUFNLFlBQVksR0FBRyxJQUFJLG1DQUFtQixDQUMxQyxlQUFlLEVBQ2YsUUFBUSxFQUNSLElBQUksZ0JBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxFQUNoQyxLQUFLLENBQ04sQ0FBQztJQUVGLG9DQUFvQztJQUNwQyxZQUFZLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFakQsSUFBSSxlQUFlLEVBQUU7UUFDbkIsS0FBSyxNQUFNLEdBQUcsSUFBSSxlQUFlLEVBQUU7WUFDakMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsR0FBRyxFQUFFLGVBQWUsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNyRTtLQUNGO0lBRUQsaUNBQWlDO0lBQ2pDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFFNUUsT0FBTyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQztBQUNuQyxDQUFDO0FBbENELDBEQWtDQztBQUVELFNBQWdCLG1CQUFtQixDQUNqQyxPQUEyQixFQUMzQixZQUFvRCxFQUNwRCxPQUFvQixFQUNwQixZQUFrQztJQUdsQyx5Q0FBeUM7SUFDekMsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFO1FBQ3pCLE1BQU0saUJBQWlCLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0QsT0FBTyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQztRQUNwQyxZQUFZLEdBQUcsaUJBQWlCLENBQUMsWUFBWSxDQUFDO0tBQy9DO1NBQU0sSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLFlBQVksRUFBRTtRQUNwQyxNQUFNLElBQUksS0FBSyxDQUFDLDZFQUE2RSxDQUFDLENBQUM7S0FDaEc7SUFFRCxRQUFRO0lBQ1IsTUFBTSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUMvQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLENBQ3JFLENBQUM7SUFFRiw4Q0FBOEM7SUFDOUMsSUFBSSxXQUFXLEVBQUU7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTNCLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFFRCw0QkFBNEI7SUFDNUIsT0FBTyxZQUFZLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDbkUsQ0FBQztBQTlCRCxrREE4QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyB2aXJ0dWFsRnMgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7IFdlYnBhY2tDb21waWxlckhvc3QgfSBmcm9tICcuLi9jb21waWxlcl9ob3N0JztcblxuXG4vLyBGaW5kIGFsbCBub2RlcyBmcm9tIHRoZSBBU1QgaW4gdGhlIHN1YnRyZWUgb2Ygbm9kZSBvZiBTeW50YXhLaW5kIGtpbmQuXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdERlZXBOb2RlczxUIGV4dGVuZHMgdHMuTm9kZT4obm9kZTogdHMuTm9kZSwga2luZDogdHMuU3ludGF4S2luZCk6IFRbXSB7XG4gIGNvbnN0IG5vZGVzOiBUW10gPSBbXTtcbiAgY29uc3QgaGVscGVyID0gKGNoaWxkOiB0cy5Ob2RlKSA9PiB7XG4gICAgaWYgKGNoaWxkLmtpbmQgPT09IGtpbmQpIHtcbiAgICAgIG5vZGVzLnB1c2goY2hpbGQgYXMgVCk7XG4gICAgfVxuICAgIHRzLmZvckVhY2hDaGlsZChjaGlsZCwgaGVscGVyKTtcbiAgfTtcbiAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIGhlbHBlcik7XG5cbiAgcmV0dXJuIG5vZGVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Rmlyc3ROb2RlKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiB0cy5Ob2RlIHtcbiAgaWYgKHNvdXJjZUZpbGUuc3RhdGVtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHNvdXJjZUZpbGUuc3RhdGVtZW50c1swXTtcbiAgfVxuXG4gIHJldHVybiBzb3VyY2VGaWxlLmdldENoaWxkQXQoMCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0Tm9kZShzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdHMuTm9kZSB8IG51bGwge1xuICBpZiAoc291cmNlRmlsZS5zdGF0ZW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gc291cmNlRmlsZS5zdGF0ZW1lbnRzW3NvdXJjZUZpbGUuc3RhdGVtZW50cy5sZW5ndGggLSAxXSB8fCBudWxsO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLy8gVGVzdCB0cmFuc2Zvcm0gaGVscGVycy5cbmNvbnN0IGJhc2VQYXRoID0gJy9wcm9qZWN0L3NyYy8nO1xuY29uc3QgZmlsZU5hbWUgPSBiYXNlUGF0aCArICd0ZXN0LWZpbGUudHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHlwZXNjcmlwdENvbnRleHQoY29udGVudDogc3RyaW5nLCBhZGRpdGlvbmFsRmlsZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSB7XG4gIC8vIFNldCBjb21waWxlciBvcHRpb25zLlxuICBjb25zdCBjb21waWxlck9wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucyA9IHtcbiAgICBub0VtaXRPbkVycm9yOiBmYWxzZSxcbiAgICBhbGxvd0pzOiB0cnVlLFxuICAgIG5ld0xpbmU6IHRzLk5ld0xpbmVLaW5kLkxpbmVGZWVkLFxuICAgIG1vZHVsZVJlc29sdXRpb246IHRzLk1vZHVsZVJlc29sdXRpb25LaW5kLk5vZGVKcyxcbiAgICB0YXJnZXQ6IHRzLlNjcmlwdFRhcmdldC5FU05leHQsXG4gICAgc2tpcExpYkNoZWNrOiB0cnVlLFxuICAgIHNvdXJjZU1hcDogZmFsc2UsXG4gICAgaW1wb3J0SGVscGVyczogdHJ1ZSxcbiAgfTtcblxuICAvLyBDcmVhdGUgY29tcGlsZXIgaG9zdC5cbiAgY29uc3QgY29tcGlsZXJIb3N0ID0gbmV3IFdlYnBhY2tDb21waWxlckhvc3QoXG4gICAgY29tcGlsZXJPcHRpb25zLFxuICAgIGJhc2VQYXRoLFxuICAgIG5ldyB2aXJ0dWFsRnMuU2ltcGxlTWVtb3J5SG9zdCgpLFxuICAgIGZhbHNlLFxuICApO1xuXG4gIC8vIEFkZCBhIGR1bW15IGZpbGUgdG8gaG9zdCBjb250ZW50LlxuICBjb21waWxlckhvc3Qud3JpdGVGaWxlKGZpbGVOYW1lLCBjb250ZW50LCBmYWxzZSk7XG5cbiAgaWYgKGFkZGl0aW9uYWxGaWxlcykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIGFkZGl0aW9uYWxGaWxlcykge1xuICAgICAgY29tcGlsZXJIb3N0LndyaXRlRmlsZShiYXNlUGF0aCArIGtleSwgYWRkaXRpb25hbEZpbGVzW2tleV0sIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICAvLyBDcmVhdGUgdGhlIFR5cGVTY3JpcHQgcHJvZ3JhbS5cbiAgY29uc3QgcHJvZ3JhbSA9IHRzLmNyZWF0ZVByb2dyYW0oW2ZpbGVOYW1lXSwgY29tcGlsZXJPcHRpb25zLCBjb21waWxlckhvc3QpO1xuXG4gIHJldHVybiB7IGNvbXBpbGVySG9zdCwgcHJvZ3JhbSB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtVHlwZXNjcmlwdChcbiAgY29udGVudDogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICB0cmFuc2Zvcm1lcnM6IHRzLlRyYW5zZm9ybWVyRmFjdG9yeTx0cy5Tb3VyY2VGaWxlPltdLFxuICBwcm9ncmFtPzogdHMuUHJvZ3JhbSxcbiAgY29tcGlsZXJIb3N0PzogV2VicGFja0NvbXBpbGVySG9zdCxcbikge1xuXG4gIC8vIFVzZSBnaXZlbiBjb250ZXh0IG9yIGNyZWF0ZSBhIG5ldyBvbmUuXG4gIGlmIChjb250ZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCB0eXBlc2NyaXB0Q29udGV4dCA9IGNyZWF0ZVR5cGVzY3JpcHRDb250ZXh0KGNvbnRlbnQpO1xuICAgIHByb2dyYW0gPSB0eXBlc2NyaXB0Q29udGV4dC5wcm9ncmFtO1xuICAgIGNvbXBpbGVySG9zdCA9IHR5cGVzY3JpcHRDb250ZXh0LmNvbXBpbGVySG9zdDtcbiAgfSBlbHNlIGlmICghcHJvZ3JhbSB8fCAhY29tcGlsZXJIb3N0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd0cmFuc2Zvcm1UeXBlc2NyaXB0IG5lZWRzIGVpdGhlciBgY29udGVudGAgb3IgYSBgcHJvZ3JhbWAgYW5kIGBjb21waWxlckhvc3QnKTtcbiAgfVxuXG4gIC8vIEVtaXQuXG4gIGNvbnN0IHsgZW1pdFNraXBwZWQsIGRpYWdub3N0aWNzIH0gPSBwcm9ncmFtLmVtaXQoXG4gICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB7IGJlZm9yZTogdHJhbnNmb3JtZXJzIH0sXG4gICk7XG5cbiAgLy8gTG9nIGRpYWdub3N0aWNzIGlmIGVtaXQgd2Fzbid0IHN1Y2Nlc3NmdWxsLlxuICBpZiAoZW1pdFNraXBwZWQpIHtcbiAgICBjb25zb2xlLmVycm9yKGRpYWdub3N0aWNzKTtcblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gUmV0dXJuIHRoZSB0cmFuc3BpbGVkIGpzLlxuICByZXR1cm4gY29tcGlsZXJIb3N0LnJlYWRGaWxlKGZpbGVOYW1lLnJlcGxhY2UoL1xcLnRzeD8kLywgJy5qcycpKTtcbn1cbiJdfQ==