import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class AppController {
  @Get('health')
  health() {
    return { status: 'OK', message: 'AI Assistant Server is running' };
  }

  @Get('config')
  config() {
    return {
      apiKey: process.env.DEEPSEEK_API_KEY || null,
      model: 'deepseek-chat',
      maxTokens: 1000,
      temperature: 0.7,
      userData: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        company: 'Tech Corp Inc.',
        title: 'Software Engineer',
      },
    };
  }
}


