export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ success: true });
    }

    return res.status(response.status).json(data);
  } catch {
    return res.status(500).json({ error: 'Failed to reach Loops API' });
  }
}
