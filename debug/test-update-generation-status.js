const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.INTERNAL_API_KEY || '';

/**
 * Update generation status via external API.
 * @param {string} id - Generation ID
 * @param {'image' | 'video'} [type='image'] - Generation type
 */
export async function updateGenerationStatus(id, type = 'image') {
  if (!id) {
    throw new Error('id is required');
  }

  if (type !== 'image' && type !== 'video') {
    throw new Error("type must be 'image' or 'video'");
  }

  const response = await fetch(`${BASE_URL}/api/external/generations/update-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ id, type }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.code !== 0) {
    const message = data.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const [, , id, type] = process.argv;
  updateGenerationStatus(id, type || 'image')
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
