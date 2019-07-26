import { create, invalidator } from '../vdom';
import createCacheMiddleware from './cache';

interface CacheWrapper<T = any> {
	status: 'pending' | 'resolved';
	value: T;
}

interface IcacheGetOrSet<C> {
	<K extends keyof C>(key: K, value: () => Promise<C[K]>): C[K] | undefined;
	<K extends keyof C>(key: K, value: () => C[K]): C[K];
	<K extends keyof C>(key: K, value: C[K]): C[K];
}

interface IcacheSet<C> {
	<K extends keyof C>(key: K, value: () => Promise<C[K]>): void;
	<K extends keyof C>(key: K, value: () => C[K]): void;
	<K extends keyof C>(key: K, value: C[K]): void;
}

interface IcacheResult<C> {
	getOrSet: IcacheGetOrSet<C>;
	get<K extends keyof C>(key: K): C[K];
	set: IcacheSet<C>;
	clear(): void;
}

type NotFunction<T> = T extends Function ? never : T;

export const createIcacheMiddleware = <C extends {} = any>(initialValue: C) => {
	const cache = createCacheMiddleware<C>(initialValue);
	const factory = create({ cache, invalidator });
	const cacheStatusMap = new Map<keyof C, 'pending' | 'resolved'>(
		Object.keys(initialValue).map((key) => [key as keyof C, 'resolved'])
	);

	return factory(
		({ middleware: { invalidator, cache } }): IcacheResult<C> => {
			return {
				getOrSet<K extends keyof C>(key: K, value: any): any {
					let cachedValue = cache.get(key);
					if (!cachedValue) {
						this.set(key, value);
					}
					return this.get(key);
				},
				get<K extends keyof C>(key: K): Partial<C>[K] {
					const cachedValue = cache.get(key);
					const cachedStatus = cacheStatusMap.get(key);
					if (cachedStatus === 'pending') {
						return undefined;
					}
					return cachedValue;
				},
				set<K extends keyof C>(key: K, value: any): void {
					if (typeof value === 'function') {
						value = value();
						if (value && typeof value.then === 'function') {
							cache.set(key, value);
							cacheStatusMap.set(key, 'pending');
							value.then((result: any) => {
								const cachedValue = cache.get(key);
								if (cachedValue && cachedValue === value) {
									cache.set(key, result);
									cacheStatusMap.set(key, 'resolved');
									invalidator();
								}
							});
							return;
						}
					}
					cache.set(key, value);
					cacheStatusMap.set(key, 'resolved');
					invalidator();
				},
				clear(): void {
					cache.clear();
				}
			};
		}
	);
};

export default createIcacheMiddleware;
