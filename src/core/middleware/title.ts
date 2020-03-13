import global from '../../shim/global';
import { create } from '../vdom';

const factory = create();

export const title = factory(function() {
	return {
		get() {
			return global.document.title;
		},
		set(title: string) {
			global.document.title = title;
		}
	};
});

export default title;
