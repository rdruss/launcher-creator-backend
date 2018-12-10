
import { newApp, setMemoryResources } from 'core/resources';
import { BaseGenerator, BaseGeneratorProps } from 'core/catalog/types';
import { DatabaseSecretRef } from 'generators/database-secret';

export interface DatabasePostgresqlProps extends BaseGeneratorProps, DatabaseSecretRef {
}

export default class DatabasePostgresql extends BaseGenerator {
    public static readonly sourceDir: string = __dirname;

    public async apply(resources, props: DatabasePostgresqlProps, extra: any = {}) {
        const dbImage = 'postgresql';
        extra.databaseImage = dbImage;
        extra.databaseService = props.serviceName;

        // Check that the database doesn't already exist
        if (!resources.service(props.serviceName)) {
            // Create the database resource definitions
            const res = await newApp(props.serviceName, props.application, dbImage, null, {
                'POSTGRESQL_DATABASE': { 'secret': props.secretName, 'key': 'database' },
                'POSTGRESQL_USER': { 'secret': props.secretName, 'key': 'user' },
                'POSTGRESQL_PASSWORD': { 'secret': props.secretName, 'key': 'password' }
            });
            setMemoryResources(res, { 'limit': '512Mi' });
            resources.add(res);
        }
        return resources;
    }
}
