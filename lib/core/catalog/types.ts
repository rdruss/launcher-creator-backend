
import { Resources } from 'core/resources';
import { join } from 'path';
import { copy } from 'fs-extra';
import { accessSync } from 'fs';

import { walk } from 'core/utils';
import { transformFiles } from 'core/template';
import { mergePoms, updateGav } from 'core/maven';
import { mergePackageJson } from 'core/nodejs';

export interface DeploymentDescriptor {
    applications: [{
        application: string;
        shared?: object;
        extra?: object;
        capabilities: [{
            module: string;
            props?: object;
            extra?: object;
        }];
    }];
}

export interface Runtime {
    name: string;
    version?: string;
}

export function toRuntime(arg: string) {
    const parts = arg.split('/', 2);
    const runtime: Runtime = { 'name': parts[0] };
    if (parts.length > 1) {
        runtime.version = parts[1];
    }
    return runtime;
}

interface CatalogItem {
    readonly sourceDir: string;

    apply(resources: Resources, props?: object, extra?: object): Promise<Resources>;
}

abstract class BaseCatalogItem implements CatalogItem {
    private readonly _sourceDir;

    constructor(public readonly generator: (genConst) => Generator, public readonly targetDir) {
        this._sourceDir = this.constructor['sourceDir'];
        if (!this._sourceDir) {
            throw new Error(`Class ${this.constructor.name} is missing static field "sourceDir"!`);
        }
    }

    public get sourceDir(): string {
        return this._sourceDir;
    }

    public abstract async apply(resources: Resources, props?: object, extra?: object): Promise<Resources>;

    protected copy(from: string = 'files', to?: string): Promise<void> {
        const from2 = join(this.sourceDir, from);
        const to2 = !!to ? join(this.targetDir, to) : this.targetDir;
        return copy(from2, to2);
    }

    protected filesCopied(from: string = 'files', to?: string): Promise<boolean> {
        const from2 = join(this.sourceDir, from);
        const to2 = !!to ? join(this.targetDir, to) : this.targetDir;
        return new Promise<boolean>((resolve, reject) => {
            resolve(walk(from2, f => {
                try {
                    accessSync(join(to2, f.path));
                } catch (ex) {
                    return false;
                }
            }));
        });
    }

    protected transform(pattern: string | string[], transformLine: (line: string) => string | string[]): Promise<number> {
        let pattern2;
        if (typeof pattern === 'string') {
            pattern2 = join(this.targetDir, pattern);
        } else {
            // TODO fix array elements too
            pattern2 = pattern;
        }
        return transformFiles(pattern2, transformLine);
    }

    protected updateGav(groupId, artifactId, version, pomFile = 'pom.xml') {
        return updateGav(join(this.targetDir, pomFile), groupId, artifactId, version);
    }

    protected mergePoms(sourcePom = 'merge/pom.xml', targetPom = 'pom.xml') {
        return mergePoms(join(this.targetDir, targetPom), join(this.sourceDir, sourcePom));
    }

    protected mergePackageJson(source = 'merge/package.json', target = 'package.json') {
        return mergePackageJson(join(this.targetDir, target), join(this.sourceDir, source));
    }
}

interface Capability extends CatalogItem {
    postApply(resources: Resources, props?: any, deployment?: any): Promise<Resources>;
}

export interface BaseGeneratorProps {
    application: string;
    serviceName: string;
}

interface Generator extends CatalogItem {
}

export abstract class BaseGenerator extends BaseCatalogItem implements Generator {
}

export abstract class BaseCapability extends BaseCatalogItem implements Capability {
    public async postApply(resources: Resources, props?: object, deployment?: DeploymentDescriptor): Promise<Resources> {
        return resources;
    }
}
