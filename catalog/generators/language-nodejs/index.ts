
import { cases } from 'core/template/transformers/cases';
import { BaseGenerator, BaseGeneratorProps } from 'core/catalog/types';
import {
    newApp,
    newRoute,
    setBuildContextDir,
    setBuildEnv, setDeploymentEnv,
    setMemoryResources,
    setPathHealthChecks
} from 'core/resources';
import { BUILDER_NODEJS_APP } from 'core/resources/images';

export interface NodejsLanguageProps extends BaseGeneratorProps {
    image: string;
    env?: object;
}

export default class LanguageNodejs extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: NodejsLanguageProps, extra: any = {}) {
        // Check if the gap file already exists, so we don't copy it twice
        if (!await this.filesCopied()) {
            await this.copy();
            await this.transform('gap', cases(props));
            const res = await newApp(
                props.serviceName,
                props.application,
                props.builderImage || BUILDER_NODEJS_APP,
                null,
                props.env || {});
            setBuildContextDir(res, props.subFolderName);
            setMemoryResources(res, { 'limit': '512Mi' });
            setPathHealthChecks(res, '/', '/');
            resources.add(res);
            return await newRoute(resources, props.routeName, props.application, props.serviceName);
        } else {
            setBuildEnv(resources, props.env, props.serviceName);
            setDeploymentEnv(resources, props.env, props.serviceName);
            return resources;
        }
    }
}
