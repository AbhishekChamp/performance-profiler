import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root.route';
import { IndexComponent } from './index.component';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexComponent,
});
