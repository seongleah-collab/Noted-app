export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, phone } = req.body || {};

  if ((!email || typeof email !== 'string') && (!phone || typeof phone !== 'string')) {
    return res.status(400).json({ error: 'Email or phone is required' });
  }

  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const contact = {};
  if (phone) contact.phone = phone;

  // Loops requires an email for contact creation. If only phone was
  // provided, use a placeholder so the contact still gets created.
  contact.email = email || `phone_${phone.replace(/\D/g, '')}@placeholder.notedco.io`;
  contact.source = 'website';

  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(contact)
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
