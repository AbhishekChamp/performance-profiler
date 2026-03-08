import { rootRoute } from './routes/__root.route';
import { indexRoute } from './routes/index.route';

export const routeTree = rootRoute.addChildren([indexRoute]);
