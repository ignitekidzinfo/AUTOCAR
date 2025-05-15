declare module 'zustand' {
  export type SetState<T> = (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean
  ) => void;
  
  export type GetState<T> = () => T;
  
  export type StateCreator<T> = (
    setState: SetState<T>,
    getState: GetState<T>,
    store: any
  ) => T;
  
  export function create<T>(initializer: StateCreator<T>): () => T & { getState: GetState<T>, setState: SetState<T> };
}

declare module 'zustand/middleware' {
  import { StateCreator } from 'zustand';
  
  export type StorageValue<T> = {
    state: T;
    version?: number;
  };
  
  export interface StateStorage {
    getItem: (name: string) => string | null | Promise<string | null>;
    setItem: (name: string, value: string) => void | Promise<void>;
    removeItem: (name: string) => void | Promise<void>;
  }
  
  export type PersistOptions<T, U> = {
    name: string;
    storage?: StateStorage;
    partialize?: (state: T) => U;
    onRehydrateStorage?: (state: U) => ((state?: U, error?: Error) => void) | void;
    version?: number;
    migrate?: (persistedState: any, version: number) => U | Promise<U>;
    merge?: (persistedState: any, currentState: T) => T;
  };
  
  export function persist<T, U>(
    stateCreator: StateCreator<T>,
    options: PersistOptions<T, U>
  ): StateCreator<T>;
  
  export function createJSONStorage<T>(): StateStorage;
} 