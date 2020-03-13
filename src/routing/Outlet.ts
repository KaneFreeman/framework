import { create, diffProperty, invalidator } from '../core/vdom';
import injector from '../core/middleware/injector';
import icache from '../core/middleware/icache';
import title from '../core/middleware/title';
import { DNode } from '../core/interfaces';
import { MatchDetails } from './interfaces';
import Router from './Router';

export interface OutletProperties {
	renderer: (matchDetails: MatchDetails) => DNode | DNode[];
	id: string;
	routerKey?: string;
	title?: string | ((matchDetails: MatchDetails) => string);
}

const factory = create({ icache, injector, diffProperty, invalidator, title }).properties<OutletProperties>();

export const Outlet = factory(function Outlet({
	middleware: { icache, injector, diffProperty, invalidator, title: titleMiddleware },
	properties
}) {
	const { renderer, id, routerKey = 'router', title: titleRender } = properties();
	const currentHandle = icache.get<Function>('handle');
	if (!currentHandle) {
		const handle = injector.subscribe(routerKey);
		if (handle) {
			icache.set('handle', () => handle);
		}
	}
	diffProperty('routerKey', (current: OutletProperties, next: OutletProperties) => {
		const { routerKey: currentRouterKey = 'router' } = current;
		const { routerKey = 'router' } = next;
		if (routerKey !== currentRouterKey) {
			const currentHandle = icache.get<Function>('handle');
			if (currentHandle) {
				currentHandle();
			}
			const handle = injector.subscribe(routerKey);
			if (handle) {
				icache.set('handle', () => handle);
			}
		}
		invalidator();
	});
	const router = injector.get<Router>(routerKey);

	if (router) {
		const outletContext = router.getOutlet(id);
		if (outletContext) {
			const { queryParams, params, type, isError, isExact } = outletContext;
			const result = renderer({ queryParams, params, type, isError, isExact, router });
			if (titleRender) {
				let title: string;
				if (typeof titleRender === 'function') {
					title = titleRender({ queryParams, params, type, isError, isExact, router });
				} else {
					title = titleRender;
				}
				titleMiddleware.set(title);
			}
			if (result) {
				return result;
			}
		}
	}
	return null;
});

export default Outlet;
