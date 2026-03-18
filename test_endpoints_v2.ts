
import axios from 'axios';

const endpoints = [
  'https://www.tzevaadom.co.il/alerts/history',
  'https://www.tzevaadom.co.il/en/alerts/history',
  'https://www.tzevaadom.co.il/alerts/all',
  'https://www.tzevaadom.co.il/en/alerts/all',
  'https://www.tzevaadom.co.il/api/alerts/history',
  'https://www.tzevaadom.co.il/api/v1/alerts/history',
  'https://www.tzevaadom.co.il/api/v2/alerts/history',
  'https://www.tzevaadom.co.il/api/v3/alerts/history',
];

async function testEndpoints() {
  for (const url of endpoints) {
    try {
      console.log(`Testing: ${url}`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
        },
        timeout: 5000,
      });
      console.log(`SUCCESS: ${url} - Status: ${response.status}`);
      if (response.data) {
        console.log(`Data preview: ${JSON.stringify(response.data).substring(0, 200)}`);
      }
    } catch (error: any) {
      console.log(`FAILED: ${url} - Status: ${error.response?.status || error.message}`);
    }
  }
}

testEndpoints();
