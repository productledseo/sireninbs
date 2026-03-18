
import axios from 'axios';

async function testLocalApi() {
  const url = "http://localhost:3000/api/alerts";
  try {
    const resp = await axios.get(url, { timeout: 15000 });
    console.log("Success! Status:", resp.status);
    console.log("Data:", JSON.stringify(resp.data).substring(0, 500));
  } catch (e: any) {
    console.log("Failed:", e.message);
    if (e.response) {
      console.log("Status:", e.response.status);
      console.log("Data:", JSON.stringify(e.response.data));
    }
  }
}

testLocalApi();
