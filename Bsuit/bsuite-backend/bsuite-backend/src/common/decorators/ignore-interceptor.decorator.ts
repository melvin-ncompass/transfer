import { SetMetadata } from '@nestjs/common';

export const IGNORE_INTERCEPTOR = 'ignoreInterceptor';
export const IgnoreInterceptor = () => SetMetadata(IGNORE_INTERCEPTOR, true);

export const IGNORE_MODULE = 'ignoreModule';
export const ignoreModuleClassInterceptor = () => SetMetadata(IGNORE_MODULE, true);


export interface ActivityMetadata {
    module: string;
    feature: string;
    status: string;
}
export const ACTIVITY_METADATA_KEY = 'activity_metadata';
export const ActivityMeta = (data: ActivityMetadata) =>
    SetMetadata(ACTIVITY_METADATA_KEY, data);
