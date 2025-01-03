import {timestamp} from "@/lib/lib-core";

export interface ProcessOutput {
    log(msg: any)

    error(msg: string | Error)

    write(data: any)
}

class BasicOutput implements ProcessOutput {
    private readonly debug: boolean;

    private readonly writeFunction: Function
    private readonly errorFunction: Function;
    private readonly newline: string;
    private readonly prefix: string;

    constructor(prefix: string, writeFunction, errorFunction, newline = '\n', debug = true) {
        this.prefix = prefix
        this.newline = newline
        this.writeFunction = writeFunction
        this.errorFunction = errorFunction
        this.debug = debug
    }

    write(msg: string) {
        this.writeFunction(msg)
    }

    error(msg: string | Error) {
        this.errorFunction(msg)
    }

    log(msg: any) {
        if (this.debug) {
            const pre = timestamp() + ': ' + this.prefix
            if (typeof msg === 'object') {
                this.writeFunction(pre)
                this.writeFunction(msg)
                this.writeFunction(this.newline)
            } else {
                this.writeFunction(pre + msg + this.newline)
            }
        }
    }
}

export function newClientOutput(prefix = '', debug = true): ProcessOutput {
    return new BasicOutput(prefix, console.info, console.error, '', debug)
}

