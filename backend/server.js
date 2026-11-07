const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/hitung-peluang', async (req, res) => {
  const payload = req.body;
  console.log("Data diterima dari Web:", payload);

  // Kirim otomatis ke Webhook n8n
  const webhookUrl = process.env.N8N_WEBHOOK_URL || "http://n8n:5678/webhook-test/prediksi-polimedia";
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log("Status kirim ke n8n:", response.status);
  } catch (err) {
    console.error("Gagal kirim ke n8n (Pastikan tombol Listen di n8n sudah diklik):", err.message);
  }

  res.json({
    status: "success",
    message: "Data berhasil diproses Backend & dikirim ke n8n",
    data: payload
  });
});

app.listen(4000, () => console.log('Backend Polimedia aktif di port 4000'));