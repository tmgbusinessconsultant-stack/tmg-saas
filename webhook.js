const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
app.use(express.json());
const PLAN_MAP = {
  'P-6JD50850NE6749845NLPPESI': { name: 'starter', billing: 'monthly', leads: 100 },
  'P-75J29224C3625300JNLPPPSI': { name: 'starter', billing: 'annual', leads: 100 },
  'P-6JB47037J1H7198935NLPP4AI': { name: 'pro', billing: 'monthly', leads: 500 },
  'P-4KL53403RN578542RNLPQA5Q': { name: 'pro', billing: 'annual', leads: 500 },
  'P-01J52058YU3S05116NLPQF6Q': { name: 'growth', billing: 'monthly', leads: 999999 },
  'P-48A98289TE6078010NLPQJSQ': { name: 'growth', billing: 'annual', leads: 999999 },
};
app.post('/paypal-webhook', async (req, res) => {
  const event = req.body;
  console.log('Webhook:', event.event_type);
  if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED' || event.event_type === 'PAYMENT.SALE.COMPLETED') {
    const subscription = event.resource;
    const subscriptionID = subscription.id || subscription.billing_agreement_id;
    const planId = subscription.plan_id;
    const email = subscription.subscriber ? subscription.subscriber.email_address : 'unknown';
    const planInfo = PLAN_MAP[planId];
    if (!planInfo) { console.log('Unknown plan:', planId); return res.sendStatus(200); }
    console.log('NEW SUB: ' + email + ' - ' + planInfo.name + ' - ID: ' + subscriptionID);
  }
  if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
    console.log('Cancelled: ' + event.resource.id);
  }
  res.sendStatus(200);
});
app.get('/', (req,res) => res.send('TMG Webhook LIVE'));
app.listen(3000, () => console.log('Webhook running on http://localhost:3000/paypal-webhook'));
