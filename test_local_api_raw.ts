
import axios from 'axios';

async function testLocalApiRaw() {
  const url = "http://localhost:3000/api/alerts";
  try {
    const resp = await axios.get(url, { timeout: 15000, responseType: 'text' });
    console.log("Success! Status:", resp.status);
    console.log("Headers:", JSON.stringify(resp.headers));
    console.log("Body:", resp.data.substring(0, 500));
  } catch (e: any) {
    console.log("Failed:", e.message);
    if (e.response) {
      console.log("Status:", e.response.status);
      console.log("Headers:", JSON.stringify(e.response.headers));
      console.log("Body:", e.response.data.substring(0, 500));
    }
  }
}

testLocalApiRaw();
