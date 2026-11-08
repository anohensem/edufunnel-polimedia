module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = req.body;
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  let n8nTerhubung = false;
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      n8nTerhubung = response.ok;
    } catch (err) {
      console.error("Gagal kirim ke n8n:", err.message);
    }
  }

  return res.status(200).json({
    status: "success",
    n8n_sent: n8nTerhubung,
    data: payload
  });
};