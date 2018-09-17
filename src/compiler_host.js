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
const dev = Math.floor(Math.random() * 10000);
class WebpackCompilerHost {
    constructor(_options, basePath, host) {
        this._options = _options;
        this._changedFiles = new Set();
        this._syncHost = new core_1.virtualFs.SyncDelegateHost(new core_1.virtualFs.CordHost(host));
        this._basePath = core_1.normalize(basePath);
    }
    get virtualFiles() {
        return this._syncHost.delegate
            .records()
            .filter(record => record.kind === 'create')
            .map((record) => record.path);
    }
    denormalizePath(path) {
        return core_1.getSystemPath(core_1.normalize(path));
    }
    resolve(path) {
        const p = core_1.normalize(path);
        if (core_1.isAbsolute(p)) {
            return p;
        }
        else {
            return core_1.join(this._basePath, p);
        }
    }
    resetChangedFileTracker() {
        this._changedFiles.clear();
    }
    getChangedFilePaths() {
        return [...this._changedFiles];
    }
    getNgFactoryPaths() {
        return this.virtualFiles
            .filter(fileName => fileName.endsWith('.ngfactory.js') || fileName.endsWith('.ngstyle.js'))
            // These paths are used by the virtual file system decorator so we must denormalize them.
            .map(path => this.denormalizePath(path));
    }
    invalidate(fileName) {
        const fullPath = this.resolve(fileName);
        if (this.fileExists(fileName)) {
            this._changedFiles.add(fullPath);
        }
    }
    fileExists(fileName, delegate = true) {
        const p = this.resolve(fileName);
        const exists = this._syncHost.exists(p) && this._syncHost.isFile(p);
        if (delegate) {
            return exists;
        }
        else {
            const backend = new core_1.virtualFs.SyncDelegateHost(this._syncHost.delegate.backend);
            return exists && !(backend.exists(p) && backend.isFile(p));
        }
    }
    readFile(fileName) {
        const filePath = this.resolve(fileName);
        if (!this._syncHost.exists(filePath) || !this._syncHost.isFile(filePath)) {
            return undefined;
        }
        return core_1.virtualFs.fileBufferToString(this._syncHost.read(filePath));
    }
    readFileBuffer(fileName) {
        const filePath = this.resolve(fileName);
        if (!this._syncHost.exists(filePath) || !this._syncHost.isFile(filePath)) {
            return undefined;
        }
        return Buffer.from(this._syncHost.read(filePath));
    }
    stat(path) {
        const p = this.resolve(path);
        const stats = this._syncHost.exists(p) && this._syncHost.stat(p);
        if (!stats) {
            return null;
        }
        return Object.assign({ isBlockDevice: () => false, isCharacterDevice: () => false, isFIFO: () => false, isSymbolicLink: () => false, isSocket: () => false, dev, ino: Math.floor(Math.random() * 100000), mode: parseInt('777', 8), nlink: 1, uid: 0, gid: 0, rdev: 0, blksize: 512, blocks: Math.ceil(stats.size / 512), atimeMs: stats.atime.getTime(), mtimeMs: stats.mtime.getTime(), ctimeMs: stats.ctime.getTime(), birthtimeMs: stats.birthtime.getTime() }, stats);
    }
    directoryExists(directoryName) {
        const p = this.resolve(directoryName);
        return this._syncHost.exists(p) && this._syncHost.isDirectory(p);
    }
    getDirectories(path) {
        const p = this.resolve(path);
        let delegated;
        try {
            delegated = this._syncHost.list(p).filter(x => {
                try {
                    return this._syncHost.isDirectory(core_1.join(p, x));
                }
                catch (_a) {
                    return false;
                }
            });
        }
        catch (_a) {
            delegated = [];
        }
        return delegated;
    }
    getSourceFile(fileName, languageVersion, onError) {
        try {
            const content = this.readFile(fileName);
            if (content != undefined) {
                return ts.createSourceFile(workaroundResolve(fileName), content, languageVersion, true);
            }
        }
        catch (e) {
            if (onError) {
                onError(e.message);
            }
        }
        return undefined;
    }
    getDefaultLibFileName(options) {
        return ts.createCompilerHost(options).getDefaultLibFileName(options);
    }
    // This is due to typescript CompilerHost interface being weird on writeFile. This shuts down
    // typings in WebStorm.
    get writeFile() {
        return (fileName, data, _writeByteOrderMark, onError, _sourceFiles) => {
            const p = this.resolve(fileName);
            try {
                this._syncHost.write(p, core_1.virtualFs.stringToFileBuffer(data));
            }
            catch (e) {
                if (onError) {
                    onError(e.message);
                }
            }
        };
    }
    getCurrentDirectory() {
        return this._basePath;
    }
    getCanonicalFileName(fileName) {
        const path = this.resolve(fileName);
        return this.useCaseSensitiveFileNames ? path : path.toLowerCase();
    }
    useCaseSensitiveFileNames() {
        return !process.platform.startsWith('win32');
    }
    getNewLine() {
        return '\n';
    }
    setResourceLoader(resourceLoader) {
        this._resourceLoader = resourceLoader;
    }
    readResource(fileName) {
        if (this._resourceLoader) {
            // These paths are meant to be used by the loader so we must denormalize them.
            const denormalizedFileName = this.denormalizePath(core_1.normalize(fileName));
            return this._resourceLoader.get(denormalizedFileName);
        }
        else {
            return this.readFile(fileName);
        }
    }
    trace(message) {
        console.log(message);
    }
}
exports.WebpackCompilerHost = WebpackCompilerHost;
// `TsCompilerAotCompilerTypeCheckHostAdapter` in @angular/compiler-cli seems to resolve module
// names directly via `resolveModuleName`, which prevents full Path usage.
// To work around this we must provide the same path format as TS internally uses in
// the SourceFile paths.
function workaroundResolve(path) {
    return core_1.getSystemPath(core_1.normalize(path)).replace(/\\/g, '/');
}
exports.workaroundResolve = workaroundResolve;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXJfaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIuLyIsInNvdXJjZXMiOlsicGFja2FnZXMvbmd0b29scy93ZWJwYWNrL3NyYy9jb21waWxlcl9ob3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7OztHQU1HO0FBQ0gsK0NBTzhCO0FBRTlCLGlDQUFpQztBQVNqQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQztBQUc5QyxNQUFhLG1CQUFtQjtJQU05QixZQUNVLFFBQTRCLEVBQ3BDLFFBQWdCLEVBQ2hCLElBQW9CO1FBRlosYUFBUSxHQUFSLFFBQVEsQ0FBb0I7UUFMOUIsa0JBQWEsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBU3hDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxnQkFBUyxDQUFDLGdCQUFnQixDQUFDLElBQUksZ0JBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5RSxJQUFJLENBQUMsU0FBUyxHQUFHLGdCQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELElBQVksWUFBWTtRQUN0QixPQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBK0I7YUFDbkQsT0FBTyxFQUFFO2FBQ1QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7YUFDMUMsR0FBRyxDQUFDLENBQUMsTUFBZ0MsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFRCxlQUFlLENBQUMsSUFBWTtRQUMxQixPQUFPLG9CQUFhLENBQUMsZ0JBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBWTtRQUNsQixNQUFNLENBQUMsR0FBRyxnQkFBUyxDQUFDLElBQUks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LFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELFVBQVU7UUFDUixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxjQUFxQztRQUNyRCxJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztJQUN4QyxDQUFDO0lBRUQsWUFBWSxDQUFDLFFBQWdCO1FBQzNCLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUN4Qiw4RUFBOEU7WUFDOUUsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUV2RSxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDdkQ7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNoQztJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsT0FBZTtRQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7Q0FDRjtBQWhPRCxrREFnT0M7QUFHRCwrRkFBK0Y7QUFDL0YsMEVBQTBFO0FBQzFFLG9GQUFvRjtBQUNwRix3QkFBd0I7QUFDeEIsU0FBZ0IsaUJBQWlCLENBQUMsSUFBbUI7SUFDbkQsT0FBTyxvQkFBYSxDQUFDLGdCQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFGRCw4Q0FFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7XG4gIFBhdGgsXG4gIGdldFN5c3RlbVBhdGgsXG4gIGlzQWJzb2x1dGUsXG4gIGpvaW4sXG4gIG5vcm1hbGl6ZSxcbiAgdmlydHVhbEZzLFxufSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBTdGF0cyB9IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHsgV2VicGFja1Jlc291cmNlTG9hZGVyIH0gZnJvbSAnLi9yZXNvdXJjZV9sb2FkZXInO1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgT25FcnJvckZuIHtcbiAgKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQ7XG59XG5cblxuY29uc3QgZGV2ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDApO1xuXG5cbmV4cG9ydCBjbGFzcyBXZWJwYWNrQ29tcGlsZXJIb3N0IGltcGxlbWVudHMgdHMuQ29tcGlsZXJIb3N0IHtcbiAgcHJpdmF0ZSBfc3luY0hvc3Q6IHZpcnR1YWxGcy5TeW5jRGVsZWdhdGVIb3N0O1xuICBwcml2YXRlIF9jaGFuZ2VkRmlsZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgcHJpdmF0ZSBfYmFzZVBhdGg6IFBhdGg7XG4gIHByaXZhdGUgX3Jlc291cmNlTG9hZGVyPzogV2VicGFja1Jlc291cmNlTG9hZGVyO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX29wdGlvbnM6IHRzLkNvbXBpbGVyT3B0aW9ucyxcbiAgICBiYXNlUGF0aDogc3RyaW5nLFxuICAgIGhvc3Q6IHZpcnR1YWxGcy5Ib3N0LFxuICApIHtcbiAgICB0aGlzLl9zeW5jSG9zdCA9IG5ldyB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdChuZXcgdmlydHVhbEZzLkNvcmRIb3N0KGhvc3QpKTtcbiAgICB0aGlzLl9iYXNlUGF0aCA9IG5vcm1hbGl6ZShiYXNlUGF0aCk7XG4gIH1cblxuICBwcml2YXRlIGdldCB2aXJ0dWFsRmlsZXMoKTogUGF0aFtdIHtcbiAgICByZXR1cm4gKHRoaXMuX3N5bmNIb3N0LmRlbGVnYXRlIGFzIHZpcnR1YWxGcy5Db3JkSG9zdClcbiAgICAgIC5yZWNvcmRzKClcbiAgICAgIC5maWx0ZXIocmVjb3JkID0+IHJlY29yZC5raW5kID09PSAnY3JlYXRlJylcbiAgICAgIC5tYXAoKHJlY29yZDogdmlydHVhbEZzLkNvcmRIb3N0Q3JlYXRlKSA9PiByZWNvcmQucGF0aCk7XG4gIH1cblxuICBkZW5vcm1hbGl6ZVBhdGgocGF0aDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGdldFN5c3RlbVBhdGgobm9ybWFsaXplKHBhdGgpKTtcbiAgfVxuXG4gIHJlc29sdmUocGF0aDogc3RyaW5nKTogUGF0aCB7XG4gICAgY29uc3QgcCA9IG5vcm1hbGl6ZShwYXRoKTtcbiAgICBpZiAoaXNBYnNvbHV0ZShwKSkge1xuICAgICAgcmV0dXJuIHA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBqb2luKHRoaXMuX2Jhc2VQYXRoLCBwKTtcbiAgICB9XG4gIH1cblxuICByZXNldENoYW5nZWRGaWxlVHJhY2tlcigpIHtcbiAgICB0aGlzLl9jaGFuZ2VkRmlsZXMuY2xlYXIoKTtcbiAgfVxuXG4gIGdldENoYW5nZWRGaWxlUGF0aHMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiBbLi4udGhpcy5fY2hhbmdlZEZpbGVzXTtcbiAgfVxuXG4gIGdldE5nRmFjdG9yeVBhdGhzKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy52aXJ0dWFsRmlsZXNcbiAgICAgIC5maWx0ZXIoZmlsZU5hbWUgPT4gZmlsZU5hbWUuZW5kc1dpdGgoJy5uZ2ZhY3RvcnkuanMnKSB8fCBmaWxlTmFtZS5lbmRzV2l0aCgnLm5nc3R5bGUuanMnKSlcbiAgICAgIC8vIFRoZXNlIHBhdGhzIGFyZSB1c2VkIGJ5IHRoZSB2aXJ0dWFsIGZpbGUgc3lzdGVtIGRlY29yYXRvciBzbyB3ZSBtdXN0IGRlbm9ybWFsaXplIHRoZW0uXG4gICAgICAubWFwKHBhdGggPT4gdGhpcy5kZW5vcm1hbGl6ZVBhdGgocGF0aCkpO1xuICB9XG5cbiAgaW52YWxpZGF0ZShmaWxlTmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZnVsbFBhdGggPSB0aGlzLnJlc29sdmUoZmlsZU5hbWUpO1xuXG4gICAgaWYgKHRoaXMuZmlsZUV4aXN0cyhmaWxlTmFtZSkpIHtcbiAgICAgIHRoaXMuX2NoYW5nZWRGaWxlcy5hZGQoZnVsbFBhdGgpO1xuICAgIH1cbiAgfVxuXG4gIGZpbGVFeGlzdHMoZmlsZU5hbWU6IHN0cmluZywgZGVsZWdhdGUgPSB0cnVlKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcCA9IHRoaXMucmVzb2x2ZShmaWxlTmFtZSk7XG5cbiAgICBjb25zdCBleGlzdHMgPSB0aGlzLl9zeW5jSG9zdC5leGlzdHMocCkgJiYgdGhpcy5fc3luY0hvc3QuaXNGaWxlKHApO1xuICAgIGlmIChkZWxlZ2F0ZSkge1xuICAgICAgcmV0dXJuIGV4aXN0cztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYmFja2VuZCA9IG5ldyB2aXJ0dWFsRnMuU3luY0RlbGVnYXRlSG9zdChcbiAgICAgICAgKHRoaXMuX3N5bmNIb3N0LmRlbGVnYXRlIGFzIHZpcnR1YWxGcy5Db3JkSG9zdCkuYmFja2VuZCBhcyB2aXJ0dWFsRnMuSG9zdCxcbiAgICAgICk7XG5cbiAgICAgIHJldHVybiBleGlzdHMgJiYgIShiYWNrZW5kLmV4aXN0cyhwKSAmJiBiYWNrZW5kLmlzRmlsZShwKSk7XG4gICAgfVxuICB9XG5cbiAgcmVhZEZpbGUoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgZmlsZVBhdGggPSB0aGlzLnJlc29sdmUoZmlsZU5hbWUpO1xuICAgIGlmICghdGhpcy5fc3luY0hvc3QuZXhpc3RzKGZpbGVQYXRoKSB8fCAhdGhpcy5fc3luY0hvc3QuaXNGaWxlKGZpbGVQYXRoKSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gdmlydHVhbEZzLmZpbGVCdWZmZXJUb1N0cmluZyh0aGlzLl9zeW5jSG9zdC5yZWFkKGZpbGVQYXRoKSk7XG4gIH1cblxuICByZWFkRmlsZUJ1ZmZlcihmaWxlTmFtZTogc3RyaW5nKTogQnVmZmVyIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHRoaXMucmVzb2x2ZShmaWxlTmFtZSk7XG4gICAgaWYgKCF0aGlzLl9zeW5jSG9zdC5leGlzdHMoZmlsZVBhdGgpIHx8ICF0aGlzLl9zeW5jSG9zdC5pc0ZpbGUoZmlsZVBhdGgpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiBCdWZmZXIuZnJvbSh0aGlzLl9zeW5jSG9zdC5yZWFkKGZpbGVQYXRoKSk7XG4gIH1cblxuICBzdGF0KHBhdGg6IHN0cmluZyk6IFN0YXRzIHwgbnVsbCB7XG4gICAgY29uc3QgcCA9IHRoaXMucmVzb2x2ZShwYXRoKTtcblxuICAgIGNvbnN0IHN0YXRzID0gdGhpcy5fc3luY0hvc3QuZXhpc3RzKHApICYmIHRoaXMuX3N5bmNIb3N0LnN0YXQocCk7XG4gICAgaWYgKCFzdGF0cykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGlzQmxvY2tEZXZpY2U6ICgpID0+IGZhbHNlLFxuICAgICAgaXNDaGFyYWN0ZXJEZXZpY2U6ICgpID0+IGZhbHNlLFxuICAgICAgaXNGSUZPOiAoKSA9PiBmYWxzZSxcbiAgICAgIGlzU3ltYm9saWNMaW5rOiAoKSA9PiBmYWxzZSxcbiAgICAgIGlzU29ja2V0OiAoKSA9PiBmYWxzZSxcbiAgICAgIGRldixcbiAgICAgIGlubzogTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDAwKSxcbiAgICAgIG1vZGU6IHBhcnNlSW50KCc3NzcnLCA4KSxcbiAgICAgIG5saW5rOiAxLFxuICAgICAgdWlkOiAwLFxuICAgICAgZ2lkOiAwLFxuICAgICAgcmRldjogMCxcbiAgICAgIGJsa3NpemU6IDUxMixcbiAgICAgIGJsb2NrczogTWF0aC5jZWlsKHN0YXRzLnNpemUgLyA1MTIpLFxuICAgICAgYXRpbWVNczogc3RhdHMuYXRpbWUuZ2V0VGltZSgpLFxuICAgICAgbXRpbWVNczogc3RhdHMubXRpbWUuZ2V0VGltZSgpLFxuICAgICAgY3RpbWVNczogc3RhdHMuY3RpbWUuZ2V0VGltZSgpLFxuICAgICAgYmlydGh0aW1lTXM6IHN0YXRzLmJpcnRodGltZS5nZXRUaW1lKCksXG4gICAgICAuLi5zdGF0cyxcbiAgICB9O1xuICB9XG5cbiAgZGlyZWN0b3J5RXhpc3RzKGRpcmVjdG9yeU5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHAgPSB0aGlzLnJlc29sdmUoZGlyZWN0b3J5TmFtZSk7XG5cbiAgICByZXR1cm4gdGhpcy5fc3luY0hvc3QuZXhpc3RzKHApICYmIHRoaXMuX3N5bmNIb3N0LmlzRGlyZWN0b3J5KHApO1xuICB9XG5cbiAgZ2V0RGlyZWN0b3JpZXMocGF0aDogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHAgPSB0aGlzLnJlc29sdmUocGF0aCk7XG5cbiAgICBsZXQgZGVsZWdhdGVkOiBzdHJpbmdbXTtcbiAgICB0cnkge1xuICAgICAgZGVsZWdhdGVkID0gdGhpcy5fc3luY0hvc3QubGlzdChwKS5maWx0ZXIoeCA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3N5bmNIb3N0LmlzRGlyZWN0b3J5KGpvaW4ocCwgeCkpO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgZGVsZWdhdGVkID0gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlbGVnYXRlZDtcbiAgfVxuXG4gIGdldFNvdXJjZUZpbGUoZmlsZU5hbWU6IHN0cmluZywgbGFuZ3VhZ2VWZXJzaW9uOiB0cy5TY3JpcHRUYXJnZXQsIG9uRXJyb3I/OiBPbkVycm9yRm4pIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29udGVudCA9IHRoaXMucmVhZEZpbGUoZmlsZU5hbWUpO1xuICAgICAgaWYgKGNvbnRlbnQgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB0cy5jcmVhdGVTb3VyY2VGaWxlKHdvcmthcm91bmRSZXNvbHZlKGZpbGVOYW1lKSwgY29udGVudCwgbGFuZ3VhZ2VWZXJzaW9uLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAob25FcnJvcikge1xuICAgICAgICBvbkVycm9yKGUubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGdldERlZmF1bHRMaWJGaWxlTmFtZShvcHRpb25zOiB0cy5Db21waWxlck9wdGlvbnMpIHtcbiAgICByZXR1cm4gdHMuY3JlYXRlQ29tcGlsZXJIb3N0KG9wdGlvbnMpLmdldERlZmF1bHRMaWJGaWxlTmFtZShvcHRpb25zKTtcbiAgfVxuXG4gIC8vIFRoaXMgaXMgZHVlIHRvIHR5cGVzY3JpcHQgQ29tcGlsZXJIb3N0IGludGVyZmFjZSBiZWluZyB3ZWlyZCBvbiB3cml0ZUZpbGUuIFRoaXMgc2h1dHMgZG93blxuICAvLyB0eXBpbmdzIGluIFdlYlN0b3JtLlxuICBnZXQgd3JpdGVGaWxlKCkge1xuICAgIHJldHVybiAoXG4gICAgICBmaWxlTmFtZTogc3RyaW5nLFxuICAgICAgZGF0YTogc3RyaW5nLFxuICAgICAgX3dyaXRlQnl0ZU9yZGVyTWFyazogYm9vbGVhbixcbiAgICAgIG9uRXJyb3I/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkLFxuICAgICAgX3NvdXJjZUZpbGVzPzogUmVhZG9ubHlBcnJheTx0cy5Tb3VyY2VGaWxlPixcbiAgICApOiB2b2lkID0+IHtcbiAgICAgIGNvbnN0IHAgPSB0aGlzLnJlc29sdmUoZmlsZU5hbWUpO1xuXG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLl9zeW5jSG9zdC53cml0ZShwLCB2aXJ0dWFsRnMuc3RyaW5nVG9GaWxlQnVmZmVyKGRhdGEpKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKG9uRXJyb3IpIHtcbiAgICAgICAgICBvbkVycm9yKGUubWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZ2V0Q3VycmVudERpcmVjdG9yeSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9iYXNlUGF0aDtcbiAgfVxuXG4gIGdldENhbm9uaWNhbEZpbGVOYW1lKGZpbGVOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IHBhdGggPSB0aGlzLnJlc29sdmUoZmlsZU5hbWUpO1xuXG4gICAgcmV0dXJuIHRoaXMudXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lcyA/IHBhdGggOiBwYXRoLnRvTG93ZXJDYXNlKCk7XG4gIH1cblxuICB1c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhcHJvY2Vzcy5wbGF0Zm9ybS5zdGFydHNXaXRoKCd3aW4zMicpO1xuICB9XG5cbiAgZ2V0TmV3TGluZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnXFxuJztcbiAgfVxuXG4gIHNldFJlc291cmNlTG9hZGVyKHJlc291cmNlTG9hZGVyOiBXZWJwYWNrUmVzb3VyY2VMb2FkZXIpIHtcbiAgICB0aGlzLl9yZXNvdXJjZUxvYWRlciA9IHJlc291cmNlTG9hZGVyO1xuICB9XG5cbiAgcmVhZFJlc291cmNlKGZpbGVOYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5fcmVzb3VyY2VMb2FkZXIpIHtcbiAgICAgIC8vIFRoZXNlIHBhdGhzIGFyZSBtZWFudCB0byBiZSB1c2VkIGJ5IHRoZSBsb2FkZXIgc28gd2UgbXVzdCBkZW5vcm1hbGl6ZSB0aGVtLlxuICAgICAgY29uc3QgZGVub3JtYWxpemVkRmlsZU5hbWUgPSB0aGlzLmRlbm9ybWFsaXplUGF0aChub3JtYWxpemUoZmlsZU5hbWUpKTtcblxuICAgICAgcmV0dXJuIHRoaXMuX3Jlc291cmNlTG9hZGVyLmdldChkZW5vcm1hbGl6ZWRGaWxlTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnJlYWRGaWxlKGZpbGVOYW1lKTtcbiAgICB9XG4gIH1cblxuICB0cmFjZShtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbiAgfVxufVxuXG5cbi8vIGBUc0NvbXBpbGVyQW90Q29tcGlsZXJUeXBlQ2hlY2tIb3N0QWRhcHRlcmAgaW4gQGFuZ3VsYXIvY29tcGlsZXItY2xpIHNlZW1zIHRvIHJlc29sdmUgbW9kdWxlXG4vLyBuYW1lcyBkaXJlY3RseSB2aWEgYHJlc29sdmVNb2R1bGVOYW1lYCwgd2hpY2ggcHJldmVudHMgZnVsbCBQYXRoIHVzYWdlLlxuLy8gVG8gd29yayBhcm91bmQgdGhpcyB3ZSBtdXN0IHByb3ZpZGUgdGhlIHNhbWUgcGF0aCBmb3JtYXQgYXMgVFMgaW50ZXJuYWxseSB1c2VzIGluXG4vLyB0aGUgU291cmNlRmlsZSBwYXRocy5cbmV4cG9ydCBmdW5jdGlvbiB3b3JrYXJvdW5kUmVzb2x2ZShwYXRoOiBQYXRoIHwgc3RyaW5nKSB7XG4gIHJldHVybiBnZXRTeXN0ZW1QYXRoKG5vcm1hbGl6ZShwYXRoKSkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xufVxuIl19