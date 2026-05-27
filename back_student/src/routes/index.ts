import {Router} from 'express';
import auth from './auth';
import order from './order';
import product from './product';
import user from './user';

const routes = Router();

routes.use('/auth', auth);
routes.use('/user', user);
routes.use('/product', product);
routes.use('/order', order);

export default routes;
