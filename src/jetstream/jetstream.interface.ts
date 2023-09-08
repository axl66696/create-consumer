import {
  ConnectionOptions,
  ConsumerConfig,
  JetStreamOptions,
  NatsConnection,
  StreamConfig,
} from 'nats';

export interface NatsJetStreamServerOptions {
  connectionOptions: Partial<NatsConnectionOptions> &
    Pick<NatsConnectionOptions, 'name'>;
  consumerOptions: Partial<ConsumerConfig>;
  jetStreamOptions?: JetStreamOptions;
  streamConfig?: NatsStreamConfig;
}

// 繼承NATS包中的連線Options
export interface NatsConnectionOptions extends ConnectionOptions {
  name: string;
  connectedHook?: (nc: NatsConnection) => void;
}

export interface NatsStreamConfig extends Partial<StreamConfig> {
  name: string;
  subjects: string[];
}
