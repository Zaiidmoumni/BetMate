export default () => ({
  mollie: {
    apiKey: process.env.MOLLIE_API_KEY,
    webhookUrl: process.env.MOLLIE_WEBHOOK_URL,
    redirectUrl: process.env.MOLLIE_REDIRECT_URL,
  },
  payment: {
    defaultCurrency: 'EUR',
    maxDeposit: 10000,
    minDeposit: 10,
  },
});
