'use server';
import express from 'express';
import { getMessages } from '../controllers/messagesController';

const route = express.Router();

route.get('/message', getMessages);

export default route;
