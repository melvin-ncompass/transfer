import { Injectable, Logger } from "@nestjs/common";
import amqp, { ChannelWrapper } from "amqp-connection-manager";
import { Channel } from "amqplib";

@Injectable()
export class ProducerService {
  private channelWrapper: ChannelWrapper;
  private logger = new Logger(ProducerService.name);

  constructor() {
    const connection = amqp.connect([
      `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}${process.env.RABBITMQ_VHOST}`,
    ]);
    this.channelWrapper = connection.createChannel({
      setup: (channel: Channel) => {
        channel.assertQueue(process.env.ACTIVITY_QUEUE!, { durable: true });
        channel.assertQueue(process.env.EMAIL_ATTACHMENT_QUEUE, {
          durable: true,
        });
      },
    });
  }

  async addToFileGenerationQueue(payload: any) {
    await this.channelWrapper.sendToQueue(
      process.env.ACTIVITY_QUEUE!,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true } as any
    );
    this.logger.log(`Payload sent to fileGenerationQueue`);
  }

  async emailAttachemtnQueue(payload: any) {
    await this.channelWrapper.sendToQueue( 
      process.env.EMAIL_ATTACHMENT_QUEUE!,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true } as any
    );
    this.logger.log(`Payload sent to emailAttachemtnQueue`);
  }
}
