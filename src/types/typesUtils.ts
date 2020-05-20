import { EventData } from 'web3-eth-contract';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ITypedEventData<T> extends EventData {
  returnValues: T;
}
