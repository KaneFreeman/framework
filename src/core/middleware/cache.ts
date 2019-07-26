import { create, destroy } from '../vdom';
import Map from '../../shim/Map';

const factory = create({ destroy });

export const createCacheMiddleware = <C extends {} = {}>(initialValue: C) => {
	return factory(({ middleware: { destroy } }) => {
		const values = Object.keys(initialValue).map((k) => [k, initialValue[k]]) as [keyof C, any][];
		const cacheMap = new Map<keyof C, any>(values);
		destroy(() => {
			cacheMap.clear();
		});
		return {
			get<K extends keyof C>(key: K) {
				return cacheMap.get(key) as Partial<C>[K];
			},
			set<K extends keyof C>(key: K, value: C[K]): void {
				cacheMap.set(key, value);
			},
			clear(): void {
				cacheMap.clear();
			}
		};
	});
};

export default createCacheMiddleware;
