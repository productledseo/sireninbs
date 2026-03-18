import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import { subMinutes, isAfter, parse } from "date-fns";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global logger
  app.use((req, res, next) => {
    console.log(`[DEBUG] ${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });

  // API routes
  app.get(["/api/alerts", "/api/alerts/"], async (req, res) => {
    console.log(`[${new Date().toISOString()}] Handling /api/alerts request`);
    const redAlertUrl = "https://api.redalert.me/alerts";
    const tzevaadomUrl = "https://www.tzevaadom.co.il/static/historical/all.json";
    const orefUrls = [
      "https://www.oref.org.il/WarningMessages/History/AlertsHistory.json",
      "https://www.oref.org.il/WarningMessages/alert/History.json"
    ];

    let alerts = null;
    let source = "redalert";

    try {
      // Try RedAlert.me first
      const response = await axios.get(redAlertUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 5000
      });
      alerts = response.data;
      if (!Array.isArray(alerts)) throw new Error("RedAlert data is not an array");
    } catch (error: any) {
      console.error("Error fetching from RedAlert:", error.message);
      source = "tzevaadom";
      
      try {
        // Try Tzevaadom second
        const response = await axios.get(tzevaadomUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.tzevaadom.co.il/en/historical/",
          },
          timeout: 10000
        });
        alerts = response.data;
        if (!Array.isArray(alerts)) throw new Error("Tzevaadom data is not an array");
      } catch (tzevaError: any) {
        console.error("Error fetching from Tzevaadom:", tzevaError.message);
        source = "oref";
        
        // Fallback to Oref
        for (const url of orefUrls) {
          try {
            const response = await axios.get(url, {
              headers: {
                "Host": "www.oref.org.il",
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "en-US,en;q=0.9,he;q=0.8",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Pragma": "no-cache",
                "Referer": url.includes("History") ? "https://www.oref.org.il/eng/alerts-history" : "https://www.oref.org.il/12481-he/Pakar.aspx",
                "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": '"Windows"',
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "X-Requested-With": "XMLHttpRequest"
              },
              timeout: 10000
            });
            alerts = response.data;
            if (Array.isArray(alerts)) break;
          } catch (orefError: any) {
            console.error(`Error fetching from Oref (${url}):`, orefError.message);
          }
        }
      }
    }

    try {
      if (!alerts || !Array.isArray(alerts)) {
        console.error(`[${new Date().toISOString()}] No alerts found from any source`);
        return res.status(500).json({ 
          status: "error", 
          message: "Failed to fetch alerts from all sources" 
        });
      }

      const nowTs = Math.floor(Date.now() / 1000);
      const twentyMinutesAgoTs = nowTs - (20 * 60);

      let recentAlerts: any[] = [];

      if (source === "redalert") {
        // RedAlert format: [{"id":452192,"date":1773841200,"area":"חוות שדה","threat":"missiles"}]
        recentAlerts = alerts.filter((alert: any) => {
          return alert.date >= twentyMinutesAgoTs;
        }).map(alert => ({
          cities: [alert.area],
          timestamp: alert.date,
          category: alert.threat
        }));
      } else if (source === "tzevaadom") {
        // Tzevaadom format: [[id, category, [cities], timestamp], ...]
        recentAlerts = alerts.filter((entry: any) => {
          return Array.isArray(entry) && entry.length >= 4 && entry[3] >= twentyMinutesAgoTs;
        }).map(entry => ({
          cities: entry[2],
          timestamp: entry[3],
          category: entry[1]
        }));
      } else {
        // Oref format: [{alertDate, data, category_desc, ...}]
        recentAlerts = alerts.filter((alert: any) => {
          try {
            let alertTime: Date;
            if (alert.alertDate && alert.alertDate.includes('.')) {
              const [datePart, timePart] = alert.alertDate.split(' ');
              const [day, month, year] = datePart.split('.');
              const [hour, minute, second] = timePart.split(':');
              alertTime = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
              );
            } else {
              alertTime = new Date(alert.alertDate);
            }
            return isAfter(alertTime, subMinutes(new Date(), 20));
          } catch (e) {
            return false;
          }
        }).map(alert => ({
          cities: [alert.data],
          timestamp: Math.floor(new Date(alert.alertDate).getTime() / 1000),
          category: alert.category_desc
        }));
      }

      const hasBeitShemesh = recentAlerts.some((alert: any) => {
        return alert.cities.some((city: string) => 
          city.includes("בית שמש") || city.toLowerCase().includes("beit shemesh")
        );
      });

      if (!hasBeitShemesh) {
        return res.json({ 
          status: "no alerts in the last 20 minutes",
          recentAlerts: recentAlerts.length,
          source
        });
      }

      const hasJerusalem = recentAlerts.some((alert: any) => {
        return alert.cities.some((city: string) => 
          city.includes("ירושלים") || city.toLowerCase().includes("jerusalem")
        );
      });

      if (hasJerusalem) {
        return res.json({ 
          status: "siren expected",
          beitShemesh: true,
          jerusalem: true,
          source
        });
      } else {
        return res.json({ 
          status: "siren maybe",
          beitShemesh: true,
          jerusalem: false,
          source
        });
      }

    } catch (error: any) {
      console.error("Error processing alerts:", error.message);
      res.status(500).json({ status: "error", message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
