'use server';
import express from 'express';
import { postMessages } from '../server/controllers/messagesController';

const route = express.Router();

route.post('/message', postMessages);

export default route;
