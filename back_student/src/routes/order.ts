import {Router} from 'express';
import OrderController from '../controller/OrderController';
import {checkJwt} from '../middlewares/checkJwt';
import {checkRole} from '../middlewares/checkRole';

const router = Router();

router.get('/', [checkJwt, checkRole(['ADMIN'])], OrderController.listAll);
router.get('/:id([0-9]+)', [checkJwt, checkRole(['ADMIN'])], OrderController.getOneById);
router.post('/', [checkJwt, checkRole(['ADMIN'])], OrderController.newOrder);
router.patch('/:id([0-9]+)', [checkJwt, checkRole(['ADMIN'])], OrderController.editOrder);
router.delete('/:id([0-9]+)', [checkJwt, checkRole(['ADMIN'])], OrderController.deleteOrder);

export default router;

