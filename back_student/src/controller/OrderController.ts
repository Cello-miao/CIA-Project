import {validate} from 'class-validator';
import {Request, Response} from 'express';
import {getManager, getRepository} from 'typeorm';
import {Order} from '../entity/Order';
import {Product} from '../entity/Product';

class OrderController {
  public static listAll = async (_req: Request, res: Response) => {
    try {
      const orderRepository = getRepository(Order);
      const orders = await orderRepository.find({order: {id: 'ASC'}});
      res.send(orders);
    } catch (_error) {
      res.status(500).send('Unable to load orders');
    }
  };

  public static getOneById = async (req: Request, res: Response) => {
    const id: number = parseInt(req.params.id, 10);
    try {
      const orderRepository = getRepository(Order);
      const order = await orderRepository.findOneOrFail(id);
      res.status(200).send(order);
    } catch (_error) {
      res.status(404).send('Order not found');
    }
  };

  public static newOrder = async (req: Request, res: Response) => {
    const name = req.body.name;
    const amount = Number(req.body.amount);
    const productId = req.body.productId || (req.body.product && req.body.product.id);

    if (!name || !productId || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).send('Invalid order payload');
    }

    try {
      const result = await getManager().transaction(async manager => {
        const productRepository = manager.getRepository(Product);
        const orderRepository = manager.getRepository(Order);
        const product = await productRepository.findOneOrFail(productId);
        if (product.amount < amount) {
          throw new Error('Insufficient stock');
        }

        product.amount = product.amount - amount;
        const order = new Order();
        order.name = name;
        order.amount = amount;
        order.product = product;
        order.totalPrice = Number(product.price) * amount;

        const errors = await validate(order);
        if (errors.length > 0) {
          throw new Error('Validation failed');
        }

        await productRepository.save(product);
        return orderRepository.save(order);
      });

      res.status(201).send(result);
    } catch (_error) {
      res.status(400).send('Unable to create order');
    }
  };

  public static editOrder = async (req: Request, res: Response) => {
    const id: number = parseInt(req.params.id, 10);
    const name = req.body.name;
    const amount = Number(req.body.amount);
    const requestedProductId = req.body.productId || (req.body.product && req.body.product.id);

    if (!name || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).send('Invalid order payload');
    }

    try {
      const result = await getManager().transaction(async manager => {
        const productRepository = manager.getRepository(Product);
        const orderRepository = manager.getRepository(Order);
        const order = await orderRepository.findOneOrFail(id);
        const currentProduct = await productRepository.findOneOrFail(order.product.id);
        const nextProduct = await productRepository.findOneOrFail(requestedProductId || order.product.id);

        if (currentProduct.id === nextProduct.id) {
          const available = currentProduct.amount + order.amount;
          if (amount > available) {
            throw new Error('Insufficient stock');
          }
          currentProduct.amount = available - amount;
          await productRepository.save(currentProduct);
        } else {
          currentProduct.amount = currentProduct.amount + order.amount;
          if (nextProduct.amount < amount) {
            throw new Error('Insufficient stock');
          }
          nextProduct.amount = nextProduct.amount - amount;
          await productRepository.save(currentProduct);
          await productRepository.save(nextProduct);
        }

        order.name = name;
        order.amount = amount;
        order.product = currentProduct.id === nextProduct.id ? currentProduct : nextProduct;
        order.totalPrice = Number(order.product.price) * amount;

        const errors = await validate(order);
        if (errors.length > 0) {
          throw new Error('Validation failed');
        }

        return orderRepository.save(order);
      });

      res.status(200).send(result);
    } catch (_error) {
      res.status(404).send('Order not found or unable to update');
    }
  };

  public static deleteOrder = async (req: Request, res: Response) => {
    const id: number = parseInt(req.params.id, 10);
    try {
      await getManager().transaction(async manager => {
        const productRepository = manager.getRepository(Product);
        const orderRepository = manager.getRepository(Order);
        const order = await orderRepository.findOneOrFail(id);
        const product = await productRepository.findOneOrFail(order.product.id);
        product.amount = product.amount + order.amount;
        await productRepository.save(product);
        await orderRepository.delete(id);
      });

      res.status(204).send();
    } catch (_error) {
      res.status(404).send('Order not found');
    }
  };
}

export default OrderController;

