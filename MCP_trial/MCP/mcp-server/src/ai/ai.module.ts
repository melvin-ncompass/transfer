import { Module } from '@nestjs/common';
import { GeminiProviderService } from './gemini.provider.service';

@Module({
    providers: [
        {
            provide: 'AIProvider',
            useClass: GeminiProviderService, // Easily swap with OpenAIProviderService later
        },
    ],
    exports: ['AIProvider'],
})
export class AiModule { }
