const axios = require('axios');

const getAIDescription = async (req, res) => {
    const { name, description } = req.body;

    if (!description || !name) {
        return res.status(400).json({ error: 'Both name and description are required' });
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo', // or 'gpt-4' if needed
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that enhances event descriptions.',
                    },
                    {
                        role: 'user',
                        content: `Expand and enhance the following description: "${description}" for the event "${name}".`
                    }
                ],
                max_tokens: 200,
                temperature: 0.7,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );

        const expandedDescription = response.data.choices[0].message.content.trim();
        res.status(200).json({
            status: 'success',
            data: expandedDescription,
        });
    } catch (error) {
        console.error('Error calling OpenAI API:', error.message);
        res.status(500).json({ status: 'failed', error: 'Failed to expand description' });
    }
};

module.exports = { getAIDescription };
