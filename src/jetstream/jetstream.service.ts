import { Injectable } from '@nestjs/common';
import {
  AckPolicy,
  Codec,
  ConsumerConfig,
  DeliverPolicy,
  JSONCodec,
  JetStreamClient,
  JetStreamManager,
  NatsConnection,
  RetentionPolicy,
  StreamInfo,
  connect,
} from 'nats';
import {
  NatsJetStreamServerOptions,
  NatsStreamConfig,
} from './jetstream.interface';

export interface Patient {
  name: string;
  age: number;
  num: number;
}

@Injectable()
export class NatsJetStreamServer {
  #nc: NatsConnection;
  #codec: Codec<Patient> = JSONCodec();
  #jsm!: JetStreamManager;
  #js!: JetStreamClient;
  options!: NatsJetStreamServerOptions;

  async connect() {
    if (!this.#nc) {
      this.#nc = await connect(this.options.connectionOptions);
      if (this.options.connectionOptions.connectedHook) {
        this.options.connectionOptions.connectedHook(this.#nc);
      }
      this.#js = await this.#nc.jetstream();
      this.#jsm = await this.#nc.jetstreamManager();

      // 可建立多個stream Option
      const streamOptions = [
        {
          // stream name
          name: 'OPD',
          subjects: [
            'order.>',
            'patient.>',
            'opd.>',
            'loginInfo.>',
            'userAccount.>',
            'news.>',
            'appPage.>',
            'appStore.>',
            'auth.>',
            'forgetPasswordUser.>',
          ],
          retention: RetentionPolicy.Interest,
        },
        // {
        //   name: 'patient',
        //   subjects: ['patient.>'],
        //   retention: RetentionPolicy.Interest,
        // },
      ];

      const consumerOptions: Partial<ConsumerConfig>[] = [
        {
          durable_name: 'order',
          ack_policy: AckPolicy.Explicit,
          filter_subject: 'order.>',
          deliver_policy: DeliverPolicy.Last,
        },
        {
          durable_name: 'loginInfo',
          ack_policy: AckPolicy.Explicit,
          filter_subject: 'loginInfo.>',
          deliver_policy: DeliverPolicy.Last,
        },
        {
          durable_name: 'userAccount',
          ack_policy: AckPolicy.Explicit,
          filter_subject: 'userAccount.>',
          deliver_policy: DeliverPolicy.Last,
        },
        {
          durable_name: 'patient',
          ack_policy: AckPolicy.Explicit,
          filter_subject: 'patient.>',
          deliver_policy: DeliverPolicy.Last,
          ack_wait: 5000000000,
        },
        {
          durable_name: 'opd',
          ack_policy: AckPolicy.Explicit,
          filter_subject: 'opd.>',
          deliver_policy: DeliverPolicy.Last,
        },
        {
          durable_name: 'news',
          ack_policy: AckPolicy.Explicit,
          filter_subject: 'news.>',
          deliver_policy: DeliverPolicy.Last,
        },
        {
          durable_name: 'appPage',
          ack_policy: AckPolicy.Explicit,
          filter_subject: 'appPage.>',
          deliver_policy: DeliverPolicy.Last,
        },
        {
          durable_name: 'appStore',
          ack_policy: AckPolicy.Explicit,
          filter_subject: 'appStore.>',
          deliver_policy: DeliverPolicy.Last,
        },
        {
          durable_name: 'auth',
          ack_policy: AckPolicy.Explicit,
          filter_subject: 'auth.>',
          deliver_policy: DeliverPolicy.Last,
        },
        {
          durable_name: 'forgetPasswordUser',
          ack_policy: AckPolicy.Explicit,
          filter_subject: 'forgetPasswordUser.>',
          deliver_policy: DeliverPolicy.Last,
        },
      ];

      // 建立Stream
      await this.createStream(streamOptions);

      // 刪除Stream
      // this.deleteStream('OPD');

      // 建立Consumer
      await this.createConsumer('OPD', consumerOptions);

      // 查看全部的stream
      const streamList = await this.#jsm.streams.list().next();
      console.log(streamList);

      // 查看指定的consumer，需要指定的stream和consumer
      const consumer = await this.getConsumer('OPD', 'patient');
      console.log(consumer);
    }
  }

  // 創建stream
  async createStream(streamOptions: NatsStreamConfig[]) {
    for (const streamOption of streamOptions) {
      const streams = await this.#jsm.streams.list().next();
      const stream = streams.find((x) => x.config.name === streamOption.name);
      if (!stream) {
        await this.#jsm.streams.add(streamOption!);
        return;
      }
      await this.#jsm.streams.update(stream!.config.name, {
        ...stream!.config,
        ...streamOption!,
      });
    }
  }

  // 創建consumer
  async createConsumer(
    stream: string,
    consumerConfigs: Partial<ConsumerConfig>[],
  ) {
    for (const consumerConfig of consumerConfigs) {
      const conumsers = await this.#jsm.consumers.list(stream).next();

      const consumer = conumsers.find(
        (x) =>
          x.config.name === consumerConfig.durable_name || consumerConfig.name,
      );
      consumer
        ? await this.#jsm.consumers.update(
            stream,
            consumerConfig.durable_name! || consumerConfig.name!,
            consumerConfig,
          )
        : await this.#jsm.consumers.add(stream, consumerConfig);
    }
  }
  // 刪除stream
  async deleteStream(stream: string) {
    await this.#jsm.streams.delete(stream);
  }
  // 刪除consumer
  async delteConsumer(stream: string, consumer: string) {
    this.#jsm.consumers.delete(stream, consumer);
  }
  // 更新stream
  async updateStream(stream: string, streamOptions: NatsStreamConfig) {
    this.#jsm.streams.update(stream, streamOptions);
  }
  // 更新consumer
  async updateConsumer(
    stream: string,
    durable: string,
    consumerConfig: Partial<ConsumerConfig>,
  ) {
    this.#jsm.consumers.update(stream, durable, consumerConfig);
  }

  // 取得多個stream
  async getStreams(): Promise<StreamInfo[]> {
    return await this.#jsm.streams.list().next();
  }
  // 取得單個consumer
  async getConsumer(stream: string, consumer: string) {
    return await this.#jsm.consumers.info(stream, consumer);
  }
  // 取得多個consumer
  async getConsumers(stream: string) {
    return await this.#jsm.consumers.list(stream).next();
  }
}
