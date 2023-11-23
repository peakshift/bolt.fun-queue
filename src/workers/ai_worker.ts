import { createWorker } from '../queue';
import { AIQueue, GetQueueJobDataType } from '../@types/queues.types';
import OpenAI from 'openai';
import { env } from '../env';
import axios from 'axios';

export const createAIWorker = (queueName = 'ai') =>
  createWorker<AIQueue['Job'], any, AIQueue['JobNames']>(
    queueName,
    async (job) => {
      const logger = job.log.bind(job);

      try {
        if (job.data.type === 'generate-story-og-summary') {
          await handleGenerateOgSummary(job.data.data);
        }
      } catch (error) {
        console.log(error);
        logger(String(error));
        throw error;
      }
    }
  );

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

async function handleGenerateOgSummary(
  data: GetQueueJobDataType<AIQueue, 'generate-story-og-summary'>['data']
) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Your job is to write an og:description meta tag for an article.
        Follow these guidelines:
        - Create a compelling summary in 1-2 sentences, max 110 characters.
        - Begin with the most engaging part to attract clicks.
        - Alwasy output a JSON object with a key 'summary' for the description you generate.
        
        Here is the article surrounded by triple backticks to generate the description from:
        \`\`\`
        Title: ${data.story.title}
        
        ${data.story.body}
        \`\`\`
  `,
      },
    ],
    model: 'gpt-3.5-turbo',
  });

  if (completion.choices[0].finish_reason !== 'stop') return null;

  const content = completion.choices[0].message.content;

  const json = JSON.parse(content ?? '{}');

  const summary = json.summary;

  if (!summary) throw new Error('Summary not found in response');

  makeCallbackRequest(data.callback_url, {
    type: 'generate-story-og-summary',
    story_id: data.story.id,
    summary,
  });
}

async function makeCallbackRequest(
  url: string,
  data: string | Record<any, any>
) {
  return axios.post(url, data, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(
        `${env.BF_SERVERLESS_SERVICE_USERNAME}:${env.BF_SERVERLESS_SERVICE_PASS}`
      ).toString('base64')}`,
    },
  });
}
