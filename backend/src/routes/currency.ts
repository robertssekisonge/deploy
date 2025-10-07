import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all supported currencies
router.get('/currencies', async (req, res) => {
  try {
    const currencies = [
      { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX', exchangeRate: 1.0 },
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 3700.0 },
      { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 4000.0 },
      { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 4600.0 },
      { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', exchangeRate: 25.0 },
      { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', exchangeRate: 1.6 },
      { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', exchangeRate: 3.0 },
    ];
    
    res.json(currencies);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({ error: 'Failed to fetch currencies' });
  }
});

// Get exchange rates
router.get('/exchange-rates', async (req, res) => {
  try {
    const rates = await prisma.currencyExchangeRates.findMany({
      orderBy: { effectiveDate: 'desc' },
      take: 100 // Get latest 100 rates
    });
    
    res.json(rates);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

// Update exchange rates
router.post('/exchange-rates', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, rate } = req.body;
    
    if (!fromCurrency || !toCurrency || !rate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const exchangeRate = await prisma.currencyExchangeRates.create({
      data: {
        fromCurrency,
        toCurrency,
        rate: parseFloat(rate),
        effectiveDate: new Date()
      }
    });
    
    res.json(exchangeRate);
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    res.status(500).json({ error: 'Failed to update exchange rate' });
  }
});

// Convert currency
router.post('/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    
    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Use hardcoded exchange rates for now
    const exchangeRates: Record<string, number> = {
      'UGX': 1.0,
      'USD': 3700.0,
      'EUR': 4000.0,
      'GBP': 4600.0,
      'KES': 25.0,
      'TZS': 1.6,
      'RWF': 3.0,
    };
    
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    
    if (!fromRate || !toRate) {
      return res.status(400).json({ error: 'Exchange rates not found for currencies' });
    }
    
    // Convert: from -> UGX -> to
    const ugxAmount = parseFloat(amount) * fromRate;
    const convertedAmount = ugxAmount / toRate;
    
    res.json({
      originalAmount: parseFloat(amount),
      originalCurrency: fromCurrency,
      convertedAmount,
      convertedCurrency: toCurrency,
      exchangeRate: fromRate / toRate,
      ugxEquivalent: ugxAmount
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

export default router;
